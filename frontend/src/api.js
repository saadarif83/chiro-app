/**
 * api.js — Typed fetch wrappers for every backend endpoint.
 *
 * All requests automatically attach the JWT stored in localStorage.
 * All non-2xx responses are converted into thrown Errors so callers
 * can use a simple try/catch without inspecting the response status.
 */
const BASE = '/api';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token')
    ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
    : {})
});

const handle = async (res) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
};

export const authApi = {
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(handle),

  // Public self-registration (new patients)
  register: (data) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handle),

  // Doctor-only: register a patient from the dashboard
  registerPatient: (data) =>
    fetch(`${BASE}/auth/register-patient`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(handle),
};

export const patientsApi = {
  list: () => fetch(`${BASE}/patients`, { headers: headers() }).then(handle),
  get: (id) => fetch(`${BASE}/patients/${id}`, { headers: headers() }).then(handle),
};

export const assessmentsApi = {
  forPatient: (pid) =>
    fetch(`${BASE}/assessments/patient/${pid}`, { headers: headers() }).then(handle),
  get: (id) =>
    fetch(`${BASE}/assessments/${id}`, { headers: headers() }).then(handle),
  create: (data) =>
    fetch(`${BASE}/assessments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(handle),
  update: (id, data) =>
    fetch(`${BASE}/assessments/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(handle),
};

export const conditionsApi = {
  list: () => fetch(`${BASE}/conditions`, { headers: headers() }).then(handle),
  treatmentPlans: () =>
    fetch(`${BASE}/conditions/treatment-plans`, { headers: headers() }).then(handle),
};
