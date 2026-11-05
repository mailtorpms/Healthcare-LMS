import SingleChoiceQuestion from './SingleChoiceQuestion.jsx'
import MultiChoiceQuestion from './MultiChoiceQuestion.jsx'
import DosageSlotQuestion from './DosageSlotQuestion.jsx'
import { TYPE_LABELS } from './questionTypes.js'

const COMPONENTS = {
  single: SingleChoiceQuestion,
  multi: MultiChoiceQuestion,
  dosage: DosageSlotQuestion,
}

export default function QuestionBody({ question, index, total, response, onChange, reviewing, result }) {
  const Component = COMPONENTS[question.type]
  return (
    <article>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span>
          Question {index + 1} of {total}
        </span>
        <span aria-hidden="true">•</span>
        <span className="text-brand-700">{TYPE_LABELS[question.type]}</span>
        <span aria-hidden="true">•</span>
        <span>
          {question.points ?? 1} pt{(question.points ?? 1) === 1 ? '' : 's'}
        </span>
      </div>
      {question.vignette && (
        <p className="mb-4 rounded-lg border-l-4 border-sky-400 bg-sky-50 p-4 text-sm leading-relaxed text-slate-700">{question.vignette}</p>
      )}
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{question.stem}</h3>
      {Component ? (
        <Component
          question={question}
          response={response}
          onChange={onChange}
          reviewing={reviewing}
          slotResults={result?.slotResults}
        />
      ) : (
        <p className="text-sm text-rose-600">Unsupported question type: {question.type}</p>
      )}
    </article>
  )
}
