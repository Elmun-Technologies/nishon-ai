'use client'

import { createContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { Language, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, Translations } from './config'
import { getNestedTranslation } from './use-i18n'

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface I18nContextType {
  language: Language
  translations: Translations
  setLanguage: (lang: Language) => void
  t: (key: string, defaultValue?: string) => string
}

// ─── Create Context ───────────────────────────────────────────────────────────

const EMPTY_TRANSLATIONS = {} as Translations

function mergeDeep<T extends Record<string, any>>(base: T, patch: Record<string, any>): T {
  const out: Record<string, any> = { ...base }
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof out[key] === 'object' &&
      out[key] !== null
    ) {
      out[key] = mergeDeep(out[key], value)
    } else {
      out[key] = value
    }
  }
  return out as T
}

export const I18nContext = createContext<I18nContextType>({
  language: DEFAULT_LANGUAGE,
  translations: EMPTY_TRANSLATIONS,
  setLanguage: () => {},
  t: (key: string, defaultValue?: string) => defaultValue ?? key,
})

// ─── Provider Component ───────────────────────────────────────────────────────

interface I18nProviderProps {
  children: ReactNode
  defaultLanguage?: Language
}

export function I18nProvider({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
}: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage)
  const [translations, setTranslations] = useState<Translations>(EMPTY_TRANSLATIONS)
  const [fallbackEn, setFallbackEn] = useState<Translations>(EMPTY_TRANSLATIONS)

  // Initialize from localStorage only. If absent, keep English default.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (savedLanguage) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Load translations when language changes
  useEffect(() => {
    const loadFallbackEnglish = async () => {
      try {
        const enResponse = await fetch('/locales/en.json')
        const enData = await enResponse.json()
        setFallbackEn(enData)
      } catch (error) {
        console.error('Failed to load English fallback translations:', error)
      }
    }

    void loadFallbackEnglish()
  }, [])

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`)
        const data = await response.json()
        setTranslations(mergeDeep(fallbackEn, data))
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
        document.documentElement.lang = language
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error)
      }
    }

    loadTranslations()
  }, [language, fallbackEn])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const t = useCallback(
    (key: string, defaultValue: string = key): string => {
      return getNestedTranslation(translations, key) || defaultValue
    },
    [translations]
  )

  return (
    <I18nContext.Provider
      value={{
        language,
        translations,
        setLanguage,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}
