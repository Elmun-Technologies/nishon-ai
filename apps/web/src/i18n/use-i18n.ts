'use client'

import { useContext } from 'react'
import { I18nContext } from './i18n-context'

export function useI18n() {
  const context = useContext(I18nContext)
  return context
}

// ─── Translation Helper ───────────────────────────────────────────────────────

/** Returns translated string or empty string if missing (so callers can apply `defaultValue`). */
export function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return ''
    }
  }

  return typeof value === 'string' ? value : ''
}
