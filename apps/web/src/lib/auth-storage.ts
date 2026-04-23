/**
 * Browser auth token keys. Legacy `performa_*` keys are read once and migrated
 * so existing sessions survive the AdSpectr rebrand.
 */
const ACCESS_TOKEN_KEY = 'adspectr_access_token'
const REFRESH_TOKEN_KEY = 'adspectr_refresh_token'
const LEGACY_ACCESS_TOKEN_KEY = 'performa_access_token'
const LEGACY_REFRESH_TOKEN_KEY = 'performa_refresh_token'

/** Fake access token written by the "Demo sign-in" button — never sent to API. */
export const DEMO_ACCESS_TOKEN = 'demo-token-local-preview'

export function isDemoToken(token: string | null | undefined): boolean {
  return token === DEMO_ACCESS_TOKEN
}

function migrateLegacyPair(
  legacyKey: string,
  nextKey: string,
): string | null {
  if (typeof window === 'undefined') return null
  const next = localStorage.getItem(nextKey)
  if (next) return next
  const legacy = localStorage.getItem(legacyKey)
  if (legacy) {
    localStorage.setItem(nextKey, legacy)
    localStorage.removeItem(legacyKey)
    return legacy
  }
  return null
}

export function getAccessToken(): string | null {
  return migrateLegacyPair(LEGACY_ACCESS_TOKEN_KEY, ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return migrateLegacyPair(LEGACY_REFRESH_TOKEN_KEY, REFRESH_TOKEN_KEY)
}

export function setAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    // Hint cookie lets Next.js middleware detect an active session without reading localStorage
    document.cookie = 'adspectr_auth=1; path=/; SameSite=Lax; max-age=604800'
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    document.cookie = 'adspectr_auth=; path=/; SameSite=Lax; max-age=0'
  }
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  document.cookie = 'adspectr_auth=; path=/; SameSite=Lax; max-age=0'
}

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY }
