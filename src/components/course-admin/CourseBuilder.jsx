import { useState } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'

const blank = () => ({ title: '', specialty: '', description: '', cmeCredits: 1, cohortIds: [], modules: [{ title: '', durationMin: 20 }] })

export default function CourseBuilder({ state, onCreateCourse }) {
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState('')

  const setModule = (i, patch) => setForm((f) => ({ ...f, modules: f.modules.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }))

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!(form.cmeCredits >= 0)) errs.cme = 'Enter a valid credit value.'
    const modules = form.modules.filter((m) => m.title.trim())
    if (modules.length === 0) errs.modules = 'Add at least one module.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onCreateCourse({ ...form, title: form.title.trim(), cmeCredits: Number(form.cmeCredits), modules })
    setSaved(form.title.trim())
    setForm(blank())
  }

  return (
    <Card title="Create course" subtitle="Define modules, CME credits and target cohorts" icon={BookOpen}>
      <form onSubmit={submit} className="space-y-4">
        {saved && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
            “{saved}” created. Attach an assessment below.
          </p>
        )}
        <div>
          <label className="label" htmlFor="course-title">
            Course title *
          </label>
          <input id="course-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hyperkalaemia Emergencies" />
          {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="course-specialty">
              Specialty
            </label>
            <input id="course-specialty" className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Emergency Medicine" />
          </div>
          <div>
            <label className="label" htmlFor="course-cme">
              CME credits
            </label>
            <input id="course-cme" type="number" min="0" step="0.25" className="input" value={form.cmeCredits} onChange={(e) => setForm({ ...form, cmeCredits: e.target.value })} />
            {errors.cme && <p className="mt-1 text-xs text-rose-600">{errors.cme}</p>}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="course-desc">
            Description
          </label>
          <textarea id="course-desc" rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <p className="label">Modules</p>
          <div className="space-y-2">
            {form.modules.map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex w-7 items-center justify-center text-xs font-semibold text-slate-400">{i + 1}</span>
                <input className="input flex-1" placeholder="Module title" value={m.title} onChange={(e) => setModule(i, { title: e.target.value })} aria-label={`Module ${i + 1} title`} />
                <input type="number" min="1" className="input w-24" value={m.durationMin} onChange={(e) => setModule(i, { durationMin: Number(e.target.value) })} aria-label={`Module ${i + 1} minutes`} />
                <button
                  type="button"
                  className="btn-ghost px-2"
                  disabled={form.modules.length === 1}
                  onClick={() => setForm((f) => ({ ...f, modules: f.modules.filter((_, idx) => idx !== i) }))}
                  aria-label={`Remove module ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.modules && <p className="mt-1 text-xs text-rose-600">{errors.modules}</p>}
          <button type="button" className="btn-ghost mt-2 px-2 py-1 text-xs" onClick={() => setForm((f) => ({ ...f, modules: [...f.modules, { title: '', durationMin: 20 }] }))}>
            <Plus className="h-3.5 w-3.5" /> Add module
          </button>
        </div>

        <div>
          <p className="label">Assign to cohorts</p>
          <div className="flex flex-wrap gap-2">
            {state.cohorts.map((c) => {
              const on = form.cohortIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setForm((f) => ({ ...f, cohortIds: on ? f.cohortIds.filter((x) => x !== c.id) : [...f.cohortIds, c.id] }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600'}`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            <Plus className="h-4 w-4" /> Create course
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Course catalogue</p>
        <ul className="space-y-2">
          {state.courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{c.title}</span>
              <span className="flex shrink-0 gap-1">
                <Badge tone="violet">{c.cmeCredits} CME</Badge>
                <Badge tone={c.assessmentId ? 'green' : 'slate'}>{c.assessmentId ? 'Assessed' : 'No assessment'}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
