import { Award, BookOpen, CircleCheck, CircleX, CircleAlert, RotateCcw, ArrowLeft } from 'lucide-react'
import QuestionBody from './QuestionBody.jsx'
import Badge from '../ui/Badge.jsx'

function ScoreRing({ percent, passed }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative h-36 w-36 shrink-0">
    <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90" aria-hidden="true">
      <circle cx="60" cy="60" r={r} strokeWidth="10" className="fill-none stroke-slate-100" />
      <circle
        cx="60"
        cy="60"
        r={r}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className={`fill-none transition-all duration-700 ${passed ? 'stroke-emerald-500' : 'stroke-rose-500'}`}
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-900">{Math.round(percent)}%</span>
    </div>
  )
}

const STATUS = {
  correct: { icon: CircleCheck, tone: 'green', label: 'Correct' },
  partial: { icon: CircleAlert, tone: 'amber', label: 'Partially correct' },
  incorrect: { icon: CircleX, tone: 'red', label: 'Incorrect' },
}

export default function AssessmentResults({ assessment, responses, outcome, elapsedSec, onRetake, onExit }) {
  const { percent, passed, earned, max, results } = outcome
  const mins = Math.floor(elapsedSec / 60)
  const secs = elapsedSec % 60

  return (
    <div className="space-y-6">
      <div className={`flex flex-col items-center gap-6 rounded-xl border p-6 sm:flex-row ${passed ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
        <ScoreRing percent={percent} passed={passed} />
        <div className="flex-1 text-center sm:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
            {passed ? <Award className="h-6 w-6 text-emerald-600" /> : <CircleX className="h-6 w-6 text-rose-600" />}
            <h2 className={`text-2xl font-bold ${passed ? 'text-emerald-800' : 'text-rose-800'}`}>{passed ? 'PASS' : 'NOT YET PASSED'}</h2>
          </div>
          <p className="text-sm text-slate-700">
            You scored <strong>{earned}</strong> of <strong>{max}</strong> points ({percent}%). Passing threshold: <strong>{assessment.passingScore}%</strong>.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Time taken: {mins}m {secs.toString().padStart(2, '0')}s
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {passed
              ? 'Competency demonstrated. Your CME credit is released once all course modules are complete.'
              : 'Review the rationales below, then retake the assessment when ready.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button type="button" className="btn-secondary" onClick={onRetake}>
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button type="button" className="btn-primary" onClick={onExit}>
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </button>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900">Question review &amp; clinical rationale</h3>
      {assessment.questions.map((q, i) => {
        const result = results[i]
        const s = STATUS[result.status]
        return (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Badge tone={s.tone}>
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </Badge>
              <span className="text-sm font-medium text-slate-600">
                {result.earned} / {result.max} pts
              </span>
            </div>
            <QuestionBody question={q} index={i} total={assessment.questions.length} response={responses[q.id]} onChange={() => {}} reviewing result={result} />
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="mb-1 text-sm font-semibold text-slate-900">Clinical rationale</p>
              <p className="text-sm leading-relaxed text-slate-700">{q.rationale}</p>
              {q.citations?.length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" /> References
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-600">
                    {q.citations.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
