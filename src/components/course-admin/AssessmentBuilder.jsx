import { useState } from 'react'
import { ClipboardList, Eye, Plus, Trash2 } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import { TYPE_LABELS } from '../assessment/questionTypes.js'
import { buildDosagePayload } from '../../lib/scoring.js'
import { uid } from '../../lib/ids.js'

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f']

const blankDraft = () => ({
  type: 'single',
  vignette: '',
  stem: '',
  options: ['', '', '', ''],
  correct: [],
  scoring: 'partial',
  dosageText: '',
  distractors: '',
  rationale: '',
  citation: '',
})

function draftToQuestion(d) {
  const base = { id: uid('q'), type: d.type, points: 1, stem: d.stem.trim(), vignette: d.vignette.trim(), rationale: d.rationale.trim(), citations: d.citation.trim() ? [d.citation.trim()] : [] }
  if (d.type === 'dosage') {
    return { ...base, payload: buildDosagePayload(d.dosageText, d.distractors.split(',')) }
  }
  const options = d.options.map((text, i) => ({ id: OPTION_IDS[i], text: text.trim() })).filter((o) => o.text)
  if (d.type === 'single') return { ...base, payload: { options, correctId: d.correct[0] } }
  return { ...base, payload: { options, correctIds: d.correct, scoring: d.scoring } }
}

function validate(d) {
  if (!d.stem.trim()) return 'Question stem is required.'
  if (!d.rationale.trim()) return 'A clinical rationale is required.'
  if (d.type === 'dosage') {
    if (!/\[\[[^\]]+\]\]/.test(d.dosageText)) return 'Mark at least one blank using [[token]] syntax.'
    return ''
  }
  const filled = d.options.map((o, i) => (o.trim() ? OPTION_IDS[i] : null)).filter(Boolean)
  if (filled.length < 2) return 'Provide at least two answer options.'
  if (d.correct.length === 0) return 'Mark the correct answer(s).'
  if (d.correct.some((id) => !filled.includes(id))) return 'A correct answer points at an empty option.'
  if (d.type === 'single' && d.correct.length !== 1) return 'Single-choice questions need exactly one correct answer.'
  return ''
}

