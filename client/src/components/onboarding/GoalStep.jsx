const GOALS = [
  {
    id: 'build_muscle',
    label: 'Build Muscle',
    description: 'Increase size and strength through progressive overload',
  },
  {
    id: 'lose_weight',
    label: 'Lose Weight',
    description: 'Burn fat with higher-rep circuits and cardio finishers',
  },
  {
    id: 'endurance',
    label: 'Build Endurance',
    description: 'Improve stamina and cardiovascular fitness',
  },
  {
    id: 'general_fitness',
    label: 'General Fitness',
    description: 'Stay active, balanced, and healthy overall',
  },
]

export default function GoalStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-white uppercase mb-1">What's your goal?</h2>
      <p className="text-zinc-500 text-sm mb-8">This shapes your entire program.</p>

      <div className="flex flex-col gap-2">
        {GOALS.map(goal => (
          <button
            key={goal.id}
            type="button"
            onClick={() => onChange(goal.id)}
            className={`flex items-start justify-between p-4 rounded-lg border text-left transition
              ${value === goal.id
                ? 'border-white bg-white/5'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
              }`}
          >
            <div>
              <p className={`font-semibold text-sm ${value === goal.id ? 'text-white' : 'text-zinc-300'}`}>{goal.label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{goal.description}</p>
            </div>
            <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 ml-4 flex items-center justify-center transition
              ${value === goal.id ? 'border-white bg-white' : 'border-zinc-700'}`}>
              {value === goal.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
