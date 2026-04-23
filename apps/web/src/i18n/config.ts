// ─── Language Configuration ───────────────────────────────────────────────────

/** UI languages. Russian is the canonical copy source for the product (default). */
export const LANGUAGES = {
  ru: { name: 'Русский', flag: '🇷🇺', displayCode: 'RU', localeCode: 'RU', dir: 'ltr' },
  en: { name: 'English', flag: '🇬🇧', displayCode: 'GB', localeCode: 'EN', dir: 'ltr' },
  uz: { name: "O'zbek", flag: '🇺🇿', displayCode: 'UZ', localeCode: 'UZ', dir: 'ltr' },
} as const

export type Language = keyof typeof LANGUAGES
export const DEFAULT_LANGUAGE: Language = 'ru'
export const LANGUAGES_LIST = Object.entries(LANGUAGES).map(([code, config]) => ({
  code: code as Language,
  ...config,
}))

// ─── Translation Types ────────────────────────────────────────────────────────

export interface Translations {
  common: Record<string, string>
  navigation: Record<string, string>
  landing: {
    hero: Record<string, any>
    capabilities: Record<string, any>
    funnel: Record<string, string>
  }
  marketplace: Record<string, any>
  portfolio: Record<string, string>
  leaderboard: Record<string, any>
  badges: Record<string, string>
  levels: Record<string, string>
  dashboard: Record<string, string>
  automation: Record<string, string>
  retargeting: Record<string, string>
  creative: Record<string, string>
  auth: Record<string, any>
  errors: Record<string, string>
  /** Marketing / public shell copy (navbar, footer, CTAs) */
  publicSite: Record<string, any>
  /** Terms, privacy, data deletion (public legal) */
  legal: Record<string, any>
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

/** Current UI language (ru | en | uz). Legacy `nishon-language` is read once for migration. */
export const LANGUAGE_STORAGE_KEY = 'adspectr-ui-language'
export const LEGACY_LANGUAGE_STORAGE_KEY = 'nishon-language'
