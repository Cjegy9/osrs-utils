import { useMemo } from 'react'
import ItemSearch from '../components/ItemSearch'
import ShoppingList from '../components/ShoppingList'
import { useOsrsItems } from '../hooks/useOsrsItems'
import { usePersistedState } from '../hooks/usePersistedState'
import type { OsrsItem, ShoppingListEntry } from '../types'

function PriceTrackerPage() {
  const { items, loading, error, refresh } = useOsrsItems()
  const [entries, setEntries] = usePersistedState<ShoppingListEntry[]>('osrs-shopping-list-v1', [])

  // The price saved in localStorage is only a snapshot from when the item was added, so show
  // the live price instead. The snapshot is used only until live prices have loaded (or if
  // they can't be loaded at all).
  const livePrices = useMemo(() => new Map(items.map((item) => [item.id, item.price])), [items])
  const liveEntries = useMemo(
    () =>
      entries.map((entry) =>
        livePrices.has(entry.id) ? { ...entry, unitPrice: livePrices.get(entry.id) ?? null } : entry,
      ),
    [entries, livePrices],
  )

  function handleAdd(item: OsrsItem) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.id === item.id)) return prev
      return [...prev, { id: item.id, name: item.name, icon: item.icon, unitPrice: item.price }]
    })
  }

  function handleRemove(id: number) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  return (
    <>
      <ItemSearch items={items} loading={loading} error={error} onAdd={handleAdd} />
      {error && (
        <button type="button" className="retry-button" onClick={refresh}>
          Retry loading item data
        </button>
      )}
      <ShoppingList entries={liveEntries} onRemove={handleRemove} />
    </>
  )
}

export default PriceTrackerPage
