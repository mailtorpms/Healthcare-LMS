import { CircleCheck, CircleX } from 'lucide-react'

export default function SingleChoiceQuestion({ question, response, onChange, reviewing = false }) {
  const { options, correctId } = question.payload
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{question.stem}</legend>
      {options.map((opt) => {
        const selected = response === opt.id
        const isCorrect = opt.id === correctId
        let style = selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        if (reviewing) {
          if (isCorrect) style = 'border-emerald-500 bg-emerald-50'
          else if (selected) style = 'border-rose-400 bg-rose-50'
          else style = 'border-slate-200 opacity-70'
        }
        return (
          <label key={opt.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${style} ${reviewing ? 'cursor-default' : ''}`}>
            <input
              type="radio"
              name={question.id}
              value={opt.id}
              checked={selected}
              disabled={reviewing}
              onChange={() => onChange(opt.id)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="flex-1 text-sm text-slate-800">{opt.text}</span>
            {reviewing && isCorrect && <CircleCheck className="h-5 w-5 text-emerald-600" aria-label="Correct answer" />}
            {reviewing && selected && !isCorrect && <CircleX className="h-5 w-5 text-rose-500" aria-label="Your incorrect answer" />}
          </label>
        )
      })}
    </fieldset>
  )
}
