import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { conditionsApi, assessmentsApi, patientsApi } from '../api'
import Navbar from './Navbar'

function suggestPlan(plans, count) {
  return plans.find(p => count >= p.min_conditions && count <= p.max_conditions) || null
}

const CATEGORY_ICONS = {
  'Cervical':    '🔵',
  'Thoracic':    '🟣',
  'Lumbar':      '🟠',
  'Pelvic':      '🔴',
  'Degenerative':'🟡',
  'Soft Tissue': '🟢',
}

export default function AssessmentForm() {
  const { id: patientId, assessmentId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(assessmentId)

  const [patient, setPatient]           = useState(null)
  const [conditions, setConditions]     = useState([])
  const [plans, setPlans]               = useState([])
  const [selected, setSelected]         = useState(new Set())
  const [notes, setNotes]               = useState('')
  const [planOverride, setPlanOverride] = useState('')
  const [assessDate, setAssessDate]     = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [p, conds, plns] = await Promise.all([
          patientsApi.get(patientId),
          conditionsApi.list(),
          conditionsApi.treatmentPlans()
        ])
        setPatient(p)
        setConditions(conds)
        setPlans(plns)

        if (isEdit) {
          const existing = await assessmentsApi.get(assessmentId)
          setNotes(existing.notes || '')
          setPlanOverride(existing.recommended_plan_id ? String(existing.recommended_plan_id) : '')
          setAssessDate(existing.assessment_date || new Date().toISOString().split('T')[0])
          setSelected(new Set(existing.conditions.map(c => c.id)))
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [patientId, assessmentId])

  function toggleCondition(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    // Clear manual override so suggestion can refresh
    setPlanOverride('')
  }

  const suggested     = suggestPlan(plans, selected.size)
  const activePlanId  = planOverride || (suggested ? String(suggested.id) : '')

  // Group conditions by category
  const grouped = conditions.reduce((acc, c) => {
    acc[c.category] = acc[c.category] || []
    acc[c.category].push(c)
    return acc
  }, {})

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        patient_id:          parseInt(patientId),
        condition_ids:       [...selected],
        notes:               notes.trim() || null,
        recommended_plan_id: activePlanId ? parseInt(activePlanId) : null,
        assessment_date:     assessDate,
      }
      if (isEdit) {
        await assessmentsApi.update(assessmentId, payload)
      } else {
        await assessmentsApi.create(payload)
      }
      navigate(`/doctor/patients/${patientId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Assessment" />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title={isEdit ? 'Edit Assessment' : 'New Assessment'} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate(`/doctor/patients/${patientId}`)}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mb-5">
          ← Back to {patient?.name}
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {isEdit ? 'Edit Assessment' : 'New Assessment'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">Patient: <strong>{patient?.name}</strong></p>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Assessment Date</label>
            <input
              type="date"
              value={assessDate}
              onChange={e => setAssessDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Condition checklist */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Conditions Detected</h2>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold
                ${selected.size === 0
                  ? 'bg-gray-100 text-gray-500'
                  : selected.size <= 2
                    ? 'bg-blue-100 text-blue-700'
                    : selected.size <= 5
                      ? 'bg-teal-100 text-teal-700'
                      : selected.size <= 9
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                }`}>
                {selected.size} of {conditions.length} detected
              </div>
            </div>

            <div className="space-y-5">
              {Object.entries(grouped).map(([category, conds]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>{CATEGORY_ICONS[category] || '•'}</span> {category} Spine
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {conds.map(c => {
                      const checked = selected.has(c.id)
                      return (
                        <label
                          key={c.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                            ${checked
                              ? 'border-indigo-400 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCondition(c.id)}
                            className="mt-0.5 w-4 h-4 accent-indigo-600 flex-shrink-0"
                          />
                          <div>
                            <p className={`text-sm font-medium ${checked ? 'text-indigo-800' : 'text-gray-700'}`}>
                              {c.name}
                            </p>
                            {c.description && (
                              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{c.description}</p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment plan suggestion */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Recommended Treatment Plan</h2>

            {suggested && !planOverride && (
              <div className="mb-3 flex items-center gap-2 text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Auto-suggested based on <strong>{selected.size} condition{selected.size !== 1 ? 's' : ''}</strong> detected</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {plans.map(plan => {
                const isActive = String(plan.id) === activePlanId
                return (
                  <label
                    key={plan.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${isActive
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={String(plan.id)}
                      checked={isActive}
                      onChange={e => setPlanOverride(e.target.value)}
                      className="mt-0.5 accent-indigo-600 flex-shrink-0"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-indigo-800' : 'text-gray-700'}`}>
                        {plan.name}
                        {String(plan.id) === String(suggested?.id) && !planOverride && (
                          <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">Suggested</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {plan.sessions_per_week}×/week · {plan.duration_weeks} weeks · {plan.price_range}
                      </p>
                      <p className="text-xs text-gray-400">
                        ({plan.min_conditions}–{plan.max_conditions === 99 ? '10+' : plan.max_conditions} conditions)
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Clear override */}
            {planOverride && suggested && String(planOverride) !== String(suggested.id) && (
              <button type="button"
                onClick={() => setPlanOverride('')}
                className="text-xs text-indigo-500 hover:text-indigo-700 underline">
                Reset to suggested plan
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Doctor's Notes &amp; Observations
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Add your clinical observations, X-ray findings, patient history notes…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button"
              onClick={() => navigate(`/doctor/patients/${patientId}`)}
              className="flex-1 sm:flex-none border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Saving…' : isEdit ? 'Update Assessment' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
