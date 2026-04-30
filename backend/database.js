const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render/Neon PostgreSQL requires SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Thin query helpers that wrap pg.Pool for ergonomic use across routes.
 * - db.get    → first row or undefined
 * - db.all    → all rows
 * - db.run    → full pg Result (use when you need rowCount or RETURNING)
 * - db.query  → raw pg Result (same as db.run, kept for symmetry)
 *
 * For multi-statement transactions, acquire a dedicated client directly:
 *   const client = await pool.connect();
 *   try { await client.query('BEGIN'); ... await client.query('COMMIT'); }
 *   catch { await client.query('ROLLBACK'); throw e; }
 *   finally { client.release(); }
 */
const db = {
  query: (text, params) => pool.query(text, params),

  get: async (text, params) => {
    const { rows } = await pool.query(text, params);
    return rows[0];
  },

  all: async (text, params) => {
    const { rows } = await pool.query(text, params);
    return rows;
  },

  run: (text, params) => pool.query(text, params),
};

// ── Create tables ─────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      email     TEXT UNIQUE NOT NULL,
      password  TEXT NOT NULL,
      role      TEXT NOT NULL CHECK(role IN ('doctor','patient')),
      name      TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      category    TEXT
    );

    CREATE TABLE IF NOT EXISTS treatment_plans (
      id                  SERIAL PRIMARY KEY,
      name                TEXT NOT NULL,
      description         TEXT,
      min_conditions      INTEGER DEFAULT 0,
      max_conditions      INTEGER DEFAULT 99,
      sessions_per_week   INTEGER,
      duration_weeks      INTEGER,
      additional_services TEXT,
      price_range         TEXT
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id                  SERIAL PRIMARY KEY,
      patient_id          INTEGER NOT NULL REFERENCES users(id),
      doctor_id           INTEGER NOT NULL REFERENCES users(id),
      assessment_date     DATE DEFAULT CURRENT_DATE,
      notes               TEXT,
      recommended_plan_id INTEGER REFERENCES treatment_plans(id),
      created_at          TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assessment_conditions (
      id             SERIAL PRIMARY KEY,
      assessment_id  INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      condition_id   INTEGER NOT NULL REFERENCES conditions(id)
    );
  `);

  // ── Seed conditions ────────────────────────────────────────────────────────
  const { rows: [{ count: condCount }] } = await pool.query('SELECT COUNT(*) FROM conditions');
  if (parseInt(condCount) === 0) {
    const conditions = [
      ['Cervical Subluxation',         'Misalignment of vertebrae in the neck region',               'Cervical'],
      ['Cervical Disc Herniation',     'Bulging or ruptured disc in the neck causing nerve compression','Cervical'],
      ['Forward Head Posture',         'Head positioned forward relative to the shoulders',           'Cervical'],
      ['Thoracic Subluxation',         'Misalignment of vertebrae in the mid-back region',            'Thoracic'],
      ['Hyperkyphosis',                'Excessive outward curve of the thoracic spine (hunchback)',    'Thoracic'],
      ['Scoliosis',                    'Abnormal lateral curvature of the spine',                     'Thoracic'],
      ['Lumbar Subluxation',           'Misalignment of vertebrae in the lower back region',          'Lumbar'],
      ['Lumbar Disc Herniation',       'Bulging or ruptured disc in the lower back',                  'Lumbar'],
      ['Hyperlordosis',                'Excessive inward curve of the lumbar spine (swayback)',        'Lumbar'],
      ['Sacroiliac Joint Dysfunction', 'Dysfunction of the joint between spine and pelvis',           'Pelvic'],
      ['Spinal Stenosis',              'Narrowing of the spinal canal causing nerve pressure',        'Degenerative'],
      ['Degenerative Disc Disease',    'Progressive wear and tear of spinal discs',                   'Degenerative'],
      ['Facet Joint Syndrome',         'Inflammation or degeneration of facet joints',                'Degenerative'],
      ['Piriformis Syndrome',          'Piriformis muscle irritating the sciatic nerve',              'Soft Tissue'],
    ];
    for (const [name, description, category] of conditions) {
      await pool.query(
        'INSERT INTO conditions (name, description, category) VALUES ($1, $2, $3)',
        [name, description, category]
      );
    }
  }

  // ── Seed treatment plans ───────────────────────────────────────────────────
  const { rows: [{ count: planCount }] } = await pool.query('SELECT COUNT(*) FROM treatment_plans');
  if (parseInt(planCount) === 0) {
    const plans = [
      [
        'Basic Care',
        'Foundational chiropractic adjustments for mild spinal issues. Ideal for patients with 1–2 conditions who need routine maintenance and prevention.',
        1, 2, 2, 4,
        'Spinal adjustments · Postural education',
        '$200 – $400 / month',
      ],
      [
        'Standard Care',
        'Comprehensive spinal correction for moderate conditions. Combines manual adjustments with targeted exercises and lifestyle counseling.',
        3, 5, 3, 8,
        'Spinal adjustments · Therapeutic exercises · Postural education · Nutritional guidance',
        '$500 – $800 / month',
      ],
      [
        'Enhanced Care',
        'Intensive treatment for patients with multiple co-occurring conditions. Adds advanced rehabilitation modalities alongside regular adjustments.',
        6, 9, 4, 12,
        'Spinal adjustments · Therapeutic exercises · Massage therapy · Electrical muscle stimulation · Ultrasound therapy · Nutritional guidance',
        '$900 – $1,200 / month',
      ],
      [
        'Premium Wellness',
        'Our most comprehensive program for complex multi-system spinal conditions. Full-body rehabilitation with personalized, ongoing support.',
        10, 99, 5, 16,
        'Daily spinal adjustments · Advanced rehabilitation · Deep tissue massage · Spinal decompression therapy · Custom orthotics · Full nutritional plan · Lifestyle coaching',
        '$1,300 – $1,800 / month',
      ],
    ];
    for (const [name, description, minC, maxC, spw, dw, services, price] of plans) {
      await pool.query(
        `INSERT INTO treatment_plans
          (name,description,min_conditions,max_conditions,sessions_per_week,duration_weeks,additional_services,price_range)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [name, description, minC, maxC, spw, dw, services, price]
      );
    }
  }

  // ── Seed demo accounts ─────────────────────────────────────────────────────
  const { rows: [{ count: userCount }] } = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCount) === 0) {
    const hash = bcrypt.hashSync('demo1234', 10);
    await pool.query(
      'INSERT INTO users (email, password, role, name) VALUES ($1,$2,$3,$4)',
      ['doctor@clinic.com', hash, 'doctor', 'Dr. Sarah Johnson']
    );
    await pool.query(
      'INSERT INTO users (email, password, role, name) VALUES ($1,$2,$3,$4)',
      ['patient@example.com', hash, 'patient', 'John Smith']
    );
  }

  console.log('Database ready');
}

// Export pool so routes that need real transactions can call pool.connect()
module.exports = { db, pool, initDB };
