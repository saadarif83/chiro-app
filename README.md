# ChiroCare Portal

A full-stack chiropractic clinic management application. Doctors can assess patients, log spinal conditions, and auto-recommend treatment plans. Patients can log in to view their health plan and assessment history.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js · Express · PostgreSQL    |
| Frontend | React 18 · Vite · Tailwind CSS    |
| Auth     | JWT (24 h expiry) · bcryptjs      |
| Deploy   | Render (backend + DB) · static dist served by Express |

---

## Features

- **Doctor portal** — searchable patient list, aggregate stats, add patients
- **Patient assessment form** — checklist of 14 spinal conditions grouped by region; auto-suggests a treatment plan tier based on condition count; doctor can override
- **Treatment plan tiers** — Basic Care · Standard Care · Enhanced Care · Premium Wellness (seeded at startup)
- **Patient portal** — latest assessment summary, progress indicator, full plan comparison grid
- **Role-based access** — all routes protected; patients can only read their own data

---

## Project Structure

```
.
├── backend/
│   ├── server.js            # Express entry point
│   ├── database.js          # pg.Pool wrapper + DB init + seed data
│   ├── middleware/
│   │   └── auth.js          # JWT verification + role guard
│   └── routes/
│       ├── auth.js          # login / register / register-patient
│       ├── patients.js      # patient list & detail (doctor only)
│       ├── assessments.js   # assessment CRUD
│       └── conditions.js    # conditions & treatment plans (read-only)
├── frontend/
│   └── src/
│       ├── api.js           # fetch wrappers for all backend endpoints
│       ├── App.jsx          # router + ProtectedRoute
│       └── components/
│           ├── Login.jsx
│           ├── Navbar.jsx
│           ├── DoctorDashboard.jsx
│           ├── PatientDetail.jsx
│           ├── AssessmentForm.jsx
│           ├── PatientDashboard.jsx
│           ├── AddPatientModal.jsx
│           └── TreatmentPlanCard.jsx
└── package.json             # root scripts (dev, build, start)
```

---

## Getting Started (Local Dev)

### Prerequisites

- Node.js ≥ 18
- A running PostgreSQL instance (local or cloud)

### 1 — Install dependencies

```bash
npm run install:all
```

### 2 — Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=3001
JWT_SECRET=replace-this-with-a-long-random-string
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/chirodb
```

> **Never commit `.env`.** It is listed in `.gitignore`.

### 3 — Run in development mode

```bash
npm run dev
```

This starts both the Express API (port 3001) and the Vite dev server (port 5173) concurrently. The frontend proxies `/api` requests to the backend via Vite's proxy config.

### 4 — Demo credentials (seeded on first run)

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Doctor  | doctor@clinic.com      | demo1234   |
| Patient | patient@example.com    | demo1234   |

---

## Production Deployment (Render)

### Backend service

- **Build command:** `npm install`
- **Start command:** `node server.js`
- **Environment variables:** set `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`

### Frontend

The frontend is built and committed as `frontend/dist/` so the Express server can serve it as static files — no separate frontend service needed.

To rebuild after UI changes:

```bash
npm run build          # runs: cd frontend && npm install && npm run build
```

Then commit the updated `frontend/dist/`.

---

## API Reference

### Auth

| Method | Path                          | Auth     | Description                        |
|--------|-------------------------------|----------|------------------------------------|
| POST   | `/api/auth/login`             | None     | Returns JWT + user payload         |
| POST   | `/api/auth/register`          | None     | Patient self-registration          |
| POST   | `/api/auth/register-patient`  | Doctor   | Doctor creates a patient account   |

### Patients

| Method | Path                 | Auth   | Description                        |
|--------|----------------------|--------|------------------------------------|
| GET    | `/api/patients`      | Doctor | List all patients with stats       |
| GET    | `/api/patients/:id`  | Doctor | Single patient record              |

### Assessments

| Method | Path                                | Auth            | Description                   |
|--------|-------------------------------------|-----------------|-------------------------------|
| GET    | `/api/assessments/patient/:id`      | Doctor, Patient | All assessments for a patient |
| GET    | `/api/assessments/:id`              | Doctor, Patient | Single assessment             |
| POST   | `/api/assessments`                  | Doctor          | Create assessment             |
| PUT    | `/api/assessments/:id`              | Doctor          | Update assessment             |

### Conditions & Plans

| Method | Path                              | Auth            | Description           |
|--------|-----------------------------------|-----------------|-----------------------|
| GET    | `/api/conditions`                 | Doctor, Patient | All spinal conditions |
| GET    | `/api/conditions/treatment-plans` | Doctor, Patient | All treatment plans   |

---

## Environment Variables

| Variable       | Required | Default                              | Description                       |
|----------------|----------|--------------------------------------|-----------------------------------|
| `DATABASE_URL` | Yes      | —                                    | PostgreSQL connection string      |
| `JWT_SECRET`   | Yes      | `chiro-dev-secret-change-in-production` | Secret for signing JWTs        |
| `PORT`         | No       | `3001`                               | Port the Express server listens on|
| `NODE_ENV`     | No       | `development`                        | Enables SSL for production DB     |
| `FRONTEND_URL` | No       | `http://localhost:5173`              | Allowed CORS origin               |

---

## License

MIT
