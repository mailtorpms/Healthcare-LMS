import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, HeartPulse, PlayCircle, Send, Target, TriangleAlert } from 'lucide-react'
import QuestionBody from './QuestionBody.jsx'
import { TYPE_LABELS } from './questionTypes.js'
import AssessmentResults from './AssessmentResults.jsx'
import { isAnswered, scoreAttempt } from '../../lib/scoring.js'

export default function AssessmentRunner({ assessment, onSubmitAttempt, onExit }) {
  const [phase, setPhase] = useState('intro') // intro | running | results
  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const [outcome, setOutcome] = useState(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (phase !== 'running') return undefined
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const questions = assessment.questions
  const q = questions[index]
  const answeredCount = questions.filter((qq) => isAnswered(qq, responses[qq.id])).length
  const unanswered = questions.length - answeredCount

  const start = () => {
    setResponses({})
    setIndex(0)
    setElapsed(0)
    setOutcome(null)
    setConfirming(false)
    setPhase('running')
  }

  const submit = () => {
    const result = scoreAttempt(assessment, responses)
    setOutcome(result)
    setPhase('results')
    setConfirming(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    onSubmitAttempt?.({ assessmentId: assessment.id, score: result.percent, passed: result.passed, responses, durationSec: elapsed })
  }

  const limitSec = (assessment.timeLimitMin ?? 0) * 60
  const remaining = limitSec ? Math.max(0, limitSec - elapsed) : null
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const typeCounts = questions.reduce((acc, qq) => ({ ...acc, [qq.type]: (acc[qq.type] ?? 0) + 1 }), {})

  return (
    <div className="mx-auto max-w-4xl">
      <button type="button" className="btn-ghost mb-4 -ml-2" onClick={onExit}>
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      {phase === 'intro' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <HeartPulse className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{assessment.title}</h1>
              <p className="mt-1 text-slate-600">{assessment.description}</p>
            </div>
          </div>
          <dl className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Questions</dt>
              <dd className="text-xl font-semibold">{questions.length}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
                <Target className="h-3.5 w-3.5" /> Passing score
              </dt>
              <dd className="text-xl font-semibold">{assessment.passingScore}%</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Suggested time
              </dt>
              <dd className="text-xl font-semibold">{assessment.timeLimitMin ? `${assessment.timeLimitMin} min` : 'Untimed'}</dd>
            </div>
          </dl>
          <ul className="mb-8 space-y-1 text-sm text-slate-600">
            {Object.entries(typeCounts).map(([type, n]) => (
              <li key={type}>
                • {n} × {TYPE_LABELS[type]}
              </li>
            ))}
            <li>• Detailed rationales and guideline citations are shown after submission.</li>
          </ul>
          <button type="button" className="btn-primary px-6 py-3 text-base" onClick={start} disabled={questions.length === 0}>
            <PlayCircle className="h-5 w-5" /> Begin assessment
          </button>
        </div>
      )}

      {phase === 'running' && q && (
        <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <QuestionBody
              question={q}
              index={index}
              total={questions.length}
              response={responses[q.id]}
              onChange={(value) => setResponses((r) => ({ ...r, [q.id]: value }))}
            />
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
              <button type="button" className="btn-secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              {index < questions.length - 1 ? (
                <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={() => (unanswered ? setConfirming(true) : submit())}>
                  <Send className="h-4 w-4" /> Submit
                </button>
              )}
            </div>
            {confirming && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
                <TriangleAlert className="h-5 w-5" />
                <span className="flex-1">
                  {unanswered} question{unanswered > 1 ? 's are' : ' is'} incomplete and will be scored as-is.
                </span>
                <button type="button" className="btn-secondary py-1.5" onClick={() => setConfirming(false)}>
                  Keep working
                </button>
                <button type="button" className="btn-danger py-1.5" onClick={submit}>
                  Submit anyway
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{remaining != null ? 'Time remaining' : 'Elapsed'}</p>
              <p className={`text-2xl font-semibold tabular-nums ${remaining != null && remaining < 120 ? 'text-rose-600' : 'text-slate-900'}`}>
                {fmt(remaining ?? elapsed)}
              </p>
              {remaining === 0 && <p className="mt-1 text-xs text-rose-600">Suggested time exceeded. You may still submit.</p>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                Navigator · {answeredCount}/{questions.length} answered
              </p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((qq, i) => {
                  const done = isAnswered(qq, responses[qq.id])
                  return (
                    <button
                      key={qq.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to question ${i + 1}${done ? ' (answered)' : ''}`}
                      aria-current={i === index ? 'step' : undefined}
                      className={`h-9 rounded-md text-sm font-semibold transition ${
                        i === index ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                      } ${done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      )}

      {phase === 'results' && outcome && (
        <AssessmentResults assessment={assessment} responses={responses} outcome={outcome} elapsedSec={elapsed} onRetake={start} onExit={onExit} />
      )}
    </div>
  )
}
