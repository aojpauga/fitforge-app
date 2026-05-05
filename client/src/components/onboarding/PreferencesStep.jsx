const DAYS_OPTIONS = [2, 3, 4, 5, 6]
const EXPERIENCE_OPTIONS = [
  { id: 'beginner',     label: 'Beginner',     description: 'Less than 1 year of consistent training' },
  { id: 'intermediate', label: 'Intermediate', description: '1–3 years of consistent training' },
  { id: 'advanced',     label: 'Advanced',     description: '3+ years, comfortable with compound lifts' },
]
const PROGRAM_LENGTH_OPTIONS = [6, 8]

export default function PreferencesStep({ value, onChange }) {
  function set(key, val) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-1">Your training setup</h2>
        <p className="text-zinc-500 text-sm">We'll use this to build the right volume and intensity.</p>
      </div>

      {/* Days per week */}
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">Days per week</label>
        <div className="flex gap-2">
          {DAYS_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => set('days_per_week', d)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm border transition
                ${value.days_per_week === d
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Experience level */}
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">Experience level</label>
        <div className="flex flex-col gap-2">
          {EXPERIENCE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => set('experience_level', opt.id)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border text-left transition
                ${value.experience_level === opt.id
                  ? 'border-white bg-white/5'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                }`}
            >
              <div>
                <span className={`font-semibold text-sm block ${value.experience_level === opt.id ? 'text-white' : 'text-zinc-300'}`}>{opt.label}</span>
                <span className="text-zinc-500 text-xs">{opt.description}</span>
              </div>
              <div className={`w-4 h-4 rounded-full border flex-shrink-0 ml-4 flex items-center justify-center transition
                ${value.experience_level === opt.id ? 'border-white bg-white' : 'border-zinc-700'}`}>
                {value.experience_level === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Program length */}
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">Program length</label>
        <div className="flex gap-3">
          {PROGRAM_LENGTH_OPTIONS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => set('program_length_weeks', w)}
              className={`flex-1 py-3 rounded-lg font-bold text-sm border transition
                ${value.program_length_weeks === w
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                }`}
            >
              {w} Weeks
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
