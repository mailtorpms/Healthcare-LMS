/** Derived metrics shared across dashboards. All functions are pure. */

export function learnersOf(users) {
  return users.filter((u) => u.role === 'learner')
}

export function bestAttempt(attempts, userId, assessmentId) {
  return attempts
    .filter((a) => a.userId === userId && (!assessmentId || a.assessmentId === assessmentId))
    .reduce((best, a) => (!best || a.score > best.score ? a : best), null)
}

export function average(nums) {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null
}

export function courseCompletion(course, progress, userId) {
  const done = progress[userId]?.[course.id]?.length ?? 0
  return course.modules.length ? (done / course.modules.length) * 100 : 0
}

export function coursesForUser(state, userId) {
  const cohortIds = state.cohorts.filter((c) => c.memberIds.includes(userId)).map((c) => c.id)
  return state.courses.filter((course) => course.cohortIds.some((id) => cohortIds.includes(id)))
}

/** A course is complete when all modules are done and (if present) the assessment is passed. */
export function isCourseComplete(state, course, userId) {
  const modulesDone = courseCompletion(course, state.progress, userId) >= 100
  if (!modulesDone) return false
  if (!course.assessmentId) return true
  return state.attempts.some((a) => a.userId === userId && a.assessmentId === course.assessmentId && a.passed)
}

export function cmeEarned(state, userId) {
  return coursesForUser(state, userId)
    .filter((c) => isCourseComplete(state, c, userId))
    .reduce((sum, c) => sum + c.cmeCredits, 0)
}

export function cohortPerformance(state, cohort) {
  const members = cohort.memberIds
  const scores = members.map((id) => bestAttempt(state.attempts, id)?.score).filter((s) => s != null)
  const cohortCourses = state.courses.filter((c) => c.cohortIds.includes(cohort.id))
  const completions = members.flatMap((uid) => cohortCourses.map((c) => courseCompletion(c, state.progress, uid)))
  const passedCount = members.filter((id) => state.attempts.some((a) => a.userId === id && a.passed)).length
  const lastActivity = state.attempts
    .filter((a) => members.includes(a.userId))
    .map((a) => a.submittedAt)
    .sort()
    .at(-1)

  return {
    memberCount: members.length,
    courseCount: cohortCourses.length,
    avgScore: average(scores),
    attemptedCount: scores.length,
    passRate: members.length ? (passedCount / members.length) * 100 : null,
    avgCompletion: average(completions),
    lastActivity,
    notAttempted: members.filter((id) => !state.attempts.some((a) => a.userId === id)),
    belowThreshold: members.filter((id) => {
      const best = bestAttempt(state.attempts, id)
      return best && !best.passed
    }),
  }
}
