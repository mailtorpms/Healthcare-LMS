import { useState } from 'react'
import { Ban, CircleCheck, Search, Users } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import Avatar from '../ui/Avatar.jsx'
import { ROLE_LABELS } from '../../data/seed.js'
import { bestAttempt } from '../../lib/stats.js'
import { formatPercent } from '../../lib/format.js'

export default function UserManagement({ state, currentUserId, onUpdateUser }) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const q = query.trim().toLowerCase()
  const users = state.users.filter(
    (u) =>
      (roleFilter === 'all' || u.role === roleFilter) &&
      (!q || [u.name, u.email, u.specialty, u.profession].some((f) => f.toLowerCase().includes(q))),
  )

  const cohortNames = (userId) =>
    state.cohorts
      .filter((c) => c.memberIds.includes(userId))
      .map((c) => c.name)
      .join(', ')

  return (
    <Card
      title="User management"
      subtitle={`${state.users.length} accounts`}
      icon={Users}
      bodyClassName="overflow-x-auto"
      actions={
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input className="input w-56 pl-8" placeholder="Search name, email, specialty" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
          </div>
          <select className="input w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
            <option value="all">All roles</option>
            {Object.entries(ROLE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </>
      }
    >
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">User</th>
            <th className="px-3 py-3 font-medium">Profession</th>
            <th className="px-3 py-3 font-medium">Cohorts</th>
            <th className="px-3 py-3 font-medium">Best score</th>
            <th className="px-3 py-3 font-medium">Role</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => {
            const best = bestAttempt(state.attempts, u.id)
            const isSelf = u.id === currentUserId
            return (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p>{u.profession}</p>
                  <p className="text-xs text-slate-500">{u.specialty}</p>
                </td>
                <td className="max-w-[12rem] truncate px-3 py-3 text-slate-600" title={cohortNames(u.id)}>
                  {cohortNames(u.id) || <span className="text-slate-400">None</span>}
                </td>
                <td className="px-3 py-3">{best ? formatPercent(best.score) : <span className="text-slate-400">—</span>}</td>
                <td className="px-3 py-3">
                  <select
                    className="input w-36 py-1"
                    value={u.role}
                    disabled={isSelf}
                    onChange={(e) => onUpdateUser(u.id, { role: e.target.value }, `role → ${ROLE_LABELS[e.target.value]}`)}
                    aria-label={`Role for ${u.name}`}
                  >
                    {Object.entries(ROLE_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  {!isSelf &&
                    (u.status === 'active' ? (
                      <button type="button" className="btn-ghost px-2 py-1 text-rose-600" onClick={() => onUpdateUser(u.id, { status: 'suspended' }, 'suspended')}>
                        <Ban className="h-4 w-4" /> Suspend
                      </button>
                    ) : (
                      <button type="button" className="btn-ghost px-2 py-1 text-emerald-700" onClick={() => onUpdateUser(u.id, { status: 'active' }, 'reactivated')}>
                        <CircleCheck className="h-4 w-4" /> Reactivate
                      </button>
                    ))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {users.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No users match your filters.</p>}
    </Card>
  )
}
