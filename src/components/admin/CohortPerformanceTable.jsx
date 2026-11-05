import { TrendingUp } from 'lucide-react'
import Card from '../ui/Card.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'
import Badge from '../ui/Badge.jsx'
import { cohortPerformance } from '../../lib/stats.js'
import { formatDate, formatPercent } from '../../lib/format.js'

export default function CohortPerformanceTable({ state }) {
  const rows = state.cohorts.map((c) => ({ cohort: c, perf: cohortPerformance(state, c) }))
  return (
    <Card title="Cohort performance" subtitle="Best attempt per learner across assessed courses" icon={TrendingUp} bodyClassName="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Cohort</th>
            <th className="px-3 py-3 font-medium">Learners</th>
            <th className="px-3 py-3 font-medium">Courses</th>
            <th className="px-3 py-3 font-medium">Avg score</th>
            <th className="px-3 py-3 font-medium">Pass rate</th>
            <th className="w-48 px-3 py-3 font-medium">Module completion</th>
            <th className="px-5 py-3 font-medium">Last activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ cohort, perf }) => (
            <tr key={cohort.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <p className="font-medium text-slate-900">{cohort.name}</p>
                <p className="text-xs text-slate-500">{cohort.specialty}</p>
              </td>
              <td className="px-3 py-3">{perf.memberCount}</td>
              <td className="px-3 py-3">{perf.courseCount}</td>
              <td className="px-3 py-3">
                {perf.avgScore == null ? (
                  <span className="text-slate-400">No attempts</span>
                ) : (
                  <Badge tone={perf.avgScore >= 80 ? 'green' : perf.avgScore >= 70 ? 'amber' : 'red'}>{formatPercent(perf.avgScore)}</Badge>
                )}
              </td>
              <td className="px-3 py-3">{formatPercent(perf.passRate)}</td>
              <td className="px-3 py-3">
                <ProgressBar value={perf.avgCompletion ?? 0} showValue label="" />
              </td>
              <td className="px-5 py-3 text-slate-600">{formatDate(perf.lastActivity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
