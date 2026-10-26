import type { Boss, GearOption, GearSetup, GearSlot } from '../types'

export interface SetupScore {
  // 0..1, how much of the best-in-slot setup the player has.
  score: number
  coveredSlots: number
  totalSlots: number
}

export interface BossScore extends SetupScore {
  // Which of the boss's setups (combat styles) the player is closest to.
  bestSetupIndex: number
}

// Alternatives ('/') and combined items ('+') both count as owned if the player has
// any one of the items. Requiring every piece of a '+' pair would zero out a slot
// for someone who has one of two bolt types, which is misleading.
export function isOptionOwned(option: GearOption, owned: Set<string>): boolean {
  return option.items.some((item) => owned.has(item))
}

// Options are listed best-first, so the first owned option is the best the player has.
// Returns -1 when they own nothing for the slot.
export function bestOwnedIndex(slot: GearSlot, owned: Set<string>): number {
  return slot.options.findIndex((option) => isOptionOwned(option, owned))
}

// An owned top-tier item scores 1; each step down the list is worth proportionally less.
function slotScore(slot: GearSlot, owned: Set<string>): number {
  const index = bestOwnedIndex(slot, owned)
  return index === -1 ? 0 : (slot.options.length - index) / slot.options.length
}

export function scoreSetup(setup: GearSetup, owned: Set<string>): SetupScore {
  const totalSlots = setup.slots.length
  let sum = 0
  let coveredSlots = 0
  for (const slot of setup.slots) {
    const value = slotScore(slot, owned)
    sum += value
    if (value > 0) coveredSlots++
  }
  return { score: totalSlots ? sum / totalSlots : 0, coveredSlots, totalSlots }
}

export function scoreBoss(boss: Boss, owned: Set<string>): BossScore {
  let best: BossScore = { score: -1, coveredSlots: 0, totalSlots: 0, bestSetupIndex: 0 }
  boss.setups.forEach((setup, index) => {
    const result = scoreSetup(setup, owned)
    if (result.score > best.score) best = { ...result, bestSetupIndex: index }
  })
  return best
}

export function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`
}
