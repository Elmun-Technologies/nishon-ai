/**
 * Pre-auth onboarding: answers stored locally until the user finishes
 * and is allowed to open `/register`.
 *
 * v2 adds platform budget mix (sum 100%) and primary geo focus — aligned
 * with workspace `Budget.platformSplit` and strategy geo weighting in-product.
 */
const STORAGE_DRAFT = 'adspectr-preauth-onboarding-draft'
const STORAGE_READY = 'adspectr-preauth-onboarding-register-allowed'

export type PlatformSplit = {
  meta: number
  google: number
  yandex: number
}

export type GeoFocus = '' | 'home' | 'cis' | 'global'

export type PreAuthOnboardingDraft = {
  v: 2
  goal: string
  budgetBand: string
  industry: string
  platformSplit: PlatformSplit
  geoFocus: GeoFocus
}

const DEFAULT_SPLIT: PlatformSplit = { meta: 45, google: 35, yandex: 20 }

export function normalizePlatformSplit(partial?: Partial<PlatformSplit> | null): PlatformSplit {
  let m = Math.max(0, Math.round(Number(partial?.meta) || 0))
  let g = Math.max(0, Math.round(Number(partial?.google) || 0))
  let y = Math.max(0, Math.round(Number(partial?.yandex) || 0))
  const sum = m + g + y
  if (sum === 0) return { ...DEFAULT_SPLIT }
  m = Math.round((m / sum) * 100)
  g = Math.round((g / sum) * 100)
  y = 100 - m - g
  if (y < 0) {
    y = 0
    g = Math.max(0, 100 - m)
  }
  return { meta: m, google: g, yandex: y }
}

function emptyDraft(): PreAuthOnboardingDraft {
  return {
    v: 2,
    goal: '',
    budgetBand: '',
    industry: '',
    platformSplit: { ...DEFAULT_SPLIT },
    geoFocus: '',
  }
}

function coerceGeo(v: unknown): GeoFocus {
  return v === 'home' || v === 'cis' || v === 'global' ? v : ''
}

/** Migrate legacy v1 payloads to v2. */
function migrateFromStorage(raw: unknown): PreAuthOnboardingDraft {
  if (!raw || typeof raw !== 'object') return emptyDraft()
  const p = raw as Record<string, unknown>
  if (p.v === 2) {
    return {
      v: 2,
      goal: typeof p.goal === 'string' ? p.goal : '',
      budgetBand: typeof p.budgetBand === 'string' ? p.budgetBand : '',
      industry: typeof p.industry === 'string' ? p.industry : '',
      platformSplit: normalizePlatformSplit(
        p.platformSplit && typeof p.platformSplit === 'object' ? (p.platformSplit as Partial<PlatformSplit>) : null,
      ),
      geoFocus: coerceGeo(p.geoFocus),
    }
  }
  // v1 or unknown
  return {
    v: 2,
    goal: typeof p.goal === 'string' ? p.goal : '',
    budgetBand: typeof p.budgetBand === 'string' ? p.budgetBand : '',
    industry: typeof p.industry === 'string' ? p.industry : '',
    platformSplit: { ...DEFAULT_SPLIT },
    geoFocus: '',
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
    v: 2,
    platformSplit:
      partial.platformSplit !== undefined
        ? normalizePlatformSplit(partial.platformSplit)
        : cur.platformSplit,
    geoFocus: partial.geoFocus !== undefined ? coerceGeo(partial.geoFocus) : cur.geoFocus,
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

export function platformSplitSum(s: PlatformSplit): number {
  return s.meta + s.google + s.yandex
}

/** Change one leg of the mix; the other two absorb the remainder by current ratio (always totals 100). */
export function adjustPlatformSplit(
  prev: PlatformSplit,
  key: keyof PlatformSplit,
  nextForKey: number,
): PlatformSplit {
  const v = Math.max(0, Math.min(100, Math.round(nextForKey)))
  const order: (keyof PlatformSplit)[] = ['meta', 'google', 'yandex']
  const restKeys = order.filter((k) => k !== key) as [keyof PlatformSplit, keyof PlatformSplit]
  const r = 100 - v
  const a = prev[restKeys[0]]
  const b = prev[restKeys[1]]
  const denom = a + b || 1
  const na = Math.round((a / denom) * r)
  const nb = r - na
  return {
    meta: key === 'meta' ? v : restKeys[0] === 'meta' ? na : nb,
    google: key === 'google' ? v : restKeys[0] === 'google' ? na : nb,
    yandex: key === 'yandex' ? v : restKeys[0] === 'yandex' ? na : nb,
  }
}
