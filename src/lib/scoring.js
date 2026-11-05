/**
 * Pure scoring functions for the assessment engine.
 * Responses shape:
 *   single -> 'optionId'
 *   multi  -> ['optionId', ...]
 *   dosage -> { slotId: 'token' }
 */

const SLOT_RE = /\{\{(\w+)\}\}/g

/** Splits a dosage template into text and slot segments. */
export function parseTemplate(template) {
  const segments = []
  let last = 0
  for (const match of template.matchAll(SLOT_RE)) {
    if (match.index > last) segments.push({ type: 'text', value: template.slice(last, match.index) })
    segments.push({ type: 'slot', id: match[1] })
    last = match.index + match[0].length
  }
  if (last < template.length) segments.push({ type: 'text', value: template.slice(last) })
  return segments
}

/**
 * Converts author-friendly syntax ("Give [[1 mg]] every [[3–5 min]]") into a
 * dosage payload. Used by the assessment builder.
 */
export function buildDosagePayload(authoringText, distractors = []) {
  const answers = {}
  let i = 0
  const template = authoringText.replace(/\[\[([^\]]+)\]\]/g, (_, token) => {
    i += 1
    const slotId = `s${i}`
    answers[slotId] = token.trim()
    return `{{${slotId}}}`
  })
  const tokens = [...new Set([...Object.values(answers), ...distractors.map((d) => d.trim()).filter(Boolean)])]
  return { template, answers, tokens: shuffle(tokens) }
}

export function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function isAnswered(question, response) {
  if (response == null) return false
  switch (question.type) {
    case 'single':
      return Boolean(response)
    case 'multi':
      return response.length > 0
    case 'dosage':
      return Object.keys(question.payload.answers).every((slot) => Boolean(response[slot]))
    default:
      return false
  }
}

export function scoreQuestion(question, response) {
  const max = question.points ?? 1
  const { payload } = question

  if (question.type === 'single') {
    const correct = response === payload.correctId
    return { earned: correct ? max : 0, max, status: correct ? 'correct' : 'incorrect' }
  }

  if (question.type === 'multi') {
    const selected = new Set(response ?? [])
    const correctSet = new Set(payload.correctIds)
    const hits = [...selected].filter((id) => correctSet.has(id)).length
    const falsePicks = selected.size - hits
    const exact = hits === correctSet.size && falsePicks === 0

    if (payload.scoring === 'all_or_nothing') {
      return { earned: exact ? max : 0, max, status: exact ? 'correct' : 'incorrect', hits, falsePicks }
    }
    // Partial credit: each correct pick earns a share, each wrong pick cancels one; floored at 0.
    const fraction = Math.max(0, (hits - falsePicks) / correctSet.size)
    const earned = Math.round(fraction * max * 100) / 100
    return {
      earned,
      max,
      status: exact ? 'correct' : earned > 0 ? 'partial' : 'incorrect',
      hits,
      falsePicks,
    }
  }

  if (question.type === 'dosage') {
    const slots = Object.keys(payload.answers)
    const slotResults = Object.fromEntries(slots.map((s) => [s, response?.[s] === payload.answers[s]]))
    const right = Object.values(slotResults).filter(Boolean).length
    const earned = Math.round((right / slots.length) * max * 100) / 100
    return {
      earned,
      max,
      status: right === slots.length ? 'correct' : right > 0 ? 'partial' : 'incorrect',
      slotResults,
    }
  }

  return { earned: 0, max, status: 'incorrect' }
}

export function scoreAttempt(assessment, responses) {
  const results = assessment.questions.map((q) => ({ questionId: q.id, ...scoreQuestion(q, responses[q.id]) }))
  const earned = results.reduce((sum, r) => sum + r.earned, 0)
  const max = results.reduce((sum, r) => sum + r.max, 0)
  const percent = max === 0 ? 0 : Math.round((earned / max) * 1000) / 10
  return { results, earned, max, percent, passed: percent >= assessment.passingScore }
}
