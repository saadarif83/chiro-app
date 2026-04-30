/**
 * routes/auth.js — Authentication routes.
 *
 * POST /api/auth/login           → email + password → JWT
 * POST /api/auth/register        → public patient self-registration → JWT
 * POST /api/auth/register-patient → doctor-only patient creation (no JWT returned)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// Single source of truth for the secret — also used by middleware/auth.js.
// In production this MUST be set as an environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'chiro-dev-secret-change-in-production';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db.get('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Public self-registration for new patients
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (name.trim().length < 2) return res.status(400).json({ error: 'Please enter your full name' });
    if (password.length < 6)    return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await db.get('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists) return res.status(409).json({ error: 'An account with that email already exists' });

    const { rows } = await db.run(
      'INSERT INTO users (email, password, role, name) VALUES ($1,$2,$3,$4) RETURNING id',
      [email.toLowerCase().trim(), bcrypt.hashSync(password, 10), 'patient', name.trim()]
    );
    const payload = { id: rows[0].id, email: email.toLowerCase().trim(), role: 'patient', name: name.trim() };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: payload });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Doctor registers a new patient account
router.post('/register-patient', auth(['doctor']), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await db.get('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const { rows } = await db.run(
      'INSERT INTO users (email, password, role, name) VALUES ($1,$2,$3,$4) RETURNING id',
      [email.toLowerCase().trim(), bcrypt.hashSync(password, 10), 'patient', name.trim()]
    );
    res.status(201).json({ message: 'Patient account created', id: rows[0].id });
  } catch (err) {
    console.error('POST /auth/register-patient error:', err);
    res.status(500).json({ error: 'Failed to create patient account' });
  }
});

module.exports = router;