export default function AssessmentBuilder({ state, onCreateAssessment, onPreview }) {
  const eligibleCourses = state.courses
  const [meta, setMeta] = useState({ title: '', courseId: eligibleCourses[0]?.id ?? '', passingScore: 80, timeLimitMin: 15 })
  const [questions, setQuestions] = useState([])
  const [draft, setDraft] = useState(blankDraft)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const addQuestion = () => {
    const msg = validate(draft)
    setError(msg)
    if (msg) return
    setQuestions((qs) => [...qs, draftToQuestion(draft)])
    setDraft({ ...blankDraft(), type: draft.type })
  }

  const toggleCorrect = (id) =>
    setDraft((d) => ({
      ...d,
      correct: d.type === 'single' ? [id] : d.correct.includes(id) ? d.correct.filter((x) => x !== id) : [...d.correct, id],
    }))

  const buildAssessment = () => ({
    id: uid('asm'),
    courseId: meta.courseId,
    title: meta.title.trim() || 'Untitled assessment',
    description: `Custom assessment for ${state.courses.find((c) => c.id === meta.courseId)?.title ?? 'course'}.`,
    passingScore: Number(meta.passingScore),
    timeLimitMin: Number(meta.timeLimitMin) || null,
    questions,
  })

  const publish = () => {
    if (!meta.courseId) return setError('Select a course to attach this assessment to.')
    if (questions.length === 0) return setError('Add at least one question before publishing.')
    const course = state.courses.find((c) => c.id === meta.courseId)
    if (course?.assessmentId && !window.confirm(`“${course.title}” already has an assessment. Replace it?`)) return
    onCreateAssessment(buildAssessment())
    setNotice(`Published “${meta.title || 'Untitled assessment'}” with ${questions.length} question(s).`)
    setQuestions([])
    setMeta((m) => ({ ...m, title: '' }))
    setError('')
  }

  return (
    <Card
      title="Assessment builder"
      subtitle="Questions are stored as JSONB payloads (see supabase/schema.sql)"
      icon={ClipboardList}
      actions={
        <>
          <button type="button" className="btn-secondary" disabled={!questions.length} onClick={() => onPreview(buildAssessment())}>
            <Eye className="h-4 w-4" /> Preview
          </button>
          <button type="button" className="btn-primary" onClick={publish}>
            Publish
          </button>
        </>
      }
    >
      {notice && (
        <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {notice}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="asm-title">
            Assessment title
          </label>
          <input id="asm-title" className="input" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Post-module competency check" />
        </div>
        <div>
          <label className="label" htmlFor="asm-pass">
            Passing %
          </label>
          <input id="asm-pass" type="number" min="1" max="100" className="input" value={meta.passingScore} onChange={(e) => setMeta({ ...meta, passingScore: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="asm-time">
            Time (min)
          </label>
          <input id="asm-time" type="number" min="0" className="input" value={meta.timeLimitMin} onChange={(e) => setMeta({ ...meta, timeLimitMin: e.target.value })} />
        </div>
        <div className="sm:col-span-4">
          <label className="label" htmlFor="asm-course">
            Attach to course
          </label>
          <select id="asm-course" className="input" value={meta.courseId} onChange={(e) => setMeta({ ...meta, courseId: e.target.value })}>
            {eligibleCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.assessmentId ? ' (has assessment)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {questions.length > 0 && (
        <ol className="mt-5 space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-400">{i + 1}</span>
              <span className="flex-1 truncate">{q.stem}</span>
              <Badge tone="brand">{q.type}</Badge>
              <button type="button" className="btn-ghost px-2 py-1" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} aria-label="Remove question">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 space-y-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Question type">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={draft.type === type}
              onClick={() => setDraft((d) => ({ ...d, type, correct: [] }))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${draft.type === type ? 'border-brand-600 bg-white text-brand-700 ring-1 ring-brand-600' : 'border-slate-300 bg-white text-slate-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea rows={2} className="input" placeholder="Clinical vignette (optional)" value={draft.vignette} onChange={(e) => setDraft({ ...draft, vignette: e.target.value })} aria-label="Clinical vignette" />
        <input className="input" placeholder="Question stem *" value={draft.stem} onChange={(e) => setDraft({ ...draft, stem: e.target.value })} aria-label="Question stem" />

        {draft.type === 'dosage' ? (
          <>
            <div>
              <textarea
                rows={3}
                className="input font-mono text-xs"
                placeholder="Give calcium gluconate [[10 mL of 10%]] IV over [[2–3 minutes]], then insulin [[10 units]] IV with dextrose."
                value={draft.dosageText}
                onChange={(e) => setDraft({ ...draft, dosageText: e.target.value })}
                aria-label="Protocol sentence"
              />
              <p className="mt-1 text-xs text-slate-500">Wrap each correct token in [[double brackets]] to create a blank.</p>
            </div>
            <input className="input" placeholder="Distractor tokens, comma-separated (e.g. 1 g, 30 minutes)" value={draft.distractors} onChange={(e) => setDraft({ ...draft, distractors: e.target.value })} aria-label="Distractor tokens" />
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">{draft.type === 'single' ? 'Select the one correct option.' : 'Tick every correct option.'}</p>
            {draft.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={draft.type === 'single' ? 'radio' : 'checkbox'}
                  name="draft-correct"
                  className="h-4 w-4 accent-brand-600"
                  checked={draft.correct.includes(OPTION_IDS[i])}
                  onChange={() => toggleCorrect(OPTION_IDS[i])}
                  aria-label={`Mark option ${OPTION_IDS[i].toUpperCase()} correct`}
                />
                <input
                  className="input"
                  placeholder={`Option ${OPTION_IDS[i].toUpperCase()}`}
                  value={opt}
                  onChange={(e) => setDraft((d) => ({ ...d, options: d.options.map((o, idx) => (idx === i ? e.target.value : o)) }))}
                />
              </div>
            ))}
            {draft.options.length < OPTION_IDS.length && (
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setDraft((d) => ({ ...d, options: [...d.options, ''] }))}>
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
            )}
            {draft.type === 'multi' && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600">Scoring:</span>
                {[
                  ['partial', 'Partial credit'],
                  ['all_or_nothing', 'All-or-nothing'],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5">
                    <input type="radio" name="draft-scoring" className="accent-brand-600" checked={draft.scoring === val} onChange={() => setDraft({ ...draft, scoring: val })} />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea rows={2} className="input" placeholder="Clinical rationale *" value={draft.rationale} onChange={(e) => setDraft({ ...draft, rationale: e.target.value })} aria-label="Clinical rationale" />
        <input className="input" placeholder="Citation (optional)" value={draft.citation} onChange={(e) => setDraft({ ...draft, citation: e.target.value })} aria-label="Citation" />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end">
          <button type="button" className="btn-secondary" onClick={addQuestion}>
            <Plus className="h-4 w-4" /> Add question
          </button>
        </div>
      </div>
    </Card>
  )
}
