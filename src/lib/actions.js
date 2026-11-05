import { uid } from './ids.js'

/**
 * State transitions for the demo store. Each action takes the setter from
 * App's persistent state and the acting user's id, so audit entries are
 * attributed correctly. In production these map 1:1 to Supabase mutations.
 */
export function createActions(setState, actorId) {
  const log = (state, action, target) => ({
    ...state,
    auditLog: [...state.auditLog, { id: uid('log'), at: new Date().toISOString(), actorId, action, target }],
  })

  return {
    updateUser(userId, patch, description) {
      setState((s) => {
        const user = s.users.find((u) => u.id === userId)
        const next = { ...s, users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) }
        return log(next, 'user.updated', `${user?.name}: ${description}`)
      })
    },

    createCohort({ name, description, specialty, memberIds }) {
      setState((s) =>
        log(
          {
            ...s,
            cohorts: [...s.cohorts, { id: uid('c'), name, description, specialty, memberIds, createdBy: actorId, createdAt: new Date().toISOString() }],
          },
          'cohort.created',
          `${name} (${memberIds.length} members)`,
        ),
      )
    },

    deleteCohort(cohortId) {
      setState((s) => {
        const cohort = s.cohorts.find((c) => c.id === cohortId)
        return log(
          {
            ...s,
            cohorts: s.cohorts.filter((c) => c.id !== cohortId),
            courses: s.courses.map((c) => ({ ...c, cohortIds: c.cohortIds.filter((id) => id !== cohortId) })),
          },
          'cohort.deleted',
          cohort?.name ?? cohortId,
        )
      })
    },

    toggleCohortMember(cohortId, userId) {
      setState((s) => {
        const cohort = s.cohorts.find((c) => c.id === cohortId)
        const user = s.users.find((u) => u.id === userId)
        const isMember = cohort.memberIds.includes(userId)
        return log(
          {
            ...s,
            cohorts: s.cohorts.map((c) =>
              c.id === cohortId ? { ...c, memberIds: isMember ? c.memberIds.filter((id) => id !== userId) : [...c.memberIds, userId] } : c,
            ),
          },
          isMember ? 'cohort.member_removed' : 'cohort.member_added',
          `${user?.name} → ${cohort.name}`,
        )
      })
    },

    toggleCourseCohort(courseId, cohortId) {
      setState((s) => {
        const course = s.courses.find((c) => c.id === courseId)
        const cohort = s.cohorts.find((c) => c.id === cohortId)
        const assigned = course.cohortIds.includes(cohortId)
        return log(
          {
            ...s,
            courses: s.courses.map((c) =>
              c.id === courseId ? { ...c, cohortIds: assigned ? c.cohortIds.filter((id) => id !== cohortId) : [...c.cohortIds, cohortId] } : c,
            ),
          },
          assigned ? 'course.unassigned' : 'course.assigned',
          `${course.title} → ${cohort?.name}`,
        )
      })
    },

    createCourse(course) {
      const id = uid('crs')
      setState((s) =>
        log(
          {
            ...s,
            courses: [
              ...s.courses,
              {
                ...course,
                id,
                assessmentId: null,
                createdBy: actorId,
                modules: course.modules.map((m) => ({ ...m, id: uid('m'), title: m.title.trim() })),
              },
            ],
          },
          'course.created',
          course.title,
        ),
      )
    },

    createAssessment(assessment) {
      setState((s) =>
        log(
          {
            ...s,
            assessments: [...s.assessments, assessment],
            courses: s.courses.map((c) => (c.id === assessment.courseId ? { ...c, assessmentId: assessment.id } : c)),
          },
          'assessment.published',
          `${assessment.title} (${assessment.questions.length} questions)`,
        ),
      )
    },

    toggleModule(userId, courseId, moduleId) {
      setState((s) => {
        const current = s.progress[userId]?.[courseId] ?? []
        const next = current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]
        return { ...s, progress: { ...s.progress, [userId]: { ...s.progress[userId], [courseId]: next } } }
      })
    },

    recordAttempt(userId, { assessmentId, score, passed, responses, durationSec }) {
      setState((s) => ({
        ...s,
        attempts: [...s.attempts, { id: uid('att'), userId, assessmentId, score, passed, responses, durationSec, submittedAt: new Date().toISOString() }],
      }))
    },
  }
}
