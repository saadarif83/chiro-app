const express = require('express');
const { db } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// List all patients with assessment stats
router.get('/', auth(['doctor']), async (req, res) => {
  try {
    const patients = await db.all(`
      SELECT
        u.id, u.name, u.email, u.created_at,
        COUNT(a.id)::int        AS assessment_count,
        MAX(a.created_at)        AS last_assessment
      FROM users u
      LEFT JOIN assessments a ON a.patient_id = u.id
      WHERE u.role = 'patient'
      GROUP BY u.id
      ORDER BY u.name
    `);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single patient
router.get('/:id', auth(['doctor']), async (req, res) => {
  try {
    const patient = await db.get(
      "SELECT id, name, email, created_at FROM users WHERE id = $1 AND role = 'patient'",
      [req.params.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
