const BASE_URL = 'https://prices.runescape.wiki/api/v2/osrs'
const WIKI_IMAGE_BASE = 'https://oldschool.runescape.wiki/images'

export interface ItemMapping {
  id: number
  name: string
  examine: string
  members: boolean
  lowalch?: number
  highalch?: number
  limit?: number
  value: number
  icon: string
}

export interface LatestPriceEntry {
  high: number | null
  highTime: number | null
  low: number | null
  lowTime: number | null
}

interface LatestPricesResponse {
  data: Record<string, LatestPriceEntry>
}

export type Lookback = '6h' | '24h' | '7d' | '30d' | '6m' | '1y'

export interface TimeseriesPoint {
  timestamp: number
  avgHighPrice: number | null
  avgLowPrice: number | null
  highPriceVolume: number
  lowPriceVolume: number
}

interface TimeseriesResponse {
  data: TimeseriesPoint[]
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`OSRS Wiki API request to ${path} failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function fetchItemMapping(): Promise<ItemMapping[]> {
  return getJson<ItemMapping[]>('/mapping')
}

export async function fetchLatestPrices(): Promise<Record<string, LatestPriceEntry>> {
  const res = await getJson<LatestPricesResponse>('/latest')
  return res.data
}

export async function fetchTimeseries(id: number, lookback: Lookback): Promise<TimeseriesPoint[]> {
  const res = await getJson<TimeseriesResponse>(`/timeseries?id=${id}&lookback=${lookback}`)
  return res.data
}

export function getItemIconUrl(icon: string): string {
  return `${WIKI_IMAGE_BASE}/${icon.replace(/ /g, '_')}`
}
