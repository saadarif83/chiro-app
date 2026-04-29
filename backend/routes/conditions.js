const express = require('express');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(['doctor', 'patient']), (req, res) => {
  res.json(db.prepare('SELECT * FROM conditions ORDER BY category, name').all());
});

router.get('/treatment-plans', auth(['doctor', 'patient']), (req, res) => {
  res.json(db.prepare('SELECT * FROM treatment_plans ORDER BY min_conditions').all());
});

module.exports = router;
