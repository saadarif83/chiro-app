/**
 * Login — Public entry page with sign-in and patient self-registration tabs.
 *
 * On successful authentication, stores the JWT and user object in
 * localStorage then redirects to /doctor or /patient based on role.
 * Already-authenticated users are immediately redirected on mount.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition'

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab]           = useState('login')   // 'login' | 'register'
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regName, setRegName]           = useState('')
  const [regEmail, setRegEmail]         = useState('')
  const [regPassword, setRegPassword]   = useState('')
  const [regConfirm, setRegConfirm]     = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user?.role === 'doctor')  navigate('/doctor',  { replace: true })
    if (user?.role === 'patient') navigate('/patient', { replace: true })
  }, [])

  function switchTab(t) {
    setTab(t)
    setError('')
    setSuccess('')
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login(loginEmail, loginPassword)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate(user.role === 'doctor' ? '/doctor' : '/patient', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (regPassword !== regConfirm) {
      return setError('Passwords do not match')
    }
    if (regPassword.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const { token, user } = await authApi.register({
        name: regName,
        email: regEmail,
        password: regPassword,
      })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/patient', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ChiroCare Portal</h1>
          <p className="text-gray-500 mt-1 text-sm">Your spinal health, our priority</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors
                ${tab === 'login'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors
                ${tab === 'register'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              New Patient? Register
            </button>
          </div>

          <div className="p-8">
            {/* Alert banners */}
            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email" required autoComplete="email"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password" required autoComplete="current-password"
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchTab('register')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2">
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="mb-1">
                  <h2 className="text-base font-semibold text-gray-800">Create your patient account</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Your doctor will be able to view and update your care plan.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text" required autoComplete="name"
                    value={regName} onChange={e => setRegName(e.target.value)}
                    placeholder="Jane Doe"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email" required autoComplete="email"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password" required autoComplete="new-password"
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password" required autoComplete="new-password"
                    value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className={`${inputCls} ${regConfirm && regConfirm !== regPassword ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  />
                  {regConfirm && regConfirm !== regPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm mt-1"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchTab('login')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* Demo credentials (only on login tab) */}
            {tab === 'login' && (
              <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <p><span className="font-medium text-gray-500">Doctor demo:</span> doctor@clinic.com / demo1234</p>
                <p><span className="font-medium text-gray-500">Patient demo:</span> patient@example.com / demo1234</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
