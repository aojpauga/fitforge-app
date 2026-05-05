export default function ProgressBar({ current, total }) {
  return (
    <div className="w-full mb-10">
      <div className="w-full bg-zinc-900 h-px">
        <div
          className="bg-white h-px transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <p className="text-xs text-zinc-600 mt-2">{current} of {total}</p>
    </div>
  )
}
