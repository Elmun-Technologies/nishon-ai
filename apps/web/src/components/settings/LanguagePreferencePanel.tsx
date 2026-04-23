'use client'

import { Languages } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { LANGUAGES_LIST, Language } from '@/i18n/config'
import { Card } from '@/components/ui/Card'

export function LanguagePreferencePanel() {
  const { language, setLanguage, t } = useI18n()
  const current = LANGUAGES_LIST.find((l) => l.code === language)

  return (
    <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
      {/* Header row */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-blue-500/10 text-violet-700 dark:text-violet-200">
          <Languages className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">
            {t('workspaceSettings.language.title', 'Interface language')}
          </h2>
          <p className="text-sm text-text-tertiary">
            {t(
              'workspaceSettings.language.description',
              'Choose the platform language. Your choice is saved in this browser and applies across the app.',
            )}
          </p>
          <p className="text-xs text-text-tertiary">
            {t('workspaceSettings.language.active', 'Current')}:{' '}
            <span className="font-medium text-text-secondary">
              {current?.localeCode.toLowerCase()}{' '}
              {current?.name}
            </span>
          </p>
        </div>
      </div>

      {/* Language picker cards */}
      <div
        className="mt-6 grid gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label={t('workspaceSettings.language.title', 'Interface language')}
      >
        {LANGUAGES_LIST.map((lang) => {
          const active = language === lang.code
          return (
            <button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLanguage(lang.code as Language)}
              className={[
                'group flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
                active
                  ? 'border-violet-500 bg-violet-500/8 shadow-sm dark:border-violet-400 dark:bg-violet-500/12'
                  : 'border-border bg-surface-2/20 hover:border-violet-500/40 hover:bg-surface-2/50',
              ].join(' ')}
            >
              {/* Country / region code — large */}
              <span
                className={[
                  'text-2xl font-bold tracking-wide',
                  active ? 'text-violet-700 dark:text-violet-200' : 'text-text-primary',
                ].join(' ')}
              >
                {lang.displayCode}
              </span>

              {/* Locale code — small */}
              <span
                className={[
                  'text-xs uppercase tracking-widest',
                  active ? 'text-violet-600 dark:text-violet-300' : 'text-text-tertiary',
                ].join(' ')}
              >
                {lang.localeCode}
              </span>

              {/* Human-readable language name */}
              <span
                className={[
                  'text-sm font-semibold',
                  active
                    ? 'text-violet-800 dark:text-violet-100'
                    : 'text-text-secondary group-hover:text-text-primary',
                ].join(' ')}
              >
                {lang.name}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
