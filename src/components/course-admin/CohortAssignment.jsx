import { useState } from 'react'
import { Layers, Plus, Search, Trash2 } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import EmptyState from '../ui/EmptyState.jsx'

export default function CohortAssignment({ state, learners, onToggleMember, onToggleCourse, onDeleteCohort, onNewCohort }) {
  const [selectedId, setSelectedId] = useState(state.cohorts[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const cohort = state.cohorts.find((c) => c.id === selectedId) ?? state.cohorts[0]

  const q = query.trim().toLowerCase()
  const filtered = learners.filter((l) => !q || `${l.name} ${l.specialty} ${l.profession}`.toLowerCase().includes(q))

  return (
    <Card
      title="Cohorts & assignments"
      subtitle="Assign learners and courses to cohorts"
      icon={Layers}
      actions={
        <button type="button" className="btn-primary" onClick={onNewCohort}>
          <Plus className="h-4 w-4" /> New cohort
        </button>
      }
    >
      {!cohort ? (
        <EmptyState icon={Layers} title="No cohorts yet">
          Create a cohort to start assigning learners.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="Cohorts" className="space-y-1">
            {state.cohorts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  c.id === cohort.id ? 'bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-200' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{c.name}</span>
                <Badge tone="slate">{c.memberIds.length}</Badge>
              </button>
            ))}
          </nav>

          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{cohort.name}</h3>
                <p className="text-sm text-slate-500">{cohort.description || cohort.specialty || 'No description'}</p>
              </div>
              <button
                type="button"
                className="btn-ghost px-2 py-1 text-rose-600"
                onClick={() => {
                  if (window.confirm(`Delete cohort "${cohort.name}"? Learners are not deleted.`)) {
                    onDeleteCohort(cohort.id)
                    setSelectedId(null)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>

            <div>
              <p className="label">Assigned courses</p>
              <div className="flex flex-wrap gap-2">
                {state.courses.map((course) => {
                  const on = course.cohortIds.includes(cohort.id)
                  return (
                    <button
                      key={course.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onToggleCourse(course.id, cohort.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                      }`}
                    >
                      {course.title}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="label mb-0">
                  Learners · {cohort.memberIds.length} of {learners.length} assigned
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="input w-56 pl-8" placeholder="Filter learners" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter learners" />
                </div>
              </div>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {filtered.map((l) => {
                  const member = cohort.memberIds.includes(l.id)
                  return (
                    <li key={l.id} className="flex items-center gap-3 px-3 py-2">
                      <Avatar name={l.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{l.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {l.profession} · {l.specialty}
                        </p>
                      </div>
                      {l.status !== 'active' && <Badge tone="red">{l.status}</Badge>}
                      <button
                        type="button"
                        onClick={() => onToggleMember(cohort.id, l.id)}
                        className={member ? 'btn-secondary px-3 py-1 text-xs' : 'btn-primary px-3 py-1 text-xs'}
                      >
                        {member ? 'Remove' : 'Assign'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
