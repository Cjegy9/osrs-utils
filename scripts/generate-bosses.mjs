// Generates src/data/bosses.json from the OSRS Wiki.
//
// For each boss we read its "/Strategies" page and pull out every
// {{Recommended equipment}} block (one per combat style). Run with:
//   npm run generate:bosses
// and commit the resulting JSON — the app reads the file, not the wiki.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://oldschool.runescape.wiki/api.php'
const UA = 'osrs-utilities boss data script (github.com/Cjegy9/osrs-utils)'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/bosses.json')

// Bosses that aren't in Category:Bosses but belong in a boss selector.
// Maps display name -> strategies page title.
const EXTRA_BOSSES = {
  'Chambers of Xeric': 'Chambers of Xeric/Strategies',
  'Theatre of Blood': 'Theatre of Blood/Strategies',
  'Tombs of Amascut': 'Tombs of Amascut/Strategies',
  'The Inferno': 'Inferno/Strategies',
  'TzHaar Fight Cave': 'TzHaar Fight Cave/Strategies',
}

// Category members that are real bosses but whose strategies page uses a different title.
const STRATEGY_ALIASES = {
  'TzTok-Jad': null, // covered by TzHaar Fight Cave
  'TzKal-Zuk': null, // covered by The Inferno
  'Barrows brothers': null, // covered by Barrows
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function listAll(params, listKey, contKey) {
  const out = []
  let cont = {}
  do {
    const json = await api({ ...params, ...cont })
    out.push(...json.query[listKey])
    cont = json.continue ?? null
    if (cont && !cont[contKey]) cont = null
  } while (cont)
  return out
}

// Returns the text of every top-level {{Recommended equipment ...}} block.
function findTemplateBlocks(wikitext, name) {
  const blocks = []
  const needle = new RegExp(`\\{\\{\\s*${name}\\s*(?=[|}])`, 'gi')
  let match
  while ((match = needle.exec(wikitext))) {
    let depth = 0
    let i = match.index
    for (; i < wikitext.length; i++) {
      if (wikitext.startsWith('{{', i)) {
        depth++
        i++
      } else if (wikitext.startsWith('}}', i)) {
        depth--
        i++
        if (depth === 0) break
      }
    }
    blocks.push(wikitext.slice(match.index + 2, i - 1))
    needle.lastIndex = i
  }
  return blocks
}

// Splits a template body into top-level `|key = value` params.
function splitParams(body) {
  const params = []
  let depth = 0
  let current = ''
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2)
    if (two === '{{' || two === '[[') {
      depth++
      current += two
      i++
    } else if (two === '}}' || two === ']]') {
      depth--
      current += two
      i++
    } else if (body[i] === '|' && depth === 0) {
      params.push(current)
      current = ''
    } else {
      current += body[i]
    }
  }
  params.push(current)
  return params.slice(1) // drop the template name
}

