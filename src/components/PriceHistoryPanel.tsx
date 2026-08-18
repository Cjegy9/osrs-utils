import { useState } from 'react'
import type { Lookback } from '../api/osrsPrices'
import { usePriceHistory } from '../hooks/usePriceHistory'
import PriceHistoryChart from './PriceHistoryChart'

interface PriceHistoryPanelProps {
  itemId: number
}

const LOOKBACK_OPTIONS: { value: Lookback; label: string }[] = [
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '6m', label: '6m' },
  { value: '1y', label: '1y' },
]

function PriceHistoryPanel({ itemId }: PriceHistoryPanelProps) {
  const [lookback, setLookback] = useState<Lookback>('7d')
  const { data, loading, error } = usePriceHistory(itemId, lookback)

  return (
    <div className="history-panel">
      <div className="lookback-select" role="group" aria-label="Price history range">
        {LOOKBACK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={opt.value === lookback ? 'lookback-option active' : 'lookback-option'}
            onClick={() => setLookback(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="chart-status">Loading price history…</p>}
      {error && <p className="chart-status chart-status-error">Couldn't load price history: {error}</p>}
      {!loading && !error && <PriceHistoryChart data={data} lookback={lookback} />}
    </div>
  )
}

export default PriceHistoryPanel
