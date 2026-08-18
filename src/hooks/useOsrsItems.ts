import { useCallback, useEffect, useState } from 'react'
import { fetchItemMapping, fetchLatestPrices, type ItemMapping } from '../api/osrsPrices'
import type { OsrsItem } from '../types'

const MAPPING_CACHE_KEY = 'osrs-item-mapping-cache-v1'
const MAPPING_CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface MappingCache {
  fetchedAt: number
  items: ItemMapping[]
}

async function getMapping(): Promise<ItemMapping[]> {
  const cached = localStorage.getItem(MAPPING_CACHE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as MappingCache
      if (Date.now() - parsed.fetchedAt < MAPPING_CACHE_TTL_MS) {
        return parsed.items
      }
    } catch {
      // ignore corrupt cache
    }
  }

  const items = await fetchItemMapping()
  const cache: MappingCache = { fetchedAt: Date.now(), items }
  localStorage.setItem(MAPPING_CACHE_KEY, JSON.stringify(cache))
  return items
}

export function useOsrsItems() {
  const [items, setItems] = useState<OsrsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mapping, prices] = await Promise.all([getMapping(), fetchLatestPrices()])
      const merged: OsrsItem[] = mapping.map((item) => {
        const price = prices[item.id]
        return {
          id: item.id,
          name: item.name,
          icon: item.icon,
          limit: item.limit,
          price: price?.high ?? price?.low ?? null,
        }
      })
      setItems(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { items, loading, error, refresh: load }
}
