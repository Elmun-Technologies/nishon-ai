'use client'

import { useContext } from 'react'
import { I18nContext } from './i18n-context'

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}

// ─── Translation Helper ───────────────────────────────────────────────────────

export function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return path // Return the path if translation not found (fallback)
    }
  }

  return typeof value === 'string' ? value : path
}
