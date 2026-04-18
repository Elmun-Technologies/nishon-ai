// ─── Language Configuration ───────────────────────────────────────────────────

export const LANGUAGES = {
  uz: { name: "O'zbek", flag: '🇺🇿', dir: 'ltr' },
  ru: { name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
} as const

export type Language = keyof typeof LANGUAGES
export const DEFAULT_LANGUAGE: Language = 'en'
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
  auth: Record<string, string>
  errors: Record<string, string>
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const LANGUAGE_STORAGE_KEY = 'nishon-language'
