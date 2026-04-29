const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// List all patients with assessment stats
router.get('/', auth(['doctor']), (req, res) => {
  const patients = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.created_at,
      COUNT(a.id)      AS assessment_count,
      MAX(a.created_at) AS last_assessment
    FROM users u
    LEFT JOIN assessments a ON a.patient_id = u.id
    WHERE u.role = 'patient'
    GROUP BY u.id
    ORDER BY u.name
  `).all();
  res.json(patients);
});

// Get one patient
router.get('/:id', auth(['doctor']), (req, res) => {
  const patient = db.prepare(
    "SELECT id, name, email, created_at FROM users WHERE id = ? AND role = 'patient'"
  ).get(req.params.id);

  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

module.exports = router;
