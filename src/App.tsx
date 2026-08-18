import './App.css'
import ItemSearch from './components/ItemSearch'
import ShoppingList from './components/ShoppingList'
import { useOsrsItems } from './hooks/useOsrsItems'
import { usePersistedState } from './hooks/usePersistedState'
import type { OsrsItem, ShoppingListEntry } from './types'

function App() {
  const { items, loading, error, refresh } = useOsrsItems()
  const [entries, setEntries] = usePersistedState<ShoppingListEntry[]>('osrs-shopping-list-v1', [])

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
      <header className="app-header">
        <h1>OSRS Shopping List</h1>
        <p>Track what you need to buy for your next grind</p>
      </header>
      <main className="app-main">
        <ItemSearch items={items} loading={loading} error={error} onAdd={handleAdd} />
        {error && (
          <button type="button" className="retry-button" onClick={refresh}>
            Retry loading item data
          </button>
        )}
        <ShoppingList entries={entries} onRemove={handleRemove} />
      </main>
    </>
  )
}

export default App
