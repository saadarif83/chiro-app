const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'chiro.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('doctor', 'patient')),
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS treatment_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    min_conditions INTEGER DEFAULT 0,
    max_conditions INTEGER DEFAULT 99,
    sessions_per_week INTEGER,
    duration_weeks INTEGER,
    additional_services TEXT,
    price_range TEXT
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    assessment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    recommended_plan_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (recommended_plan_id) REFERENCES treatment_plans(id)
  );

  CREATE TABLE IF NOT EXISTS assessment_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL,
    condition_id INTEGER NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id)
  );
`);

// ── Seed conditions ──────────────────────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM conditions').get().c === 0) {
  const ins = db.prepare('INSERT INTO conditions (name, description, category) VALUES (?, ?, ?)');
  const seedConditions = db.transaction(() => {
    [
      ['Cervical Subluxation',          'Misalignment of vertebrae in the neck region',                     'Cervical'],
      ['Cervical Disc Herniation',      'Bulging or ruptured disc in the neck causing nerve compression',   'Cervical'],
      ['Forward Head Posture',          'Head positioned forward relative to the shoulders',                'Cervical'],
      ['Thoracic Subluxation',          'Misalignment of vertebrae in the mid-back region',                 'Thoracic'],
      ['Hyperkyphosis',                 'Excessive outward curve of the thoracic spine (hunchback)',         'Thoracic'],
      ['Scoliosis',                     'Abnormal lateral curvature of the spine',                          'Thoracic'],
      ['Lumbar Subluxation',            'Misalignment of vertebrae in the lower back region',               'Lumbar'],
      ['Lumbar Disc Herniation',        'Bulging or ruptured disc in the lower back',                       'Lumbar'],
      ['Hyperlordosis',                 'Excessive inward curve of the lumbar spine (swayback)',             'Lumbar'],
      ['Sacroiliac Joint Dysfunction',  'Dysfunction of the joint between spine and pelvis',                'Pelvic'],
      ['Spinal Stenosis',               'Narrowing of the spinal canal causing nerve pressure',             'Degenerative'],
      ['Degenerative Disc Disease',     'Progressive wear and tear of spinal discs',                        'Degenerative'],
      ['Facet Joint Syndrome',          'Inflammation or degeneration of facet joints',                     'Degenerative'],
      ['Piriformis Syndrome',           'Piriformis muscle irritating the sciatic nerve',                   'Soft Tissue'],
    ].forEach(row => ins.run(...row));
  });
  seedConditions();
}

// ── Seed treatment plans ─────────────────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM treatment_plans').get().c === 0) {
  const ins = db.prepare(`
    INSERT INTO treatment_plans
      (name, description, min_conditions, max_conditions, sessions_per_week, duration_weeks, additional_services, price_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedPlans = db.transaction(() => {
    [
      [
        'Basic Care',
        'Foundational chiropractic adjustments for mild spinal issues. Ideal for patients with 1–2 conditions who need routine maintenance and prevention.',
        1, 2, 2, 4,
        'Spinal adjustments · Postural education',
        '$200 – $400 / month'
      ],
      [
        'Standard Care',
        'Comprehensive spinal correction for moderate conditions. Combines manual adjustments with targeted exercises and lifestyle counseling.',
        3, 5, 3, 8,
        'Spinal adjustments · Therapeutic exercises · Postural education · Nutritional guidance',
        '$500 – $800 / month'
      ],
      [
        'Enhanced Care',
        'Intensive treatment for patients with multiple co-occurring conditions. Adds advanced rehabilitation modalities alongside regular adjustments.',
        6, 9, 4, 12,
        'Spinal adjustments · Therapeutic exercises · Massage therapy · Electrical muscle stimulation · Ultrasound therapy · Nutritional guidance',
        '$900 – $1,200 / month'
      ],
      [
        'Premium Wellness',
        'Our most comprehensive program for complex multi-system spinal conditions. Full-body rehabilitation with personalized, ongoing support.',
        10, 99, 5, 16,
        'Daily spinal adjustments · Advanced rehabilitation · Deep tissue massage · Spinal decompression therapy · Custom orthotics · Full nutritional plan · Lifestyle coaching',
        '$1,300 – $1,800 / month'
      ],
    ].forEach(row => ins.run(...row));
  });
  seedPlans();
}

// ── Seed demo accounts ───────────────────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM users').get().c === 0) {
  const hash = bcrypt.hashSync('demo1234', 10);
  const ins = db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)');
  ins.run('doctor@clinic.com',   hash, 'doctor',  'Dr. Sarah Johnson');
  ins.run('patient@example.com', hash, 'patient', 'John Smith');
}

module.exports = db;
