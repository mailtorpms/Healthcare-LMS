import { useMemo, useState } from 'react'
import RoleBanner from './components/layout/RoleBanner.jsx'
import AdminDashboard from './components/admin/AdminDashboard.jsx'
import CourseAdminDashboard from './components/course-admin/CourseAdminDashboard.jsx'
import LearnerDashboard from './components/learner/LearnerDashboard.jsx'
import AssessmentRunner from './components/assessment/AssessmentRunner.jsx'
import { usePersistentState } from './hooks/usePersistentState.js'
import { createSeedState, DEMO_IDENTITIES } from './data/seed.js'
import { createActions } from './lib/actions.js'

const STORAGE_KEY = 'clinicaled-lms-state-v1'

export default function App() {
  const [role, setRole] = usePersistentState('clinicaled-lms-role', 'learner')
  const [state, setState] = usePersistentState(STORAGE_KEY, createSeedState)
  // { assessment, preview } while an assessment is open, otherwise null.
  const [runner, setRunner] = useState(null)

  const currentUserId = DEMO_IDENTITIES[role]
  const currentUser = state.users.find((u) => u.id === currentUserId)
  const actions = useMemo(() => createActions(setState, currentUserId), [setState, currentUserId])

  const changeRole = (next) => {
    setRunner(null)
    setRole(next)
  }

  const resetDemo = () => {
    if (!window.confirm('Reset all demo data to its initial state?')) return
    setRunner(null)
    setState(createSeedState())
  }

  const openAssessment = (assessmentId) => {
    const assessment = state.assessments.find((a) => a.id === assessmentId)
    if (assessment) setRunner({ assessment, preview: false })
  }

  let content
  if (runner) {
    content = (
      <>
        {runner.preview && (
          <p className="mx-auto mb-4 max-w-4xl rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Preview mode: attempts are not recorded.</p>
        )}
        <AssessmentRunner
          key={runner.assessment.id}
          assessment={runner.assessment}
          onExit={() => setRunner(null)}
          onSubmitAttempt={runner.preview ? undefined : (attempt) => actions.recordAttempt(currentUserId, attempt)}
        />
      </>
    )
  } else if (role === 'admin') {
    content = <AdminDashboard state={state} currentUserId={currentUserId} actions={actions} />
  } else if (role === 'course_admin') {
    content = <CourseAdminDashboard state={state} actions={actions} onPreviewAssessment={(assessment) => setRunner({ assessment, preview: true })} />
  } else {
    content = <LearnerDashboard state={state} user={currentUser} actions={actions} onLaunchAssessment={openAssessment} />
  }

  return (
    <div className="min-h-screen">
      <RoleBanner role={role} onRoleChange={changeRole} currentUser={currentUser} onReset={resetDemo} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{content}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        ClinicalEd LMS demo · Educational content only. Not a substitute for clinical judgement or current institutional protocols.
      </footer>
    </div>
  )
}
