/**
 * routes/conditions.js — Read-only reference data (seeded at startup).
 *
 * GET /api/conditions                  → all spinal conditions
 * GET /api/conditions/treatment-plans  → all treatment plan tiers
 */
const express = require('express');
const { db } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(['doctor', 'patient']), async (req, res) => {
  try {
    res.json(await db.all('SELECT * FROM conditions ORDER BY category, name'));
  } catch (err) {
    console.error('GET /conditions error:', err);
    res.status(500).json({ error: 'Failed to load conditions' });
  }
});

router.get('/treatment-plans', auth(['doctor', 'patient']), async (req, res) => {
  try {
    res.json(await db.all('SELECT * FROM treatment_plans ORDER BY min_conditions'));
  } catch (err) {
    console.error('GET /conditions/treatment-plans error:', err);
    res.status(500).json({ error: 'Failed to load treatment plans' });
  }
});

module.exports = router;
