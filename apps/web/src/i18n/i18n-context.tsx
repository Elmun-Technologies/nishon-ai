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

export const I18nContext = createContext<I18nContextType | undefined>(undefined)

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
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Initialize client-side
  useEffect(() => {
    setIsClient(true)

    // Get saved language from localStorage
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language
    if (savedLanguage) {
      setLanguageState(savedLanguage)
      return
    }

    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0] as Language
    if (['uz', 'ru', 'en'].includes(browserLang)) {
      setLanguageState(browserLang)
    }
  }, [])

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`)
        const data = await response.json()
        setTranslations(data)
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
        document.documentElement.lang = language
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error)
      }
    }

    loadTranslations()
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const t = useCallback(
    (key: string, defaultValue: string = key): string => {
      if (!translations) return defaultValue

      return getNestedTranslation(translations, key) || defaultValue
    },
    [translations]
  )

  if (!isClient || !translations) {
    return <>{children}</>
  }

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
