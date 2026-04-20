/**
 * Pre-auth onboarding: answers stored locally until the user finishes
 * and is allowed to open `/register`.
 *
 * v3 extends the budget mix with Uzbekistan–relevant channels (Instagram,
 * OLX, Uzum, Telegram) alongside paid Meta / Google / Yandex, and captures
 * free-text detail for avatars, Telegram placements, and where customers
 * actually show up (one or many touchpoints).
 */
const STORAGE_DRAFT = 'adspectr-preauth-onboarding-draft'
const STORAGE_READY = 'adspectr-preauth-onboarding-register-allowed'
const TEXT_FIELD_MAX = 4000

export const CHANNEL_KEYS = [
  'instagram',
  'metaAds',
  'google',
  'yandex',
  'olx',
  'uzum',
  'telegram',
] as const

export type ChannelKey = (typeof CHANNEL_KEYS)[number]

export type ChannelSplit = Record<ChannelKey, number>

export type GeoFocus = '' | 'home' | 'cis' | 'global'

export type PreAuthOnboardingDraft = {
  v: 3
  goal: string
  budgetBand: string
  industry: string
  channelSplit: ChannelSplit
  geoFocus: GeoFocus
  /** Where customers find you — one place or several (any language). */
  customerTouchpoints: string
  /** Instagram customer avatar(s) — one or several, comma/newline separated. */
  instagramAvatars: string
  /** Telegram channels / groups / bots you use or plan to use. */
  telegramChannels: string
  /** Who you reach on Telegram (language, interests, segments, etc.). */
  telegramAudiences: string
}

type LegacyPlatformSplit = { meta: number; google: number; yandex: number }

const DEFAULT_CHANNEL_SPLIT: ChannelSplit = {
  instagram: 12,
  metaAds: 22,
  google: 18,
  yandex: 10,
  olx: 12,
  uzum: 12,
  telegram: 14,
}

export const CHANNEL_COLORS: Record<ChannelKey, string> = {
  instagram: '#E4405F',
  metaAds: '#1877F2',
  google: '#4285F4',
  yandex: '#FC3F1D',
  olx: '#002F34',
  uzum: '#7000FF',
  telegram: '#229ED9',
}

function trimTextField(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v.slice(0, TEXT_FIELD_MAX)
}

export function normalizeChannelSplit(partial?: Partial<ChannelSplit> | null): ChannelSplit {
  const keys = CHANNEL_KEYS
  const raw = keys.map((k) => Math.max(0, Math.round(Number(partial?.[k]) || 0)))
  const sum = raw.reduce((a, b) => a + b, 0)
  if (sum === 0) {
    return { ...DEFAULT_CHANNEL_SPLIT }
  }
  const exact = raw.map((v) => (v / sum) * 100)
  const floor = exact.map((x) => Math.floor(x))
  let rem = 100 - floor.reduce((a, b) => a + b, 0)
  const frac = exact.map((x, i) => ({ i, f: x - floor[i] }))
  frac.sort((a, b) => b.f - a.f)
  const result = [...floor]
  for (let k = 0; k < rem; k++) {
    result[frac[k % frac.length].i]++
  }
  return Object.fromEntries(keys.map((k, i) => [k, result[i]])) as ChannelSplit
}

function legacyPlatformToChannelSplit(ps: Partial<LegacyPlatformSplit> | null): ChannelSplit {
  const m = Math.max(0, Math.round(Number(ps?.meta) || 0))
  const g = Math.max(0, Math.round(Number(ps?.google) || 0))
  const y = Math.max(0, Math.round(Number(ps?.yandex) || 0))
  return normalizeChannelSplit({
    instagram: 0,
    metaAds: m,
    google: g,
    yandex: y,
    olx: 0,
    uzum: 0,
    telegram: 0,
  })
}

export function emptyPreAuthOnboardingDraft(): PreAuthOnboardingDraft {
  return emptyDraft()
}

function emptyDraft(): PreAuthOnboardingDraft {
  return {
    v: 3,
    goal: '',
    budgetBand: '',
    industry: '',
    channelSplit: { ...DEFAULT_CHANNEL_SPLIT },
    geoFocus: '',
    customerTouchpoints: '',
    instagramAvatars: '',
    telegramChannels: '',
    telegramAudiences: '',
  }
}

function coerceGeo(v: unknown): GeoFocus {
  return v === 'home' || v === 'cis' || v === 'global' ? v : ''
}

