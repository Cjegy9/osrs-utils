import { useEffect, useMemo, useState } from 'react'
import type { Boss, BossData, GearOption } from '../types'

const SLOT_LABELS: Record<string, string> = {
  head: 'Head',
  neck: 'Neck',
  cape: 'Cape',
  ammo: 'Ammo',
  weapon: 'Weapon',
  body: 'Body',
  shield: 'Shield',
  legs: 'Legs',
  hands: 'Hands',
  feet: 'Feet',
  ring: 'Ring',
  special: 'Special attack',
}

function formatOption(option: GearOption) {
  return option.items.join(option.joiner === '+' ? ' + ' : ' / ')
}

function BossingSelectorPage() {
  const [data, setData] = useState<BossData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [styleIndex, setStyleIndex] = useState(0)

  useEffect(() => {
    // Loaded on demand so the boss data is its own chunk, not part of the main bundle.
    import('../data/bosses.json')
      .then((mod) => setData(mod.default as BossData))
      .catch(() => setLoadError(true))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return q ? data.bosses.filter((b) => b.name.toLowerCase().includes(q)) : data.bosses
  }, [data, query])

  const selected: Boss | undefined = data?.bosses.find((b) => b.name === selectedName)
  const setup = selected?.setups[styleIndex] ?? selected?.setups[0]

  function selectBoss(name: string) {
    setSelectedName(name)
    setStyleIndex(0)
  }

  if (loadError) {
    return <p className="chart-status chart-status-error">Couldn't load the boss list.</p>
  }
  if (!data) {
    return <p className="chart-status">Loading bosses…</p>
  }

  return (
    <div className="boss-selector">
      <aside className="boss-sidebar">
        <input
          type="text"
          className="boss-search"
          placeholder={`Search ${data.bosses.length} bosses`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search bosses"
        />
        <ul className="boss-list">
          {filtered.map((boss) => (
            <li key={boss.name}>
              <button
                type="button"
                className={boss.name === selectedName ? 'boss-chip active' : 'boss-chip'}
                aria-pressed={boss.name === selectedName}
                onClick={() => selectBoss(boss.name)}
              >
                {boss.name}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="boss-empty">No bosses match "{query}".</li>}
        </ul>
      </aside>

      {selected && setup ? (
        <section className="boss-detail">
          <div className="boss-detail-header">
            <h2>{selected.name}</h2>
            <a href={selected.wikiUrl} target="_blank" rel="noreferrer">
              Full strategy on the OSRS Wiki ↗
            </a>
          </div>

          {selected.setups.length > 1 && (
            <div className="boss-style-tabs" role="group" aria-label="Combat style">
              {selected.setups.map((s, i) => (
                <button
                  key={s.style}
                  type="button"
                  className={i === styleIndex ? 'boss-style-tab active' : 'boss-style-tab'}
                  onClick={() => setStyleIndex(i)}
                >
                  {s.style}
                </button>
              ))}
            </div>
          )}

          <div className="gear-grid">
            {setup.slots.map((slot) => (
              <div key={slot.slot} className={`gear-slot slot-${slot.slot}`}>
                <h3>{SLOT_LABELS[slot.slot] ?? slot.slot}</h3>
                <ol className="gear-options">
                  {slot.options.map((option, i) => (
                    <li key={i}>{formatOption(option)}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="boss-source">
            Best option first, cheaper fallbacks below. Gear data from the OSRS Wiki, snapshot of{' '}
            {new Date(data.generatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}.
          </p>
        </section>
      ) : (
        <p className="boss-prompt">Pick a boss to see its recommended gear.</p>
      )}
    </div>
  )
}

export default BossingSelectorPage
