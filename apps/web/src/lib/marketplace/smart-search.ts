import type { MarketplaceFilters } from './types'

/** Oddiy matndan filterlarni topish (keyinroq LLM API bilan almashtirish mumkin). */
export function parseSmartMarketplaceQuery(raw: string): Partial<MarketplaceFilters> {
  const q = raw.trim().toLowerCase()
  if (!q) return {}

  const patch: Partial<MarketplaceFilters> = {}

  if (q.includes('kiyim') || q.includes('ayollar') || q.includes('fashion')) patch.niche = 'kiyim'
  if (q.includes('kurs') || q.includes('edu') || q.includes('o‘qit')) patch.niche = 'kurs'
  if (q.includes('restoran') || q.includes('cafe')) patch.niche = 'restoran'
  if (q.includes('e-commerce') || q.includes('ecommerce')) patch.niche = 'e-commerce'
  if (q.includes('med') || q.includes('clinic')) patch.niche = 'med'

  if (q.includes('toshkent') || q.includes('ташкент')) patch.location = 'Toshkent'
  if (q.includes('samarqand') || q.includes('самарканд')) patch.location = 'Samarqand'
  if (q.includes('remote') || q.includes('masofaviy')) patch.location = 'Remote'

  if (q.includes('meta')) patch.platform = 'meta'
  if (q.includes('google')) patch.platform = 'google'
  if (q.includes('tiktok')) patch.platform = 'tiktok'
  if (q.includes('yandex')) patch.platform = 'yandex'
  if (q.includes('telegram')) patch.platform = 'telegram'

  if (/\$?\s*0\s*[-–]\s*1k|\b0-1k\b|до\s*1k/i.test(raw)) patch.budget = '0-1k'
  if (/\$?\s*1\s*[-–]\s*5k|\b1-5k\b|\$?\s*2k\b|2000\s*\$/i.test(raw)) patch.budget = '1-5k'
  if (/\$?\s*5k\+|\b5000\+\b/i.test(raw)) patch.budget = '5k+'

  if (q.includes("o'zbek") || q.includes('uzbek')) patch.language = 'uz'
  if (q.includes('rus') || q.includes('рус')) patch.language = 'ru'
  if (q.includes('ingliz') || q.includes('english')) patch.language = 'en'

  if (q.includes('verified') || q.includes('тасдиқ')) patch.verifiedOnly = true
  if (q.includes('stabil') || q.includes('8 hafta') || q.includes('consistency')) patch.consistencyOnly = true
  if (q.includes('healthy') || q.includes('ban yo‘q') || q.includes('ban yoq')) patch.healthyAccountOnly = true

  return patch
}