/** Migrate legacy v1/v2 payloads to v3. */
function migrateFromStorage(raw: unknown): PreAuthOnboardingDraft {
  if (!raw || typeof raw !== 'object') return emptyDraft()
  const p = raw as Record<string, unknown>

  if (p.v === 3) {
    return {
      v: 3,
      goal: typeof p.goal === 'string' ? p.goal : '',
      budgetBand: typeof p.budgetBand === 'string' ? p.budgetBand : '',
      industry: typeof p.industry === 'string' ? p.industry : '',
      channelSplit: normalizeChannelSplit(
        p.channelSplit && typeof p.channelSplit === 'object' ? (p.channelSplit as Partial<ChannelSplit>) : null,
      ),
      geoFocus: coerceGeo(p.geoFocus),
      customerTouchpoints: trimTextField(p.customerTouchpoints),
      instagramAvatars: trimTextField(p.instagramAvatars),
      telegramChannels: trimTextField(p.telegramChannels),
      telegramAudiences: trimTextField(p.telegramAudiences),
    }
  }

  if (p.v === 2) {
    const ps =
      p.platformSplit && typeof p.platformSplit === 'object'
        ? (p.platformSplit as Partial<LegacyPlatformSplit>)
        : null
    return {
      v: 3,
      goal: typeof p.goal === 'string' ? p.goal : '',
      budgetBand: typeof p.budgetBand === 'string' ? p.budgetBand : '',
      industry: typeof p.industry === 'string' ? p.industry : '',
      channelSplit: legacyPlatformToChannelSplit(ps),
      geoFocus: coerceGeo(p.geoFocus),
      customerTouchpoints: '',
      instagramAvatars: '',
      telegramChannels: '',
      telegramAudiences: '',
    }
  }

  // v1 or unknown
  return {
    v: 3,
    goal: typeof p.goal === 'string' ? p.goal : '',
    budgetBand: typeof p.budgetBand === 'string' ? p.budgetBand : '',
    industry: typeof p.industry === 'string' ? p.industry : '',
    channelSplit: { ...DEFAULT_CHANNEL_SPLIT },
    geoFocus: '',
    customerTouchpoints: '',
    instagramAvatars: '',
    telegramChannels: '',
    telegramAudiences: '',
  }
}

export function loadPreAuthOnboardingDraft(): PreAuthOnboardingDraft {
  if (typeof window === 'undefined') return emptyDraft()
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT)
    if (!raw) return emptyDraft()
    return migrateFromStorage(JSON.parse(raw) as unknown)
  } catch {
    return emptyDraft()
  }
}

export function savePreAuthOnboardingDraft(partial: Partial<PreAuthOnboardingDraft>) {
  if (typeof window === 'undefined') return
  const cur = loadPreAuthOnboardingDraft()
  const next: PreAuthOnboardingDraft = {
    ...cur,
    ...partial,
    v: 3,
    channelSplit:
      partial.channelSplit !== undefined
        ? normalizeChannelSplit(partial.channelSplit)
        : cur.channelSplit,
    geoFocus: partial.geoFocus !== undefined ? coerceGeo(partial.geoFocus) : cur.geoFocus,
    customerTouchpoints:
      partial.customerTouchpoints !== undefined ? trimTextField(partial.customerTouchpoints) : cur.customerTouchpoints,
    instagramAvatars:
      partial.instagramAvatars !== undefined ? trimTextField(partial.instagramAvatars) : cur.instagramAvatars,
    telegramChannels:
      partial.telegramChannels !== undefined ? trimTextField(partial.telegramChannels) : cur.telegramChannels,
    telegramAudiences:
      partial.telegramAudiences !== undefined ? trimTextField(partial.telegramAudiences) : cur.telegramAudiences,
  }
  localStorage.setItem(STORAGE_DRAFT, JSON.stringify(next))
}

export function isPreAuthOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_READY) === '1'
}

/** Call when the user finishes the last onboarding step (before navigating to `/register`). */
export function markPreAuthOnboardingComplete() {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_READY, '1')
}

export function clearPreAuthOnboarding() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_DRAFT)
  localStorage.removeItem(STORAGE_READY)
}

export function channelSplitSum(s: ChannelSplit): number {
  return CHANNEL_KEYS.reduce((acc, k) => acc + s[k], 0)
}

/** Change one leg of the mix; the others absorb the remainder by current ratio (always totals 100). */
export function adjustChannelSplit(prev: ChannelSplit, key: ChannelKey, nextForKey: number): ChannelSplit {
  const v = Math.max(0, Math.min(100, Math.round(nextForKey)))
  const restKeys = CHANNEL_KEYS.filter((k) => k !== key)
  const r = 100 - v
  const restSum = restKeys.reduce((acc, k) => acc + prev[k], 0)
  const base: ChannelSplit = { ...prev, [key]: v }

  if (r === 0) {
    for (const k of restKeys) base[k] = 0
    return normalizeChannelSplit(base)
  }

  if (restSum === 0) {
    const each = Math.floor(r / restKeys.length)
    let leftover = r - each * restKeys.length
    for (let i = 0; i < restKeys.length; i++) {
      const rk = restKeys[i]
      base[rk] = each + (leftover > 0 ? 1 : 0)
      if (leftover > 0) leftover--
    }
    return normalizeChannelSplit(base)
  }

  let allocated = 0
  for (let i = 0; i < restKeys.length - 1; i++) {
    const rk = restKeys[i]
    const val = Math.round((prev[rk] / restSum) * r)
    base[rk] = val
    allocated += val
  }
  base[restKeys[restKeys.length - 1]] = r - allocated
  return normalizeChannelSplit(base)
}
