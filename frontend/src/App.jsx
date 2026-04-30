/**
 * App.jsx — Root router.
 *
 * Route structure:
 *   /           → Login (also handles patient self-registration)
 *   /doctor/*   → Doctor views (dashboard, patient detail, assessment form)
 *   /patient    → Patient dashboard (read-only health plan view)
 *
 * ProtectedRoute redirects unauthenticated or wrong-role users back to /.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import DoctorDashboard from './components/DoctorDashboard'
import PatientDetail from './components/PatientDetail'
import AssessmentForm from './components/AssessmentForm'
import PatientDashboard from './components/PatientDashboard'

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

function ProtectedRoute({ role, children }) {
  const user = getUser()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/doctor" element={
          <ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>
        } />
        <Route path="/doctor/patients/:id" element={
          <ProtectedRoute role="doctor"><PatientDetail /></ProtectedRoute>
        } />
        <Route path="/doctor/patients/:id/assess" element={
          <ProtectedRoute role="doctor"><AssessmentForm /></ProtectedRoute>
        } />
        <Route path="/doctor/patients/:id/assess/:assessmentId" element={
          <ProtectedRoute role="doctor"><AssessmentForm /></ProtectedRoute>
        } />

        <Route path="/patient" element={
          <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
