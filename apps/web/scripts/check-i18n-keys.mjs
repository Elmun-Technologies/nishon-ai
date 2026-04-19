/**
 * Lists translation keys present in ru.json but missing in en.json or uz.json.
 * Run from apps/web: node scripts/check-i18n-keys.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../public/locales')

function flattenLeaves(obj, prefix = '') {
  const out = []
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenLeaves(v, p))
    } else {
      out.push(p)
    }
  }
  return out
}

function load(name) {
  const fp = path.join(localesDir, name)
  return JSON.parse(fs.readFileSync(fp, 'utf8'))
}

const ru = load('ru.json')
const en = load('en.json')
const uz = load('uz.json')

const ruKeys = new Set(flattenLeaves(ru))
const enKeys = new Set(flattenLeaves(en))
const uzKeys = new Set(flattenLeaves(uz))

const missingEn = [...ruKeys].filter((k) => !enKeys.has(k)).sort()
const missingUz = [...ruKeys].filter((k) => !uzKeys.has(k)).sort()

console.log(`ru.json leaf keys: ${ruKeys.size}`)
console.log(`en.json leaf keys: ${enKeys.size} (missing vs ru: ${missingEn.length})`)
console.log(`uz.json leaf keys: ${uzKeys.size} (missing vs ru: ${missingUz.length})`)

if (missingEn.length) {
  console.log('\n--- Missing in en.json (first 80) ---')
  console.log(missingEn.slice(0, 80).join('\n'))
  if (missingEn.length > 80) console.log(`... +${missingEn.length - 80} more`)
}
if (missingUz.length) {
  console.log('\n--- Missing in uz.json (first 80) ---')
  console.log(missingUz.slice(0, 80).join('\n'))
  if (missingUz.length > 80) console.log(`... +${missingUz.length - 80} more`)
}
