import { CircleCheck, CircleX } from 'lucide-react'
import Badge from '../ui/Badge.jsx'

export default function MultiChoiceQuestion({ question, response = [], onChange, reviewing = false }) {
  const { options, correctIds, scoring } = question.payload
  const toggle = (id) => onChange(response.includes(id) ? response.filter((x) => x !== id) : [...response, id])

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Select all that apply.</span>
        <Badge tone={scoring === 'partial' ? 'blue' : 'amber'}>
          {scoring === 'partial' ? 'Partial credit: wrong picks cancel right picks' : 'All-or-nothing scoring'}
        </Badge>
      </legend>
      {options.map((opt) => {
        const selected = response.includes(opt.id)
        const isCorrect = correctIds.includes(opt.id)
        let style = selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        if (reviewing) {
          if (isCorrect && selected) style = 'border-emerald-500 bg-emerald-50'
          else if (isCorrect) style = 'border-emerald-400 border-dashed bg-white'
          else if (selected) style = 'border-rose-400 bg-rose-50'
          else style = 'border-slate-200 opacity-70'
        }
        return (
          <label key={opt.id} className={`flex items-center gap-3 rounded-lg border p-3 transition ${style} ${reviewing ? '' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={selected}
              disabled={reviewing}
              onChange={() => toggle(opt.id)}
              className="h-4 w-4 rounded accent-brand-600"
            />
            <span className="flex-1 text-sm text-slate-800">{opt.text}</span>
            {reviewing && isCorrect && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CircleCheck className="h-4 w-4" /> {selected ? 'Correct' : 'Missed'}
              </span>
            )}
            {reviewing && selected && !isCorrect && (
              <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
                <CircleX className="h-4 w-4" /> Incorrect pick
              </span>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}
