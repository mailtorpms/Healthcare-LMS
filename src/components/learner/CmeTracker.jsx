import { Award } from 'lucide-react'
import Card from '../ui/Card.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'
import { CME_ANNUAL_GOAL } from '../../data/seed.js'

export default function CmeTracker({ earnedHere, external, pending }) {
  const total = earnedHere + external
  const pct = (total / CME_ANNUAL_GOAL) * 100
  return (
    <Card title="CME credit tracker" subtitle="Current licensure cycle" icon={Award}>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-4xl font-bold text-slate-900">{total.toFixed(1)}</span>
        <span className="pb-1 text-sm text-slate-500">/ {CME_ANNUAL_GOAL} credits</span>
      </div>
      <ProgressBar value={pct} label="Annual goal" tone={pct >= 100 ? 'green' : 'brand'} />
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Earned in ClinicalEd</dt>
          <dd className="font-medium">{earnedHere.toFixed(1)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">External / transferred</dt>
          <dd className="font-medium">{external.toFixed(1)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">Pending (in progress)</dt>
          <dd className="font-medium text-amber-700">{pending.toFixed(1)}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-2">
          <dt className="text-slate-600">Remaining to goal</dt>
          <dd className="font-semibold">{Math.max(0, CME_ANNUAL_GOAL - total).toFixed(1)}</dd>
        </div>
      </dl>
    </Card>
  )
}
