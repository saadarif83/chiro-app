const express = require('express');
const { db } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(['doctor', 'patient']), async (req, res) => {
  try {
    res.json(await db.all('SELECT * FROM conditions ORDER BY category, name'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/treatment-plans', auth(['doctor', 'patient']), async (req, res) => {
  try {
    res.json(await db.all('SELECT * FROM treatment_plans ORDER BY min_conditions'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
