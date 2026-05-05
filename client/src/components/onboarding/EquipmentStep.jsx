const GYM_OPTIONS = [
  {
    id: 'home_gym',
    label: 'Home Gym',
    description: 'Dumbbells, bands, bodyweight — limited equipment',
  },
  {
    id: 'full_gym',
    label: 'Full Gym',
    description: 'Barbells, cables, machines — full access',
  },
]

export default function EquipmentStep({ value, onChange }) {
  const selected = value?.[0] || null

  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-1">Where do you train?</h2>
      <p className="text-zinc-500 text-sm mb-8">The AI will program exercises based on what you have access to.</p>

      <div className="flex flex-col gap-2">
        {GYM_OPTIONS.map(opt => {
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange([opt.id])}
              className={`flex items-center justify-between p-4 rounded-lg border text-left transition
                ${active
                  ? 'border-white bg-white/5'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                }`}
            >
              <div>
                <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-zinc-300'}`}>{opt.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{opt.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border flex-shrink-0 ml-4 flex items-center justify-center transition
                ${active ? 'border-white bg-white' : 'border-zinc-700'}`}>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
            </button>
          )
        })}
      </div>

      {!selected && (
        <p className="text-zinc-600 text-xs mt-4">Select an option to continue.</p>
      )}
    </div>
  )
}
