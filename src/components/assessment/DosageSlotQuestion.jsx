import { useMemo, useState } from 'react'
import { GripVertical, Undo2 } from 'lucide-react'
import { parseTemplate } from '../../lib/scoring.js'

/**
 * Fill-in-the-blank dosage question.
 * Supports both HTML5 drag-and-drop and click-to-slot (tap a token, then tap a blank)
 * so it works with keyboard, touch and mouse.
 */
export default function DosageSlotQuestion({ question, response = {}, onChange, reviewing = false, slotResults }) {
  const { template, tokens, answers } = question.payload
  const segments = useMemo(() => parseTemplate(template), [template])
  const [selectedToken, setSelectedToken] = useState(null)
  const [hoverSlot, setHoverSlot] = useState(null)

  const usedTokens = new Set(Object.values(response).filter(Boolean))
  const available = tokens.filter((t) => !usedTokens.has(t))

  const place = (slotId, token) => {
    if (reviewing || !token) return
    const next = { ...response }
    // A token can only live in one slot at a time.
    for (const key of Object.keys(next)) if (next[key] === token) delete next[key]
    next[slotId] = token
    onChange(next)
    setSelectedToken(null)
  }

  const clearSlot = (slotId) => {
    if (reviewing) return
    const next = { ...response }
    delete next[slotId]
    onChange(next)
  }

  const onSlotClick = (slotId) => {
    if (reviewing) return
    if (selectedToken) place(slotId, selectedToken)
    else if (response[slotId]) clearSlot(slotId)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[15px] leading-[2.6] text-slate-800">
        {segments.map((seg, i) => {
          if (seg.type === 'text') return <span key={i}>{seg.value}</span>
          const value = response[seg.id]
          let style = value ? 'border-brand-500 bg-white text-brand-800' : 'border-dashed border-slate-400 bg-white/60 text-slate-400'
          if (!reviewing && (hoverSlot === seg.id || (selectedToken && !value))) style += ' ring-2 ring-brand-300'
          if (reviewing) {
            style = slotResults?.[seg.id] ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-rose-400 bg-rose-50 text-rose-700'
          }
          return (
            <span key={i} className="inline-flex flex-col align-middle">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => onSlotClick(seg.id)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setHoverSlot(seg.id)
                }}
                onDragLeave={() => setHoverSlot(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  setHoverSlot(null)
                  place(seg.id, e.dataTransfer.getData('text/plain'))
                }}
                className={`mx-1 inline-flex min-w-[6.5rem] items-center justify-center rounded-md border-2 px-2 py-0.5 text-sm font-semibold leading-6 transition ${style}`}
                aria-label={value ? `Blank filled with ${value}. Click to clear.` : 'Empty blank. Select a token, then click here.'}
              >
                {value || '______'}
              </button>
              {reviewing && !slotResults?.[seg.id] && (
                <span className="mx-1 text-center text-xs font-medium leading-4 text-emerald-700">✓ {answers[seg.id]}</span>
              )}
            </span>
          )
        })}
      </div>

      {!reviewing && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dose tokens: drag onto a blank, or click a token then a blank</p>
            {Object.keys(response).length > 0 && (
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onChange({})}>
                <Undo2 className="h-3.5 w-3.5" /> Clear all
              </button>
            )}
          </div>
          <div className="flex min-h-[3rem] flex-wrap gap-2 rounded-lg border border-slate-200 p-3">
            {available.length === 0 && <span className="text-sm text-slate-400">All tokens placed.</span>}
            {available.map((token) => (
              <button
                key={token}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', token)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onClick={() => setSelectedToken((cur) => (cur === token ? null : token))}
                aria-pressed={selectedToken === token}
                className={`inline-flex cursor-grab items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm transition active:cursor-grabbing ${
                  selectedToken === token
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                {token}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
