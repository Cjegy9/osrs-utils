import { useMemo, useState } from 'react'
import type { Lookback, TimeseriesPoint } from '../api/osrsPrices'
import { formatGp, formatGpCompact, formatTimestamp } from '../utils/format'

interface PriceHistoryChartProps {
  data: TimeseriesPoint[]
  lookback: Lookback
}

const WIDTH = 700
const HEIGHT = 320
const MARGIN = { top: 20, right: 88, bottom: 32, left: 72 }
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom

const COLOR_BUY = '#3987e5'
const COLOR_SELL = '#d95926'
const COLOR_SURFACE = '#1e1e1e'
const COLOR_GRID = '#2c2c2a'
const COLOR_AXIS = '#383835'
const COLOR_TEXT_SECONDARY = '#9a9a9a'
const COLOR_TEXT_MUTED = '#898781'

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    min -= 1
    max += 1
  }
  const range = max - min
  const rawStep = range / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude
  let step: number
  if (residual > 5) step = 10 * magnitude
  else if (residual > 2) step = 5 * magnitude
  else if (residual > 1) step = 2 * magnitude
  else step = magnitude

  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) ticks.push(v)
  return ticks
}

function findNearestIndex(data: TimeseriesPoint[], targetTimestamp: number): number {
  let nearest = 0
  let bestDiff = Infinity
  for (let i = 0; i < data.length; i++) {
    const diff = Math.abs(data[i].timestamp - targetTimestamp)
    if (diff < bestDiff) {
      bestDiff = diff
      nearest = i
    }
  }
  return nearest
}

