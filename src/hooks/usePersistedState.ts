import { useEffect, useState } from 'react'

export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    if (!stored) return initialValue
    try {
      return JSON.parse(stored) as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState] as const
}
