import { useEffect, useState } from 'react'
import { fetchTimeseries, type Lookback, type TimeseriesPoint } from '../api/osrsPrices'

export function usePriceHistory(itemId: number | null, lookback: Lookback) {
  const [data, setData] = useState<TimeseriesPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (itemId === null) {
      setData([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchTimeseries(itemId, lookback)
      .then((points) => {
        if (!cancelled) setData(points)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load price history')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [itemId, lookback])

  return { data, loading, error }
}
