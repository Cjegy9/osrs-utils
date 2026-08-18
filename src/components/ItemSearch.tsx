import { useMemo, useState } from 'react'
import type { OsrsItem } from '../types'
import { getItemIconUrl } from '../api/osrsPrices'
import { formatGp } from '../utils/format'
import PriceHistoryPanel from './PriceHistoryPanel'

interface ItemSearchProps {
  items: OsrsItem[]
  loading: boolean
  error: string | null
  onAdd: (item: OsrsItem) => void
}

const MAX_RESULTS = 15

function ItemSearch({ items, loading, error, onAdd }: ItemSearchProps) {
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return items
      .filter((item) => item.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts
        return a.name.length - b.name.length
      })
      .slice(0, MAX_RESULTS)
  }, [items, query])

  function toggleHistory(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="item-search">
      <input
        type="text"
        placeholder={loading ? 'Loading items…' : 'Search for an item, e.g. Cannonball'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={loading || !!error}
        aria-label="Search for an OSRS item"
      />
      {error && <p className="search-error">Couldn't load item data: {error}</p>}
      {matches.length > 0 && (
        <ul className="search-results">
          {matches.map((item) => {
            const expanded = expandedIds.has(item.id)
            return (
              <li key={item.id} className="search-result">
                <div className="search-result-row">
                  <img src={getItemIconUrl(item.icon)} alt="" width={24} height={24} />
                  <span className="search-result-name">{item.name}</span>
                  <span className="search-result-price">
                    {item.price !== null ? formatGp(item.price) : 'No price data'}
                  </span>
                  <button
                    type="button"
                    className={expanded ? 'history-button active' : 'history-button'}
                    onClick={() => toggleHistory(item.id)}
                  >
                    {expanded ? 'Hide' : 'History'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onAdd(item)
                      setQuery('')
                    }}
                  >
                    Add
                  </button>
                </div>
                {expanded && <PriceHistoryPanel itemId={item.id} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ItemSearch
