import { useNavigate } from 'react-router-dom'

export default function Navbar({ title }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <div>
            <span className="font-bold text-lg leading-none">ChiroCare</span>
            {title && <span className="text-indigo-300 text-sm ml-2">/ {title}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-indigo-200 hidden sm:block">
            {user.role === 'doctor' ? '🩺' : '👤'} {user.name}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
