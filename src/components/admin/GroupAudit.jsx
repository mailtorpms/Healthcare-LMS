import { ClipboardList, Flag, ListChecks } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import { cohortPerformance } from '../../lib/stats.js'
import { formatDate, formatDateTime } from '../../lib/format.js'

export default function GroupAudit({ state }) {
  const nameOf = (id) => state.users.find((u) => u.id === id)?.name ?? 'Unknown'

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card title="Group audit summaries" subtitle="Compliance flags per cohort" icon={ListChecks} className="xl:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          {state.cohorts.map((c) => {
            const perf = cohortPerformance(state, c)
            const suspended = c.memberIds.filter((id) => state.users.find((u) => u.id === id)?.status === 'suspended')
            const flags = [
              perf.notAttempted.length > 0 && { tone: 'amber', text: `${perf.notAttempted.length} learner(s) with no assessment attempt` },
              perf.belowThreshold.length > 0 && { tone: 'red', text: `${perf.belowThreshold.length} learner(s) below 80% threshold` },
              suspended.length > 0 && { tone: 'red', text: `${suspended.length} suspended account(s) still enrolled` },
              perf.courseCount === 0 && { tone: 'amber', text: 'No courses assigned' },
            ].filter(Boolean)
            return (
              <div key={c.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      Created {formatDate(c.createdAt)} by {nameOf(c.createdBy)}
                    </p>
                  </div>
                  <Badge tone={flags.length ? 'amber' : 'green'}>{flags.length ? `${flags.length} flag${flags.length > 1 ? 's' : ''}` : 'Compliant'}</Badge>
                </div>
                <dl className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-slate-50 p-2">
                    <dt className="text-slate-500">Members</dt>
                    <dd className="text-base font-semibold">{perf.memberCount}</dd>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <dt className="text-slate-500">Attempted</dt>
                    <dd className="text-base font-semibold">{perf.attemptedCount}</dd>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <dt className="text-slate-500">Courses</dt>
                    <dd className="text-base font-semibold">{perf.courseCount}</dd>
                  </div>
                </dl>
                {flags.length > 0 ? (
                  <ul className="space-y-1">
                    {flags.map((f) => (
                      <li key={f.text} className={`flex items-center gap-2 text-xs ${f.tone === 'red' ? 'text-rose-700' : 'text-amber-700'}`}>
                        <Flag className="h-3.5 w-3.5 shrink-0" /> {f.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-700">All members have attempted and passed.</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Audit log" subtitle="Most recent administrative events" icon={ClipboardList} bodyClassName="max-h-[28rem] overflow-y-auto">
        <ol className="space-y-3 p-5">
          {[...state.auditLog]
            .sort((a, b) => b.at.localeCompare(a.at))
            .slice(0, 25)
            .map((e) => (
              <li key={e.id} className="border-l-2 border-brand-200 pl-3">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{nameOf(e.actorId)}</span> <code className="rounded bg-slate-100 px-1 text-xs">{e.action}</code>
                </p>
                <p className="text-xs text-slate-500">
                  {e.target} · {formatDateTime(e.at)}
                </p>
              </li>
            ))}
        </ol>
      </Card>
    </div>
  )
}
