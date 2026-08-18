export function formatGp(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} gp`
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatGpCompact(amount: number): string {
  return `${compactFormatter.format(Math.round(amount))} gp`
}

export function formatTimestamp(unixSeconds: number, lookback: '6h' | '24h' | '7d' | '30d' | '6m' | '1y'): string {
  const date = new Date(unixSeconds * 1000)
  if (lookback === '6h' || lookback === '24h') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (lookback === '7d' || lookback === '30d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
