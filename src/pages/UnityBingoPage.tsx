import { useMemo } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'

interface Tracker {
  key: string
  target: number
  label?: string
}

interface TileDef {
  label: string
  trackers: Tracker[]
}

function toggle(target = 1): Tracker[] {
  return [{ key: 'default', target }]
}

const TILE_DEFS: TileDef[] = [
  { label: 'TOB Purple', trackers: toggle() },
  { label: 'X5 Venator Shard', trackers: toggle(5) },
  { label: 'x2 Xenyte Shard', trackers: toggle(2) },
  { label: 'Vorkath Unique', trackers: toggle() },
  { label: 'Nightmare Unique', trackers: toggle() },
  { label: 'x2 Synapse', trackers: toggle(2) },
  {
    label: '1 Enhanced or 3 Armor',
    trackers: [
      { key: 'enhanced', target: 1, label: 'Enhanced' },
      { key: 'armor', target: 3, label: 'Armor' },
    ],
  },
  { label: 'Maggot King Unique', trackers: toggle() },
  { label: 'Full Oathplate', trackers: toggle() },
  { label: '3x Moons Unique', trackers: toggle(3) },
  { label: 'Any Pet', trackers: toggle() },
  { label: 'Full Voidwaker', trackers: toggle(3) },
  { label: 'Dragon Hunter Wand', trackers: toggle() },
  { label: 'TOA Purple', trackers: toggle() },
  { label: 'Doom Unique', trackers: toggle() },
  { label: 'x5 Barrows Unique', trackers: toggle(5) },
  { label: 'All 4 Dag Rings', trackers: toggle(4) },
  { label: 'Any Jar', trackers: toggle() },
  { label: 'x2 Hallowfell', trackers: toggle(2) },
  { label: 'Any Full Wildy Ward', trackers: toggle(3) },
  { label: 'Nex Unique', trackers: toggle() },
  { label: 'Zulrah Unique', trackers: toggle() },
  { label: 'Basilisk Jaw', trackers: toggle() },
  { label: 'X2 Dragon Chainbody', trackers: toggle(2) },
  { label: 'Cox Purple', trackers: toggle() },
]

// Divider line positions measured directly from the source artwork's pixels
// (unity-bingo.png is 1254x1254), not an assumed uniform grid — the board's
// rows/columns aren't perfectly even, so each boundary is read from the art.
const IMAGE_SIZE = 1254
const COL_BOUNDS_PX = [43, 206, 367, 525, 683.5, 851.5]
const ROW_BOUNDS_PX = [357, 529, 692, 852, 1013, 1169]

function progressKey(tileIndex: number, trackerKey: string) {
  return `${tileIndex}:${trackerKey}`
}

function UnityBingoPage() {
  const [progress, setProgress] = usePersistedState<Record<string, number>>('unity-bingo-progress-v2', {})

  const cells = useMemo(() => {
    const toPct = (px: number) => (px / IMAGE_SIZE) * 100
    return TILE_DEFS.map((tile, index) => {
      const col = index % 5
      const row = Math.floor(index / 5)
      const left = toPct(COL_BOUNDS_PX[col])
      const top = toPct(ROW_BOUNDS_PX[row])
      return {
        ...tile,
        index,
        left,
        top,
        width: toPct(COL_BOUNDS_PX[col + 1]) - left,
        height: toPct(ROW_BOUNDS_PX[row + 1]) - top,
      }
    })
  }, [])

  const completedCount = cells.filter((cell) =>
    cell.trackers.some((t) => (progress[progressKey(cell.index, t.key)] ?? 0) === t.target),
  ).length

  function bumpTracker(tileIndex: number, tracker: Tracker) {
    const key = progressKey(tileIndex, tracker.key)
    setProgress((prev) => {
      const current = prev[key] ?? 0
      const next = current >= tracker.target ? 0 : current + 1
      return { ...prev, [key]: next }
    })
  }

  function resetBoard() {
    if (completedCount > 0 && !window.confirm('Clear all progress on this board?')) return
    setProgress({})
  }

  return (
    <div className="unity-bingo-page">
      <div className="unity-bingo-progress">
        <span>
          {completedCount} / {TILE_DEFS.length} complete
        </span>
        <button type="button" className="history-button" onClick={resetBoard}>
          Reset board
        </button>
      </div>
      <div className="unity-bingo-board">
        <img
          src={`${import.meta.env.BASE_URL}unity-bingo.png`}
          alt="Unity Bingo board: a 5x5 grid of OSRS drop/achievement tiles with rules listed to the side"
          className="unity-bingo-image"
        />
        <div className="unity-bingo-overlay">
          {cells.map((cell) => {
            const cellStyle = {
              left: `${cell.left}%`,
              top: `${cell.top}%`,
              width: `${cell.width}%`,
              height: `${cell.height}%`,
            }

            if (cell.trackers.length > 1) {
              const done = cell.trackers.some((t) => (progress[progressKey(cell.index, t.key)] ?? 0) === t.target)
              return (
                <div
                  key={cell.index}
                  className={done ? 'bingo-tile bingo-tile-dual completed' : 'bingo-tile bingo-tile-dual'}
                  style={cellStyle}
                >
                  {cell.trackers.map((t) => {
                    const count = progress[progressKey(cell.index, t.key)] ?? 0
                    const trackerDone = count === t.target
                    return (
                      <button
                        key={t.key}
                        type="button"
                        className={trackerDone ? 'bingo-subtracker done' : 'bingo-subtracker'}
                        onClick={() => bumpTracker(cell.index, t)}
                        aria-pressed={trackerDone}
                        aria-label={`${cell.label}: ${t.label} ${count}/${t.target}${trackerDone ? ', complete' : ''}`}
                      >
                        {trackerDone ? (
                          <span className="bingo-check">✓</span>
                        ) : (
                          <span className="bingo-badge">
                            {t.label} {count}/{t.target}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            }

            const tracker = cell.trackers[0]
            const count = progress[progressKey(cell.index, tracker.key)] ?? 0
            const done = count === tracker.target
            return (
              <button
                key={cell.index}
                type="button"
                className={done ? 'bingo-tile completed' : 'bingo-tile'}
                style={cellStyle}
                onClick={() => bumpTracker(cell.index, tracker)}
                aria-pressed={done}
                aria-label={
                  tracker.target > 1
                    ? `${cell.label}, ${count}/${tracker.target}${done ? ', complete' : ''}`
                    : `${cell.label}${done ? ', completed' : ''}`
                }
              >
                {done && <span className="bingo-check">✓</span>}
                {!done && tracker.target > 1 && (
                  <span className="bingo-badge bingo-badge-corner">
                    {count}/{tracker.target}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UnityBingoPage
