import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientsApi, assessmentsApi } from '../api'
import Navbar from './Navbar'

const PLAN_COLORS = {
  'Basic Care':      'bg-blue-50   border-blue-300   text-blue-800',
  'Standard Care':   'bg-teal-50   border-teal-300   text-teal-800',
  'Enhanced Care':   'bg-purple-50 border-purple-300 text-purple-800',
  'Premium Wellness':'bg-amber-50  border-amber-300  text-amber-800',
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient]         = useState(null)
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          patientsApi.get(id),
          assessmentsApi.forPatient(id)
        ])
        setPatient(p)
        setAssessments(a)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Patient Detail" />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Patient Detail" />
      <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Patient Detail" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => navigate('/doctor')}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mb-5">
          ← Back to patients
        </button>

        {/* Patient header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{patient.name}</h1>
            <p className="text-sm text-gray-500">{patient.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Patient since {fmtDate(patient.created_at)}</p>
          </div>
          <button
            onClick={() => navigate(`/doctor/patients/${id}/assess`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            + New Assessment
          </button>
        </div>

        {/* Assessment history */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Assessment History ({assessments.length})
        </h2>

        {assessments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400 text-sm">
            No assessments yet. Click <strong>"+ New Assessment"</strong> to create the first one.
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a, idx) => {
              const planColor = PLAN_COLORS[a.plan_name] || 'bg-gray-50 border-gray-200 text-gray-700'
              return (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {idx === 0 ? 'Latest Assessment' : `Assessment #${assessments.length - idx}`}
                        </span>
                        {idx === 0 && (
                          <span className="bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">Most Recent</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{fmtDate(a.assessment_date)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">By {a.doctor_name}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Conditions badge */}
                      <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                        {a.conditions.length} condition{a.conditions.length !== 1 ? 's' : ''}
                      </span>

                      {/* Plan badge */}
                      {a.plan_name && (
                        <span className={`border text-xs font-semibold px-3 py-1 rounded-full ${planColor}`}>
                          {a.plan_name}
                        </span>
                      )}

                      <button
                        onClick={() => navigate(`/doctor/patients/${id}/assess/${a.id}`)}
                        className="text-xs text-indigo-600 border border-indigo-200 hover:border-indigo-400 px-3 py-1 rounded-lg transition-colors font-medium"
                      >
                        Edit →
                      </button>
                    </div>
                  </div>

                  {/* Conditions list */}
                  {a.conditions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {a.conditions.map(c => (
                        <span key={c.id}
                          className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full border border-red-100">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {a.notes && (
                    <div className="mt-4 bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 italic">
                      "{a.notes}"
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
