'use client'

import { createContext, ReactNode, useCallback, useEffect, useState } from 'react'
import {
  Language,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  Translations,
} from './config'
import ruLocaleCanonical from '../../public/locales/ru.json'
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
  const canonicalRu = ruLocaleCanonical as unknown as Record<string, unknown>
  const [translations, setTranslations] = useState<Translations>(
    () => canonicalRu as unknown as Translations,
  )

  function readStoredLanguage(): Language | null {
    if (typeof window === 'undefined') return null
    const raw =
      localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)
    if (raw === 'ru' || raw === 'en' || raw === 'uz') return raw
    return null
  }

  // Restore saved UI language (new key first, then legacy).
  useEffect(() => {
    const saved = readStoredLanguage()
    if (saved) {
      setLanguageState(saved)
      if (!localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, saved)
      }
    }
  }, [])

  // Load active locale and merge on top of Russian canonical strings (missing keys fall back to ru).
  useEffect(() => {
    let cancelled = false

    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`)
        const data = (await response.json()) as Record<string, unknown>
        if (cancelled) return
        setTranslations(mergeDeep(canonicalRu, data) as unknown as Translations)
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
        document.documentElement.lang = language
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error)
        if (!cancelled) setTranslations(canonicalRu as unknown as Translations)
      }
    }

    void loadTranslations()
    return () => {
      cancelled = true
    }
  }, [language])

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
