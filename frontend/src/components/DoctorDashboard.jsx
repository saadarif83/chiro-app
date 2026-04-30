/**
 * DoctorDashboard — Landing page for authenticated doctors.
 *
 * Shows aggregate stats (total patients, assessed count, total assessments)
 * and a searchable patient list. Doctors can add new patients via the modal
 * or navigate to a patient's detail page.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientsApi } from '../api'
import Navbar from './Navbar'
import AddPatientModal from './AddPatientModal'

function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${color}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  )
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showModal, setShowModal] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setPatients(await patientsApi.list())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalAssessments = patients.reduce((s, p) => s + (p.assessment_count || 0), 0)
  const assessed = patients.filter(p => p.assessment_count > 0).length

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Doctor Dashboard" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Patient Overview</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Add Patient
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Patients"       value={patients.length}  color="border-indigo-500" />
          <StatCard label="Patients Assessed"    value={assessed}          color="border-teal-500"   />
          <StatCard label="Total Assessments"    value={totalAssessments}  color="border-purple-500" />
        </div>

        {/* Search + table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients by name or email…"
              className="flex-1 text-sm text-gray-700 focus:outline-none"
            />
          </div>

          {loading && (
            <div className="text-center py-16 text-gray-400 text-sm">Loading patients…</div>
          )}
          {error && (
            <div className="text-center py-10 text-red-500 text-sm">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              {search ? 'No patients match your search.' : 'No patients yet. Click "Add Patient" to get started.'}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Patient</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-center px-5 py-3">Assessments</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Last Visit</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{p.email}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${p.assessment_count > 0
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {p.assessment_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 hidden md:table-cell">{fmtDate(p.last_assessment)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/patients/${p.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <AddPatientModal
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
