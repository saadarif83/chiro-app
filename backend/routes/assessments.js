const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

const getConditions = db.prepare(`
  SELECT c.* FROM conditions c
  JOIN assessment_conditions ac ON ac.condition_id = c.id
  WHERE ac.assessment_id = ?
  ORDER BY c.category, c.name
`);

// All assessments for a patient
router.get('/patient/:patientId', auth(['doctor', 'patient']), (req, res) => {
  const patientId = parseInt(req.params.patientId);

  if (req.user.role === 'patient' && req.user.id !== patientId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const assessments = db.prepare(`
    SELECT a.*, u.name AS doctor_name,
           tp.name AS plan_name, tp.description AS plan_description,
           tp.sessions_per_week, tp.duration_weeks,
           tp.additional_services, tp.price_range
    FROM assessments a
    JOIN users u ON u.id = a.doctor_id
    LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
    WHERE a.patient_id = ?
    ORDER BY a.created_at DESC
  `).all(patientId);

  res.json(assessments.map(a => ({ ...a, conditions: getConditions.all(a.id) })));
});

// Single assessment
router.get('/:id', auth(['doctor', 'patient']), (req, res) => {
  const assessment = db.prepare(`
    SELECT a.*, u.name AS doctor_name,
           tp.name AS plan_name, tp.description AS plan_description,
           tp.sessions_per_week, tp.duration_weeks,
           tp.additional_services, tp.price_range
    FROM assessments a
    JOIN users u ON u.id = a.doctor_id
    LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

  if (req.user.role === 'patient' && req.user.id !== assessment.patient_id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ ...assessment, conditions: getConditions.all(assessment.id) });
});

// Create assessment
router.post('/', auth(['doctor']), (req, res) => {
  const { patient_id, notes, condition_ids = [], recommended_plan_id, assessment_date } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

  const createAssessment = db.transaction(() => {
    const { lastInsertRowid: id } = db.prepare(`
      INSERT INTO assessments (patient_id, doctor_id, notes, recommended_plan_id, assessment_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      patient_id, req.user.id,
      notes || null,
      recommended_plan_id || null,
      assessment_date || new Date().toISOString().split('T')[0]
    );

    const insCondition = db.prepare(
      'INSERT INTO assessment_conditions (assessment_id, condition_id) VALUES (?, ?)'
    );
    condition_ids.forEach(cid => insCondition.run(id, cid));
    return id;
  });

  const newId = createAssessment();
  const assessment = db.prepare(`
    SELECT a.*, tp.name AS plan_name FROM assessments a
    LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
    WHERE a.id = ?
  `).get(newId);

  res.status(201).json({ ...assessment, conditions: getConditions.all(newId) });
});

// Update assessment
router.put('/:id', auth(['doctor']), (req, res) => {
  const { notes, condition_ids, recommended_plan_id } = req.body;
  const assessmentId = req.params.id;

  const existing = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId);
  if (!existing) return res.status(404).json({ error: 'Assessment not found' });

  db.transaction(() => {
    db.prepare(
      'UPDATE assessments SET notes = ?, recommended_plan_id = ? WHERE id = ?'
    ).run(notes ?? existing.notes, recommended_plan_id ?? existing.recommended_plan_id, assessmentId);

    if (Array.isArray(condition_ids)) {
      db.prepare('DELETE FROM assessment_conditions WHERE assessment_id = ?').run(assessmentId);
      const ins = db.prepare(
        'INSERT INTO assessment_conditions (assessment_id, condition_id) VALUES (?, ?)'
      );
      condition_ids.forEach(cid => ins.run(assessmentId, cid));
    }
  })();

  const updated = db.prepare(`
    SELECT a.*, tp.name AS plan_name FROM assessments a
    LEFT JOIN treatment_plans tp ON tp.id = a.recommended_plan_id
    WHERE a.id = ?
  `).get(assessmentId);

  res.json({ ...updated, conditions: getConditions.all(assessmentId) });
});

module.exports = router;
