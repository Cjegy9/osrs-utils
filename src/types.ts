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
