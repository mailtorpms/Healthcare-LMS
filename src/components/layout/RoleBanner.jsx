import { GraduationCap, RotateCcw, ShieldCheck, Stethoscope, UserCog } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'

const ROLES = [
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'course_admin', label: 'Course Admin', icon: UserCog },
  { id: 'learner', label: 'Learner', icon: GraduationCap },
]

export default function RoleBanner({ role, onRoleChange, currentUser, onReset }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="bg-slate-900 px-4 py-1.5 text-center text-xs text-slate-300">
        Demo environment: switch roles below to explore each persona. Data is stored locally in your browser.
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-900">ClinicalEd LMS</p>
            <p className="text-xs text-slate-500">Continuing education for clinicians</p>
          </div>
        </div>

        <div role="tablist" aria-label="Demo role" className="flex rounded-xl bg-slate-100 p-1">
          {ROLES.map(({ id, label, icon: Icon }) => {
            const active = role === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onRoleChange(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="btn-ghost px-2 py-1.5 text-xs" onClick={onReset} title="Reset demo data">
            <RotateCcw className="h-4 w-4" /> <span className="hidden md:inline">Reset demo</span>
          </button>
          {currentUser && (
            <div className="flex items-center gap-2">
              <Avatar name={currentUser.name} size="sm" />
              <div className="hidden leading-tight lg:block">
                <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.specialty}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
