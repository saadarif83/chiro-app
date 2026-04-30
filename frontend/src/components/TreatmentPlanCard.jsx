/**
 * TreatmentPlanCard — Displays a single treatment plan tier.
 *
 * Props:
 *   plan          {object}  — treatment plan row from the database
 *   isRecommended {boolean} — when true, renders a highlighted "Your Recommended Plan" ring
 */
const STYLES = {
  'Basic Care':       { border: 'border-blue-400',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800',   icon: '🔵', ring: 'ring-blue-400'   },
  'Standard Care':    { border: 'border-teal-400',   bg: 'bg-teal-50',   badge: 'bg-teal-100 text-teal-800',   icon: '🔷', ring: 'ring-teal-400'   },
  'Enhanced Care':    { border: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800',icon: '💜', ring: 'ring-purple-400' },
  'Premium Wellness': { border: 'border-amber-400',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-800',  icon: '⭐', ring: 'ring-amber-400'  },
}

export default function TreatmentPlanCard({ plan, isRecommended }) {
  const s = STYLES[plan.name] || {
    border: 'border-gray-300', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700', icon: '•', ring: 'ring-gray-300'
  }

  const services = (plan.additional_services || '').split('·').map(s => s.trim()).filter(Boolean)

  return (
    <div className={`rounded-2xl border-2 ${s.border} ${s.bg} p-5 relative
      ${isRecommended ? `ring-4 ${s.ring} ring-offset-2 shadow-lg` : 'shadow-sm'}`}>

      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow whitespace-nowrap">
            ✓ Your Recommended Plan
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{s.icon}</span>
          <h3 className="font-bold text-gray-800 text-base">{plan.name}</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.badge}`}>
          {plan.price_range}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{plan.description}</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/70 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-gray-800">{plan.sessions_per_week}×</p>
          <p className="text-xs text-gray-500">per week</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-gray-800">{plan.duration_weeks}</p>
          <p className="text-xs text-gray-500">weeks</p>
        </div>
      </div>

      {/* Services */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Includes</p>
        <ul className="space-y-1">
          {services.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
