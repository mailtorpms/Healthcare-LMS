import { initials } from '../../lib/format.js'

export default function Avatar({ name, size = 'md' }) {
  const dims = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' }[size]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-sky-500 font-semibold text-white ${dims}`}>
      {initials(name)}
    </span>
  )
}