function PriceHistoryChart({ data, lookback }: PriceHistoryChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const chart = useMemo(() => {
    const xs = data.map((d) => d.timestamp)
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)

    const values: number[] = []
    for (const d of data) {
      if (d.avgHighPrice !== null) values.push(d.avgHighPrice)
      if (d.avgLowPrice !== null) values.push(d.avgLowPrice)
    }
    if (values.length === 0) return null

    const ticks = niceTicks(Math.min(...values), Math.max(...values))
    const yMin = ticks[0]
    const yMax = ticks[ticks.length - 1]

    const xScale = (t: number) =>
      MARGIN.left + ((t - xMin) / (xMax - xMin || 1)) * INNER_WIDTH
    const yScale = (v: number) =>
      MARGIN.top + INNER_HEIGHT - ((v - yMin) / (yMax - yMin || 1)) * INNER_HEIGHT

    const buyPoints = data.filter((d) => d.avgHighPrice !== null)
    const sellPoints = data.filter((d) => d.avgLowPrice !== null)

    const buyPath = buyPoints
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.timestamp)} ${yScale(d.avgHighPrice as number)}`)
      .join(' ')
    const sellPath = sellPoints
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.timestamp)} ${yScale(d.avgLowPrice as number)}`)
      .join(' ')

    const lastBuy = buyPoints[buyPoints.length - 1]
    const lastSell = sellPoints[sellPoints.length - 1]

    return { xMin, xMax, ticks, xScale, yScale, buyPath, sellPath, lastBuy, lastSell }
  }, [data])

  if (!chart) {
    return <p className="chart-empty">No trade data available for this range.</p>
  }

  const { ticks, xScale, yScale, buyPath, sellPath, lastBuy, lastSell } = chart
  const hovered = hoverIndex !== null ? data[hoverIndex] : null

  function handleMouseMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const ratio = px / rect.width
    const targetTimestamp = chart!.xMin + ratio * (chart!.xMax - chart!.xMin)
    setHoverIndex(findNearestIndex(data, targetTimestamp))
  }

  return (
    <div className="price-chart">
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: COLOR_BUY }} />
          Buy price (instant-buy avg)
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: COLOR_SELL }} />
          Sell price (instant-sell avg)
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="price-chart-svg" role="img" aria-label="Price history chart">
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={COLOR_GRID}
              strokeWidth={1}
            />
            <text x={MARGIN.left - 8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle" fill={COLOR_TEXT_MUTED} fontSize={11}>
              {formatGpCompact(tick)}
            </text>
          </g>
        ))}
        <line
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={MARGIN.top + INNER_HEIGHT}
          y2={MARGIN.top + INNER_HEIGHT}
          stroke={COLOR_AXIS}
          strokeWidth={1}
        />

        <text x={MARGIN.left} y={HEIGHT - 8} textAnchor="start" fill={COLOR_TEXT_MUTED} fontSize={11}>
          {formatTimestamp(data[0].timestamp, lookback)}
        </text>
        <text x={WIDTH - MARGIN.right} y={HEIGHT - 8} textAnchor="end" fill={COLOR_TEXT_MUTED} fontSize={11}>
          {formatTimestamp(data[data.length - 1].timestamp, lookback)}
        </text>

        <path d={buyPath} fill="none" stroke={COLOR_BUY} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={sellPath} fill="none" stroke={COLOR_SELL} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {lastBuy && (
          <g>
            <circle cx={xScale(lastBuy.timestamp)} cy={yScale(lastBuy.avgHighPrice as number)} r={4} fill={COLOR_BUY} stroke={COLOR_SURFACE} strokeWidth={2} />
            <text x={xScale(lastBuy.timestamp) + 8} y={yScale(lastBuy.avgHighPrice as number)} dominantBaseline="middle" fill={COLOR_TEXT_SECONDARY} fontSize={11}>
              {formatGpCompact(lastBuy.avgHighPrice as number)}
            </text>
          </g>
        )}
        {lastSell && (
          <g>
            <circle cx={xScale(lastSell.timestamp)} cy={yScale(lastSell.avgLowPrice as number)} r={4} fill={COLOR_SELL} stroke={COLOR_SURFACE} strokeWidth={2} />
            <text x={xScale(lastSell.timestamp) + 8} y={yScale(lastSell.avgLowPrice as number)} dominantBaseline="middle" fill={COLOR_TEXT_SECONDARY} fontSize={11}>
              {formatGpCompact(lastSell.avgLowPrice as number)}
            </text>
          </g>
        )}

        {hovered && (
          <g>
            <line
              x1={xScale(hovered.timestamp)}
              x2={xScale(hovered.timestamp)}
              y1={MARGIN.top}
              y2={MARGIN.top + INNER_HEIGHT}
              stroke={COLOR_AXIS}
              strokeWidth={1}
            />
            {hovered.avgHighPrice !== null && (
              <circle cx={xScale(hovered.timestamp)} cy={yScale(hovered.avgHighPrice)} r={4} fill={COLOR_BUY} stroke={COLOR_SURFACE} strokeWidth={2} />
            )}
            {hovered.avgLowPrice !== null && (
              <circle cx={xScale(hovered.timestamp)} cy={yScale(hovered.avgLowPrice)} r={4} fill={COLOR_SELL} stroke={COLOR_SURFACE} strokeWidth={2} />
            )}
          </g>
        )}

        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={INNER_WIDTH}
          height={INNER_HEIGHT}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div className="chart-tooltip">
          <strong>{new Date(hovered.timestamp * 1000).toLocaleString('en-US')}</strong>
          <span>Buy: {hovered.avgHighPrice !== null ? formatGp(hovered.avgHighPrice) : 'no data'}</span>
          <span>Sell: {hovered.avgLowPrice !== null ? formatGp(hovered.avgLowPrice) : 'no data'}</span>
        </div>
      )}

      <button type="button" className="table-toggle" onClick={() => setShowTable((v) => !v)}>
        {showTable ? 'Hide' : 'Show'} data table
      </button>

      {showTable && (
        <div className="chart-table-wrapper">
          <table className="chart-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Buy avg</th>
                <th>Sell avg</th>
                <th>Buy vol</th>
                <th>Sell vol</th>
              </tr>
            </thead>
            <tbody>
              {data
                .slice()
                .reverse()
                .map((d) => (
                  <tr key={d.timestamp}>
                    <td>{new Date(d.timestamp * 1000).toLocaleString('en-US')}</td>
                    <td>{d.avgHighPrice !== null ? formatGp(d.avgHighPrice) : '—'}</td>
                    <td>{d.avgLowPrice !== null ? formatGp(d.avgLowPrice) : '—'}</td>
                    <td>{d.highPriceVolume.toLocaleString('en-US')}</td>
                    <td>{d.lowPriceVolume.toLocaleString('en-US')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PriceHistoryChart
