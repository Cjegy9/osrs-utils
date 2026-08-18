import { useState } from 'react'
import type { ShoppingListEntry } from '../types'
import { getItemIconUrl } from '../api/osrsPrices'
import { formatGp } from '../utils/format'
import PriceHistoryPanel from './PriceHistoryPanel'

interface ShoppingListProps {
  entries: ShoppingListEntry[]
  onRemove: (id: number) => void
}

function ShoppingList({ entries, onRemove }: ShoppingListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const total = entries.reduce((sum, entry) => sum + (entry.unitPrice ?? 0), 0)

  function toggleHistory(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (entries.length === 0) {
    return (
      <section className="shopping-list">
        <p className="shopping-list-empty">Your shopping list is empty. Search for an item above to add it.</p>
      </section>
    )
  }

  return (
    <section className="shopping-list">
      <ul className="shopping-list-items">
        {entries.map((entry) => {
          const expanded = expandedIds.has(entry.id)
          return (
            <li key={entry.id} className="shopping-list-item">
              <div className="shopping-list-item-row">
                <img src={getItemIconUrl(entry.icon)} alt="" width={28} height={28} />
                <span className="item-name">{entry.name}</span>
                <span className="item-price">
                  {entry.unitPrice !== null ? formatGp(entry.unitPrice) : 'N/A'}
                </span>
                <button
                  type="button"
                  className={expanded ? 'history-button active' : 'history-button'}
                  onClick={() => toggleHistory(entry.id)}
                >
                  {expanded ? 'Hide' : 'History'}
                </button>
                <button type="button" className="item-remove" onClick={() => onRemove(entry.id)} aria-label={`Remove ${entry.name}`}>
                  ✕
                </button>
              </div>
              {expanded && <PriceHistoryPanel itemId={entry.id} />}
            </li>
          )
        })}
      </ul>
      <div className="shopping-list-total">
        <span>Total</span>
        <span>{formatGp(total)}</span>
      </div>
    </section>
  )
}

export default ShoppingList
