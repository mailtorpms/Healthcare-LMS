import { useState } from 'react'
import { BookOpen, ClipboardList, Layers, Users } from 'lucide-react'
import PageHeader from '../layout/PageHeader.jsx'
import StatCard from '../ui/StatCard.jsx'
import CohortModal from './CohortModal.jsx'
import CohortAssignment from './CohortAssignment.jsx'
import CourseBuilder from './CourseBuilder.jsx'
import AssessmentBuilder from './AssessmentBuilder.jsx'
import { learnersOf } from '../../lib/stats.js'

export default function CourseAdminDashboard({ state, actions, onPreviewAssessment }) {
  const [modalOpen, setModalOpen] = useState(false)
  const learners = learnersOf(state.users)
  const unassigned = learners.filter((l) => !state.cohorts.some((c) => c.memberIds.includes(l.id))).length

  return (
    <>
      <PageHeader title="Course administration" description="Build cohorts, assign learners and author clinical courses and assessments." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cohorts" value={state.cohorts.length} icon={Layers} />
        <StatCard label="Learners" value={learners.length} hint={`${unassigned} not in any cohort`} icon={Users} tone="blue" />
        <StatCard label="Courses" value={state.courses.length} icon={BookOpen} tone="violet" />
        <StatCard label="Assessments" value={state.assessments.length} icon={ClipboardList} tone="green" />
      </div>
      <div className="space-y-6">
        <CohortAssignment
          state={state}
          learners={learners}
          onToggleMember={actions.toggleCohortMember}
          onToggleCourse={actions.toggleCourseCohort}
          onDeleteCohort={actions.deleteCohort}
          onNewCohort={() => setModalOpen(true)}
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <CourseBuilder state={state} onCreateCourse={actions.createCourse} />
          <AssessmentBuilder state={state} onCreateAssessment={actions.createAssessment} onPreview={onPreviewAssessment} />
        </div>
      </div>
      <CohortModal open={modalOpen} onClose={() => setModalOpen(false)} learners={learners} onCreate={actions.createCohort} />
    </>
  )
}
