export default function ProgressBar({ value, label, tone = 'brand', showValue = true }) {
  const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)))
  const color = { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' }[tone]
  return (
    <div>
      {(label || showValue) && (
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          {showValue && <span className="font-medium text-slate-700">{pct}%</span>}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
