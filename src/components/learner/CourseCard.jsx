import { useState } from 'react'
import { Award, ChevronDown, CircleCheck, Clock, PlayCircle } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'

export default function CourseCard({ course, completedIds, assessment, best, complete, onToggleModule, onLaunch }) {
  const [open, setOpen] = useState(false)
  const pct = course.modules.length ? (completedIds.length / course.modules.length) * 100 : 0
  const modulesDone = pct >= 100
  const totalMin = course.modules.reduce((s, m) => s + m.durationMin, 0)

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="blue">{course.specialty}</Badge>
          <Badge tone="violet">{course.cmeCredits} CME</Badge>
          {complete && (
            <Badge tone="green">
              <CircleCheck className="h-3 w-3" /> Completed
            </Badge>
          )}
        </div>
        <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{course.description}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" /> {course.modules.length} modules · {totalMin} min
        </p>
        <div className="mt-4">
          <ProgressBar value={pct} label={`${completedIds.length}/${course.modules.length} modules`} tone={modulesDone ? 'green' : 'brand'} />
        </div>

        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline" aria-expanded={open}>
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} /> {open ? 'Hide' : 'Show'} modules
        </button>
        {open && (
          <ul className="mt-2 space-y-1">
            {course.modules.map((m) => {
              const done = completedIds.includes(m.id)
              return (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-slate-50">
                    <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={done} onChange={() => onToggleModule(m.id)} />
                    <span className={done ? 'text-slate-500 line-through' : 'text-slate-800'}>{m.title}</span>
                    <span className="ml-auto text-xs text-slate-400">{m.durationMin}m</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        {assessment ? (
          <>
            <div className="text-xs">
              {best ? (
                <span className={best.passed ? 'text-emerald-700' : 'text-rose-600'}>
                  Best: <strong>{Math.round(best.score)}%</strong> {best.passed ? '· Passed' : '· Not passed'}
                </span>
              ) : (
                <span className="text-slate-500">Assessment · pass ≥ {assessment.passingScore}%</span>
              )}
            </div>
            <button type="button" className={best?.passed ? 'btn-secondary py-1.5' : 'btn-primary py-1.5'} onClick={onLaunch}>
              <PlayCircle className="h-4 w-4" /> {best ? 'Retake quiz' : 'Launch quiz'}
            </button>
          </>
        ) : (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Award className="h-3.5 w-3.5" /> Credit awarded on module completion
          </span>
        )}
      </footer>
    </article>
  )
}