// Removes {{efn|...}}-style footnotes (balanced) so their contents don't leak in as gear.
function stripFootnotes(text) {
  let out = text
  for (let guard = 0; guard < 200; guard++) {
    const start = out.search(/\{\{\s*(?:efn|refn)\b/i)
    if (start === -1) break
    let depth = 0
    let i = start
    for (; i < out.length; i++) {
      if (out.startsWith('{{', i)) {
        depth++
        i++
      } else if (out.startsWith('}}', i)) {
        depth--
        i++
        if (depth === 0) break
      }
    }
    out = out.slice(0, start) + out.slice(i + 1)
  }
  return out.replace(/<ref[\s\S]*?<\/ref>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
}

// Returns { items, joiner } for one slot value. On the wiki "/" between items means
// "or" and "+" means "use together"; joiner is '+' if any pair is combined.
function parseOption(value) {
  const text = stripFootnotes(value)
  const items = []
  let joiner = '/'
  const re = /\{\{\s*plink[a-z]*\s*\|\s*([^|}]+?)\s*(?=[|}])/gi
  let m
  let prevEnd = null
  while ((m = re.exec(text))) {
    const name = m[1].replace(/_/g, ' ')
    if (prevEnd !== null && text.slice(prevEnd, m.index).includes('+')) joiner = '+'
    prevEnd = m.index + m[0].length
    if (!items.includes(name)) items.push(name)
  }
  return { items, joiner }
}

const SLOT_ORDER = ['head', 'neck', 'cape', 'ammo', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring', 'special']

function parseBlock(body) {
  const params = splitParams(body)
  let style = 'Recommended'
  const slots = new Map()
  for (const param of params) {
    const eq = param.indexOf('=')
    if (eq === -1) continue
    const key = param.slice(0, eq).trim().toLowerCase()
    const value = param.slice(eq + 1)
    if (key === 'style') {
      style = stripFootnotes(value).replace(/\s+/g, ' ').trim() || style
      continue
    }
    const slotMatch = key.match(/^([a-z]+?)(\d+)$/)
    if (!slotMatch || !SLOT_ORDER.includes(slotMatch[1])) continue
    const option = parseOption(value)
    if (!option.items.length) continue
    const list = slots.get(slotMatch[1]) ?? []
    list.push({ rank: Number(slotMatch[2]), ...option })
    slots.set(slotMatch[1], list)
  }
  const orderedSlots = SLOT_ORDER.filter((s) => slots.has(s)).map((slot) => ({
    slot,
    options: slots
      .get(slot)
      .sort((a, b) => a.rank - b.rank)
      .map(({ items, joiner }) => ({ items, joiner })),
  }))
  return { style, slots: orderedSlots }
}

async function fetchWikitext(titles) {
  const result = new Map()
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40)
    const json = await api({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvslots: 'main',
      titles: chunk.join('|'),
      redirects: '1',
    })
    const redirects = new Map((json.query.redirects ?? []).map((r) => [r.to, r.from]))
    for (const page of json.query.pages) {
      const text = page.revisions?.[0]?.slots?.main?.content
      if (!text) continue
      result.set(page.title, text)
      if (redirects.has(page.title)) result.set(redirects.get(page.title), text)
    }
  }
  return result
}

async function main() {
  const members = await listAll(
    { action: 'query', list: 'categorymembers', cmtitle: 'Category:Bosses', cmlimit: '500', cmnamespace: '0' },
    'categorymembers',
    'cmcontinue',
  )
  const strategyPages = new Set(
    (
      await listAll(
        {
          action: 'query',
          list: 'embeddedin',
          eititle: 'Template:Recommended equipment',
          eilimit: '500',
          einamespace: '0',
        },
        'embeddedin',
        'eicontinue',
      )
    ).map((p) => p.title),
  )

  const targets = new Map() // display name -> strategies page title
  for (const { title } of members) {
    if (title in STRATEGY_ALIASES) continue
    const strategies = `${title}/Strategies`
    if (strategyPages.has(strategies)) targets.set(title, strategies)
  }
  for (const [name, page] of Object.entries(EXTRA_BOSSES)) targets.set(name, page)

  const texts = await fetchWikitext([...targets.values()])

  const bosses = []
  for (const [name, page] of targets) {
    const text = texts.get(page)
    if (!text) {
      console.warn(`skip ${name}: no page text for ${page}`)
      continue
    }
    const setups = findTemplateBlocks(text, 'Recommended equipment')
      .map(parseBlock)
      .filter((s) => s.slots.length > 0)
    if (!setups.length) {
      console.warn(`skip ${name}: no parsable setups`)
      continue
    }
    bosses.push({
      name,
      wikiUrl: `https://oldschool.runescape.wiki/w/${encodeURIComponent(page.replace(/ /g, '_')).replace(/%2F/g, '/')}`,
      setups,
    })
  }

  bosses.sort((a, b) => a.name.localeCompare(b.name))
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), source: 'https://oldschool.runescape.wiki', bosses }) + '\n',
  )
  console.log(`wrote ${bosses.length} bosses to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
