import { useMemo } from 'react'
import { usePersistedState } from '../hooks/usePersistedState'

const TILE_LABELS = [
  'TOB Purple', 'X5 Venator Shard', 'x2 Xenyte Shard', 'Vorkath Unique', 'Nightmare Unique',
  'x2 Synapse', '1 Enhanced or 3 Armor', 'Maggot King Unique', 'Full Oathplate', '3x Moons Unique',
  'Any Pet', 'Full Voidwaker', 'Dragon Hunter Wand', 'TOA Purple', 'Doom Unique',
  'x5 Barrows Unique', 'All 4 Dag Rings', 'Any Jar', 'x2 Hallowfell', 'Any Full Wildy Ward',
  'Nex Unique', 'Zulrah Unique', 'Basilisk Jaw', 'X2 Dragon Chainbody', 'Cox Purple',
]

// Divider line positions measured directly from the source artwork's pixels
// (unity-bingo.png is 1254x1254), not an assumed uniform grid — the board's
// rows/columns aren't perfectly even, so each boundary is read from the art.
const IMAGE_SIZE = 1254
const COL_BOUNDS_PX = [43, 206, 367, 525, 683.5, 851.5]
const ROW_BOUNDS_PX = [357, 529, 692, 852, 1013, 1169]

function UnityBingoPage() {
  const [completed, setCompleted] = usePersistedState<number[]>('unity-bingo-progress-v1', [])
  const completedSet = useMemo(() => new Set(completed), [completed])

  const cells = useMemo(() => {
    const toPct = (px: number) => (px / IMAGE_SIZE) * 100
    return TILE_LABELS.map((label, index) => {
      const col = index % 5
      const row = Math.floor(index / 5)
      const left = toPct(COL_BOUNDS_PX[col])
      const top = toPct(ROW_BOUNDS_PX[row])
      return {
        label,
        index,
        left,
        top,
        width: toPct(COL_BOUNDS_PX[col + 1]) - left,
        height: toPct(ROW_BOUNDS_PX[row + 1]) - top,
      }
    })
  }, [])

  function toggleTile(index: number) {
    setCompleted((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  function resetBoard() {
    if (completed.length > 0 && !window.confirm('Clear all progress on this board?')) return
    setCompleted([])
  }

  return (
    <div className="unity-bingo-page">
      <div className="unity-bingo-progress">
        <span>
          {completed.length} / {TILE_LABELS.length} complete
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
            const done = completedSet.has(cell.index)
            return (
              <button
                key={cell.index}
                type="button"
                className={done ? 'bingo-tile completed' : 'bingo-tile'}
                style={{
                  left: `${cell.left}%`,
                  top: `${cell.top}%`,
                  width: `${cell.width}%`,
                  height: `${cell.height}%`,
                }}
                onClick={() => toggleTile(cell.index)}
                aria-pressed={done}
                aria-label={done ? `${cell.label}, completed` : cell.label}
              >
                {done && <span className="bingo-check">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UnityBingoPage
