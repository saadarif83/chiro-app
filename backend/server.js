/**
 * server.js — Express entry point for ChiroCare API.
 *
 * Start order: load .env → mount routes → init DB → listen.
 * The DB init is intentionally done before listen() so that the first
 * request never hits a cold database.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./database');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/patients',    require('./routes/patients'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/conditions',  require('./routes/conditions'));

// ── Serve built frontend in production ────────────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));

const PORT = process.env.PORT || 3001;

// Init DB first, then start listening
initDB()
  .then(() => app.listen(PORT, () => console.log(`ChiroCare running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
