/**
 * routes/assessments.js — Assessment CRUD.
 *
 * GET  /api/assessments/patient/:patientId → all assessments for a patient
 * GET  /api/assessments/:id                → single assessment with conditions
 * POST /api/assessments                    → create (doctor only, transactional)
 * PUT  /api/assessments/:id               → update (doctor only)
 *
 * Patients may only read their own assessments (enforced by req.user checks).
 */
const express = require('express');
const { db, pool } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

async function getConditionsForAssessment(assessmentId) {
  return db.all(`
    SELECT c.* FROM conditions c
    JOIN assessment_conditions ac ON ac.condition_id = c.id
    WHERE ac.assessment_id = $1
    ORDER BY c.category, c.name
  `, [assessmentId]);
}

// All assessments for a patient
router.get('/patient/:patientId', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assessments = await db.all(`
      SELECT a.*, u.name AS doctor_name,
             tp.name AS plan_name, tp.description AS plan_description,
             tp.sessions_per_week, tp.duration_weeks,
             tp.additional_services, tp.price_range
      FROM assessments a
      JOIN users u ON u.id = a.doctor_id
      LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
      WHERE a.patient_id = $1
      ORDER BY a.created_at DESC
    `, [patientId]);

    const result = await Promise.all(
      assessments.map(async a => ({
        ...a,
        conditions: await getConditionsForAssessment(a.id)
      }))
    );
    res.json(result);
  } catch (err) {
    console.error('GET /assessments/patient/:id error:', err);
    res.status(500).json({ error: 'Failed to load assessments' });
  }
});

// Single assessment
router.get('/:id', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const assessment = await db.get(`
      SELECT a.*, u.name AS doctor_name,
             tp.name AS plan_name, tp.description AS plan_description,
             tp.sessions_per_week, tp.duration_weeks,
             tp.additional_services, tp.price_range
      FROM assessments a
      JOIN users u ON u.id = a.doctor_id
      LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
      WHERE a.id = $1
    `, [req.params.id]);

    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (req.user.role === 'patient' && req.user.id !== assessment.patient_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ ...assessment, conditions: await getConditionsForAssessment(assessment.id) });
  } catch (err) {
    console.error('GET /assessments/:id error:', err);
    res.status(500).json({ error: 'Failed to load assessment' });
  }
});

// Create assessment — uses a transaction so the assessment row and its
// condition links are always written atomically.
router.post('/', auth(['doctor']), async (req, res) => {
  const { patient_id, notes, condition_ids = [], recommended_plan_id, assessment_date } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO assessments (patient_id, doctor_id, notes, recommended_plan_id, assessment_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [
        patient_id,
        req.user.id,
        notes || null,
        recommended_plan_id || null,
        assessment_date || new Date().toISOString().split('T')[0],
      ]
    );
    const newId = rows[0].id;

    for (const cid of condition_ids) {
      await client.query(
        'INSERT INTO assessment_conditions (assessment_id, condition_id) VALUES ($1,$2)',
        [newId, cid]
      );
    }

    await client.query('COMMIT');

    const assessment = await db.get(
      `SELECT a.*, tp.name AS plan_name FROM assessments a
       LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
       WHERE a.id = $1`,
      [newId]
    );
    res.status(201).json({ ...assessment, conditions: await getConditionsForAssessment(newId) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /assessments error:', err);
    res.status(500).json({ error: 'Failed to save assessment' });
  } finally {
    client.release();
  }
});

// Update assessment
router.put('/:id', auth(['doctor']), async (req, res) => {
  try {
    const { notes, condition_ids, recommended_plan_id } = req.body;
    const assessmentId = req.params.id;

    const existing = await db.get('SELECT * FROM assessments WHERE id = $1', [assessmentId]);
    if (!existing) return res.status(404).json({ error: 'Assessment not found' });

    await db.run(
      'UPDATE assessments SET notes = $1, recommended_plan_id = $2 WHERE id = $3',
      [
        notes ?? existing.notes,
        recommended_plan_id ?? existing.recommended_plan_id,
        assessmentId
      ]
    );

    if (Array.isArray(condition_ids)) {
      await db.run('DELETE FROM assessment_conditions WHERE assessment_id = $1', [assessmentId]);
      for (const cid of condition_ids) {
        await db.run(
          'INSERT INTO assessment_conditions (assessment_id, condition_id) VALUES ($1,$2)',
          [assessmentId, cid]
        );
      }
    }

    const updated = await db.get(`
      SELECT a.*, tp.name AS plan_name FROM assessments a
      LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
      WHERE a.id = $1
    `, [assessmentId]);

    res.json({ ...updated, conditions: await getConditionsForAssessment(assessmentId) });
  } catch (err) {
    console.error('PUT /assessments/:id error:', err);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

module.exports = router;
