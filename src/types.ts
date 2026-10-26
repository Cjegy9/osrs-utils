export interface OsrsItem {
  id: number
  name: string
  icon: string
  limit?: number
  price: number | null
}

export interface ShoppingListEntry {
  id: number
  name: string
  icon: string
  unitPrice: number | null
}

// Shape of src/data/bosses.json, produced by scripts/generate-bosses.mjs.
export interface GearOption {
  items: string[]
  // '/' = alternatives for the same slot, '+' = used together (e.g. two bolt types)
  joiner: '/' | '+'
}

export interface GearSlot {
  slot: string
  // Ordered best-first; later options are cheaper or lower-level fallbacks.
  options: GearOption[]
}

export interface GearSetup {
  style: string
  slots: GearSlot[]
}

export interface Boss {
  name: string
  wikiUrl: string
  setups: GearSetup[]
}

export interface BossData {
  generatedAt: string
  source: string
  bosses: Boss[]
}
