import { useState } from 'react'
import Modal from '../ui/Modal.jsx'

const EMPTY = { name: '', description: '', specialty: '', memberIds: [] }

export default function CohortModal({ open, onClose, learners, onCreate }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const close = () => {
    setForm(EMPTY)
    setError('')
    onClose()
  }

  const toggle = (id) =>
    setForm((f) => ({ ...f, memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id] }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Cohort name is required.')
    onCreate({ ...form, name: form.name.trim() })
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create cohort"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="submit" form="cohort-form" className="btn-primary">
            Create cohort
          </button>
        </>
      }
    >
      <form id="cohort-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="cohort-name">
            Name *
          </label>
          <input id="cohort-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Night-shift ED Nurses" autoFocus />
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cohort-specialty">
              Specialty
            </label>
            <input id="cohort-specialty" className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Emergency Medicine" />
          </div>
          <div>
            <label className="label" htmlFor="cohort-desc">
              Description
            </label>
            <input id="cohort-desc" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
          </div>
        </div>
        <div>
          <p className="label">Initial members ({form.memberIds.length} selected)</p>
          <div className="grid max-h-60 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
            {learners.map((l) => (
              <label key={l.id} className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm hover:bg-slate-50">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.memberIds.includes(l.id)} onChange={() => toggle(l.id)} />
                <span>
                  {l.name}
                  <span className="block text-xs text-slate-500">{l.specialty}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
