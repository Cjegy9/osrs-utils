import { Fragment, useEffect, useMemo, useState } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'
import type { Boss, BossData } from '../types'
import { bestOwnedIndex, formatPercent, scoreBoss, scoreSetup } from '../utils/gearScore'
import { parseGearImport, serializeGear } from '../utils/gearTransfer'

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

const MAX_GEAR_RESULTS = 30
const WIKI_IMAGES = 'https://oldschool.runescape.wiki/images'

type SidebarTab = 'bosses' | 'gear'

function iconUrl(file: string) {
  return `${WIKI_IMAGES}/${encodeURIComponent(file.replace(/ /g, '_'))}`
}

function BossingSelectorPage() {
  const [data, setData] = useState<BossData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [gearQuery, setGearQuery] = useState('')
  const [transferMessage, setTransferMessage] = useState<{ text: string; error: boolean } | null>(null)
  // Fallback for browsers that won't let a page read the clipboard: paste into a box instead.
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [tab, setTab] = useState<SidebarTab>('bosses')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [styleIndex, setStyleIndex] = useState(0)
  // Personal to this browser: other people's boards don't share it.
  const [ownedList, setOwnedList] = usePersistedState<string[]>('osrs-owned-gear-v1', [])

  useEffect(() => {
    // Loaded on demand so the boss data is its own chunk, not part of the main bundle.
    import('../data/bosses.json')
      .then((mod) => setData(mod.default as BossData))
      .catch(() => setLoadError(true))
  }, [])

  const owned = useMemo(() => new Set(ownedList), [ownedList])
  const hasGear = owned.size > 0
  const noIcon = useMemo(() => new Set(data?.noIcon ?? []), [data])

  // Items without a wiki icon (generic labels) just render as text.
  function itemIcon(name: string) {
    if (noIcon.has(name)) return null
    const file = data?.iconFiles[name] ?? `${name}.png`
    return <img className="gear-icon" src={iconUrl(file)} alt="" width={26} height={26} />
  }

  // Every item the boss data mentions: the only things worth marking as owned.
  const allItems = useMemo(() => {
    if (!data) return []
    const names = new Set<string>()
    for (const boss of data.bosses)
      for (const setup of boss.setups)
        for (const slot of setup.slots) for (const option of slot.options) option.items.forEach((i) => names.add(i))
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [data])

  const scores = useMemo(() => {
    const map = new Map<string, ReturnType<typeof scoreBoss>>()
    if (data) for (const boss of data.bosses) map.set(boss.name, scoreBoss(boss, owned))
    return map
  }, [data, owned])

  const filteredBosses = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    const list = q ? data.bosses.filter((b) => b.name.toLowerCase().includes(q)) : [...data.bosses]
    if (hasGear) {
      list.sort((a, b) => scores.get(b.name)!.score - scores.get(a.name)!.score || a.name.localeCompare(b.name))
    }
    return list
  }, [data, query, hasGear, scores])

  const gearMatches = useMemo(() => {
    const q = gearQuery.trim().toLowerCase()
    if (!q) return []
    return allItems.filter((name) => name.toLowerCase().includes(q)).slice(0, MAX_GEAR_RESULTS)
  }, [allItems, gearQuery])

  const selected: Boss | undefined = data?.bosses.find((b) => b.name === selectedName)
  const setup = selected?.setups[styleIndex] ?? selected?.setups[0]
  const setupScore = selected && setup ? scoreSetup(setup, owned) : null

  function selectBoss(name: string) {
    setSelectedName(name)
    // Open on the combat style the player is closest to, or the first one with no gear yet.
    setStyleIndex(hasGear ? (scores.get(name)?.bestSetupIndex ?? 0) : 0)
  }

  function toggleOwned(item: string) {
    setOwnedList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))
  }

  function clearGear() {
    if (!window.confirm('Remove all items from My gear?')) return
    setOwnedList([])
  }

  async function exportGear() {
    try {
      await navigator.clipboard.writeText(serializeGear(ownedList))
      setTransferMessage({
        text: `Copied ${ownedList.length} item${ownedList.length === 1 ? '' : 's'} to the clipboard.`,
        error: false,
      })
    } catch {
      setTransferMessage({ text: "Couldn't copy to the clipboard. Check the browser's clipboard permission.", error: true })
    }
  }

  // Merges rather than replaces, so importing never throws away gear you already marked.
  function applyImport(text: string) {
    try {
      const { items, skipped } = parseGearImport(text, new Set(allItems))
      const added = items.filter((name) => !owned.has(name)).length
      setOwnedList((prev) => [...new Set([...prev, ...items])])
      const parts = [`Imported ${items.length} item${items.length === 1 ? '' : 's'} (${added} new).`]
      if (skipped.length) parts.push(`${skipped.length} skipped: not in the boss data.`)
      setTransferMessage({ text: parts.join(' '), error: false })
      setPasteOpen(false)
      setPasteText('')
    } catch (err) {
      setTransferMessage({ text: err instanceof Error ? err.message : 'Import failed.', error: true })
    }
  }

  async function importFromClipboard() {
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      // Denied, or this browser doesn't let pages read the clipboard.
      setPasteOpen(true)
      setTransferMessage({ text: "Couldn't read the clipboard. Paste your list into the box instead.", error: true })
      return
    }
    if (!text.trim()) {
      setTransferMessage({ text: 'The clipboard is empty. Copy a gear list with Export first.', error: true })
      return
    }
    applyImport(text)
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
        <div className="sidebar-tabs" role="group" aria-label="Sidebar view">
          <button
            type="button"
            className={tab === 'bosses' ? 'sidebar-tab active' : 'sidebar-tab'}
            aria-pressed={tab === 'bosses'}
            onClick={() => {
              setTab('bosses')
              setTransferMessage(null)
              setPasteOpen(false)
            }}
          >
            Bosses
          </button>
          <button
            type="button"
            className={tab === 'gear' ? 'sidebar-tab active' : 'sidebar-tab'}
            aria-pressed={tab === 'gear'}
            onClick={() => setTab('gear')}
          >
            My gear ({owned.size})
          </button>
        </div>

        {tab === 'bosses' ? (
          <>
            <input
              type="text"
              className="boss-search"
              placeholder={`Search ${data.bosses.length} bosses`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search bosses"
            />
            {!hasGear && (
              <p className="sidebar-hint">
                Add the gear you own in <strong>My gear</strong> (or click items in a boss's setup) to rank bosses by how
                ready you are.
              </p>
            )}
            <ul className="boss-list">
              {filteredBosses.map((boss) => (
                <li key={boss.name}>
                  <button
                    type="button"
                    className={boss.name === selectedName ? 'boss-chip active' : 'boss-chip'}
                    aria-pressed={boss.name === selectedName}
                    onClick={() => selectBoss(boss.name)}
                  >
                    <span className="boss-chip-name">{boss.name}</span>
                    {hasGear && <span className="boss-chip-score">{formatPercent(scores.get(boss.name)!.score)}</span>}
                  </button>
                </li>
              ))}
              {filteredBosses.length === 0 && <li className="boss-empty">No bosses match "{query}".</li>}
            </ul>
          </>
        ) : (
          <>
            <input
              type="text"
              className="boss-search"
              placeholder="Search gear to add"
              value={gearQuery}
              onChange={(e) => setGearQuery(e.target.value)}
              aria-label="Search gear to add"
            />
            <div className="gear-transfer">
              <button type="button" className="gear-transfer-button" onClick={exportGear} disabled={owned.size === 0}>
                Export
              </button>
              <button type="button" className="gear-transfer-button" onClick={importFromClipboard}>
                Import
              </button>
            </div>
            {transferMessage && (
              <p className={transferMessage.error ? 'gear-transfer-message error' : 'gear-transfer-message'} role="status">
                {transferMessage.text}
              </p>
            )}
            {pasteOpen && (
              <div className="gear-paste">
                <textarea
                  className="gear-paste-box"
                  placeholder="Paste a gear list here"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  aria-label="Paste a gear list to import"
                  rows={4}
                />
                <div className="gear-transfer">
                  <button
                    type="button"
                    className="gear-transfer-button"
                    onClick={() => applyImport(pasteText)}
                    disabled={!pasteText.trim()}
                  >
                    Import pasted list
                  </button>
                  <button
                    type="button"
                    className="gear-transfer-button"
                    onClick={() => {
                      setPasteOpen(false)
                      setPasteText('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <ul className="boss-list">
              {gearQuery.trim() ? (
                <>
                  {gearMatches.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        className={owned.has(name) ? 'boss-chip owned' : 'boss-chip'}
                        aria-pressed={owned.has(name)}
                        onClick={() => toggleOwned(name)}
                      >
                        <span className="boss-chip-name">
                          {itemIcon(name)}
                          {name}
                        </span>
                        <span className="boss-chip-score">{owned.has(name) ? '✓' : '+'}</span>
                      </button>
                    </li>
                  ))}
                  {gearMatches.length === 0 && <li className="boss-empty">No gear matches "{gearQuery}".</li>}
                </>
              ) : owned.size > 0 ? (
                <>
                  {[...ownedList]
                    .sort((a, b) => a.localeCompare(b))
                    .map((name) => (
                      <li key={name}>
                        <button type="button" className="boss-chip owned" onClick={() => toggleOwned(name)}>
                          <span className="boss-chip-name">
                            {itemIcon(name)}
                            {name}
                          </span>
                          <span className="boss-chip-score" aria-label={`Remove ${name}`}>
                            ✕
                          </span>
                        </button>
                      </li>
                    ))}
                  <li>
                    <button type="button" className="gear-clear" onClick={clearGear}>
                      Clear all
                    </button>
                  </li>
                </>
              ) : (
                <li className="boss-empty">
                  Nothing added yet. Search for an item above, or click items in a boss's setup.
                </li>
              )}
            </ul>
          </>
        )}
      </aside>

      {selected && setup && setupScore ? (
        <section className="boss-detail">
          <div className="boss-detail-header">
            <h2>{selected.name}</h2>
            <a href={selected.wikiUrl} target="_blank" rel="noreferrer">
              Full strategy on the OSRS Wiki ↗
            </a>
          </div>

          {hasGear && (
            <p className="boss-readiness">
              You have <strong>{formatPercent(setupScore.score)}</strong> of this setup —{' '}
              {setupScore.coveredSlots} of {setupScore.totalSlots} slots covered.
            </p>
          )}

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
                  {hasGear && <span className="boss-style-score">{formatPercent(scoreSetup(s, owned).score)}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="gear-grid">
            {setup.slots.map((slot) => {
              const bestIndex = bestOwnedIndex(slot, owned)
              return (
                <div key={slot.slot} className={`gear-slot slot-${slot.slot}`}>
                  <h3>{SLOT_LABELS[slot.slot] ?? slot.slot}</h3>
                  <ol className="gear-options">
                    {slot.options.map((option, i) => (
                      <li key={i} className={i === bestIndex ? 'gear-option best' : 'gear-option'}>
                        {option.items.map((item, j) => (
                          <Fragment key={item}>
                            {j > 0 && <span className="gear-joiner">{option.joiner === '+' ? ' + ' : ' / '}</span>}
                            <button
                              type="button"
                              className={owned.has(item) ? 'gear-item owned' : 'gear-item'}
                              aria-pressed={owned.has(item)}
                              title={owned.has(item) ? 'You own this — click to remove' : 'Click if you own this'}
                              onClick={() => toggleOwned(item)}
                            >
                              {itemIcon(item)}
                              {item}
                            </button>
                          </Fragment>
                        ))}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </div>
          <p className="boss-source">
            Best option first, cheaper fallbacks below. Click an item to mark it as owned. The highlighted row is the best
            you have for that slot. Gear data from the OSRS Wiki, snapshot of{' '}
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
