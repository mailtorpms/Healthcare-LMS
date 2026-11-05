import { Award, BookOpen, Target, Users } from 'lucide-react'
import PageHeader from '../layout/PageHeader.jsx'
import StatCard from '../ui/StatCard.jsx'
import CohortPerformanceTable from './CohortPerformanceTable.jsx'
import UserManagement from './UserManagement.jsx'
import GroupAudit from './GroupAudit.jsx'
import { average, learnersOf } from '../../lib/stats.js'
import { formatPercent } from '../../lib/format.js'

export default function AdminDashboard({ state, currentUserId, actions }) {
  const learners = learnersOf(state.users)
  const active = learners.filter((l) => l.status === 'active').length
  const avgScore = average(state.attempts.map((a) => a.score))
  const passRate = state.attempts.length ? (state.attempts.filter((a) => a.passed).length / state.attempts.length) * 100 : null

  return (
    <>
      <PageHeader title="Organisation overview" description="Global learning metrics, user administration and cohort compliance." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total learners" value={learners.length} hint={`${active} active`} icon={Users} />
        <StatCard label="Average score" value={formatPercent(avgScore)} hint={`${state.attempts.length} attempts`} icon={Target} tone="blue" />
        <StatCard label="Attempt pass rate" value={formatPercent(passRate)} hint="Threshold 80%" icon={Award} tone="green" />
        <StatCard label="Courses / cohorts" value={`${state.courses.length} / ${state.cohorts.length}`} hint={`${state.assessments.length} assessments`} icon={BookOpen} tone="violet" />
      </div>
      <div className="space-y-6">
        <CohortPerformanceTable state={state} />
        <UserManagement state={state} currentUserId={currentUserId} onUpdateUser={actions.updateUser} />
        <GroupAudit state={state} />
      </div>
    </>
  )
}
