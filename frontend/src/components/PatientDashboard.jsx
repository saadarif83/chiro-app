/**
 * PatientDashboard — Read-only health plan view for authenticated patients.
 *
 * Displays the most recent assessment (conditions found, doctor's notes,
 * recommended plan, spinal health progress bar), a history of prior
 * assessments, and a full grid of all available treatment plan tiers.
 */
import { useState, useEffect } from 'react'
import { assessmentsApi, conditionsApi } from '../api'
import Navbar from './Navbar'
import TreatmentPlanCard from './TreatmentPlanCard'

export default function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [assessments, setAssessments] = useState([])
  const [plans, setPlans]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [a, p] = await Promise.all([
          assessmentsApi.forPatient(user.id),
          conditionsApi.treatmentPlans()
        ])
        setAssessments(a)
        setPlans(p)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const latest    = assessments[0]
  const hasAssess = assessments.length > 0

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="My Health Plan" />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading your health plan…</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="My Health Plan" />
      <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="My Health Plan" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl text-white p-6 mb-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-indigo-200 text-sm">
            {hasAssess
              ? `Your last assessment was on ${fmtDate(latest.assessment_date)} with ${latest.doctor_name}.`
              : 'Your doctor hasn\'t created an assessment yet. Check back after your next visit.'}
          </p>
        </div>

        {!hasAssess && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center mb-8">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No Assessment Yet</h2>
            <p className="text-sm text-gray-400">Your doctor will create your health assessment after your examination. Please come back after your next visit.</p>
          </div>
        )}

        {hasAssess && (
          <>
            {/* Latest assessment card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800">Your Latest Assessment</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {fmtDate(latest.assessment_date)}
                </span>
              </div>

              {/* Conditions found */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Conditions Detected</h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full
                    ${latest.conditions.length === 0
                      ? 'bg-green-100 text-green-700'
                      : latest.conditions.length <= 3
                        ? 'bg-blue-100 text-blue-700'
                        : latest.conditions.length <= 6
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                    {latest.conditions.length} condition{latest.conditions.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                {latest.conditions.length === 0 ? (
                  <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3">
                    ✅ No spinal conditions detected. Keep up the great work!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {latest.conditions.map(c => (
                      <div key={c.id}
                        className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-red-800">{c.name}</p>
                        <p className="text-xs text-red-400">{c.category} Spine</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor's notes */}
              {latest.notes && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Doctor's Notes</p>
                  <p className="text-sm text-indigo-800 leading-relaxed">"{latest.notes}"</p>
                  <p className="text-xs text-indigo-400 mt-1">— {latest.doctor_name}</p>
                </div>
              )}

              {/* Progress bar: conditions / 14 */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Spinal health indicator</span>
                  <span>{Math.max(0, 14 - latest.conditions.length)} / 14 conditions clear</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all
                      ${latest.conditions.length <= 3 ? 'bg-green-500' :
                        latest.conditions.length <= 7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(5, ((14 - latest.conditions.length) / 14) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Previous assessments (collapsed) */}
            {assessments.length > 1 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Previous Assessments</h2>
                <div className="space-y-3">
                  {assessments.slice(1).map(a => (
                    <div key={a.id} className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-700">{fmtDate(a.assessment_date)}</p>
                        <p className="text-gray-400 text-xs">By {a.doctor_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                          {a.conditions.length} conditions
                        </span>
                        {a.plan_name && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {a.plan_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* All treatment plans */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Available Treatment Plans</h2>
          <p className="text-sm text-gray-500 mb-5">
            Compare all care levels. Your recommended plan is highlighted.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {plans.map(plan => (
              <TreatmentPlanCard
                key={plan.id}
                plan={plan}
                isRecommended={hasAssess && latest.recommended_plan_id === plan.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
