import { useEffect, useState } from 'react'
import { onValue, ref, remove, update } from 'firebase/database'
import { db } from '../firebase'

export function useFirebaseProgress(path: string) {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const progressRef = ref(db, path)
    const unsubscribe = onValue(
      progressRef,
      (snapshot) => {
        setProgress((snapshot.val() as Record<string, number> | null) ?? {})
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [path])

  function setEntry(key: string, value: number) {
    update(ref(db, path), { [key]: value }).catch((err: Error) => setError(err.message))
  }

  function clearAll() {
    remove(ref(db, path)).catch((err: Error) => setError(err.message))
  }

  return { progress, loading, error, setEntry, clearAll }
}
