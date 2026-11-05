import { useEffect, useState } from 'react'

/** useState that mirrors its value into localStorage. */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored != null) return JSON.parse(stored)
    } catch {
      /* ignore corrupt storage */
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [key, value])

  return [value, setValue]
}
