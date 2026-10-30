// Text format for moving the "My gear" list between browsers/devices via the clipboard.
const FORMAT_VERSION = 1

export interface ParsedGearImport {
  // Items that exist in the boss data and can be used.
  items: string[]
  // Names in the file that the boss data doesn't know about (renamed or removed on the wiki).
  skipped: string[]
}

// Compact on purpose: it's meant to be pasted into chat or a note.
export function serializeGear(items: string[]): string {
  return JSON.stringify({ version: FORMAT_VERSION, items: [...items].sort((a, b) => a.localeCompare(b)) })
}

// Accepts the exported text, or a bare JSON array of item names. Throws a user-readable
// Error for anything else so the caller can show it.
export function parseGearImport(text: string, knownItems: Set<string>): ParsedGearImport {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("That text isn't a gear list. Copy it with Export first.")
  }

  const list = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown } | null)?.items
  if (!Array.isArray(list) || !list.every((entry) => typeof entry === 'string')) {
    throw new Error("That text doesn't look like an exported gear list.")
  }

  const items: string[] = []
  const skipped: string[] = []
  for (const name of new Set(list as string[])) (knownItems.has(name) ? items : skipped).push(name)
  return { items, skipped }
}
