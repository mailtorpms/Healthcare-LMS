import { BookOpen, CircleCheck, GraduationCap, HeartPulse, PlayCircle, Target } from 'lucide-react'
import PageHeader from '../layout/PageHeader.jsx'
import StatCard from '../ui/StatCard.jsx'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import CourseCard from './CourseCard.jsx'
import CmeTracker from './CmeTracker.jsx'
import { bestAttempt, cmeEarned, coursesForUser, isCourseComplete } from '../../lib/stats.js'
import { formatDateTime, formatPercent } from '../../lib/format.js'

export default function LearnerDashboard({ state, user, actions, onLaunchAssessment }) {
  const courses = coursesForUser(state, user.id)
  const myAttempts = state.attempts.filter((a) => a.userId === user.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const completedCourses = courses.filter((c) => isCourseComplete(state, c, user.id))
  const earned = cmeEarned(state, user.id)
  const pending = courses.filter((c) => !isCourseComplete(state, c, user.id)).reduce((s, c) => s + c.cmeCredits, 0)
  const pendingQuizzes = courses.filter((c) => c.assessmentId && !state.attempts.some((a) => a.userId === user.id && a.assessmentId === c.assessmentId && a.passed))
  const assessmentById = (id) => state.assessments.find((a) => a.id === id)
  const firstName = user.name.replace(/^Dr\.\s*/, '').split(/[\s,]/)[0]

  if (user.status !== 'active') {
    return (
      <EmptyState icon={GraduationCap} title="Account suspended">
        Contact your education administrator to restore access.
      </EmptyState>
    )
  }

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} description={`${user.profession} · ${user.specialty}`} />

      {pendingQuizzes.length > 0 && (
        <div className="mb-6 flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-brand-700 to-sky-700 p-6 text-white shadow-md sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <HeartPulse className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-sm text-white/80">Quiz launcher · {pendingQuizzes.length} assessment(s) awaiting a passing score</p>
            <p className="text-lg font-semibold">{assessmentById(pendingQuizzes[0].assessmentId)?.title ?? pendingQuizzes[0].title}</p>
          </div>
          <button type="button" className="btn bg-white text-brand-800 hover:bg-brand-50" onClick={() => onLaunchAssessment(pendingQuizzes[0].assessmentId)}>
            <PlayCircle className="h-5 w-5" /> Start now
          </button>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned courses" value={courses.length} icon={BookOpen} />
        <StatCard label="Completed" value={completedCourses.length} icon={CircleCheck} tone="green" />
        <StatCard label="Best assessment score" value={formatPercent(bestAttempt(state.attempts, user.id)?.score)} icon={Target} tone="blue" />
        <StatCard label="CME earned here" value={earned.toFixed(1)} icon={GraduationCap} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">My courses</h2>
          {courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses assigned yet">
              You will see courses here once you are added to a cohort.
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  completedIds={state.progress[user.id]?.[c.id] ?? []}
                  assessment={c.assessmentId ? assessmentById(c.assessmentId) : null}
                  best={c.assessmentId ? bestAttempt(state.attempts, user.id, c.assessmentId) : null}
                  complete={isCourseComplete(state, c, user.id)}
                  onToggleModule={(moduleId) => actions.toggleModule(user.id, c.id, moduleId)}
                  onLaunch={() => onLaunchAssessment(c.assessmentId)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <CmeTracker earnedHere={earned} external={state.externalCmeCredits[user.id] ?? 0} pending={pending} />
          <Card title="Attempt history" bodyClassName="p-0">
            {myAttempts.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No attempts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myAttempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{assessmentById(a.assessmentId)?.title ?? 'Assessment'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(a.submittedAt)}</p>
                    </div>
                    <Badge tone={a.passed ? 'green' : 'red'}>{Math.round(a.score)}%</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}
