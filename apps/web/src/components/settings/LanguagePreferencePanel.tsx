'use client'

import { Languages } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { LANGUAGES_LIST, Language } from '@/i18n/config'
import { Card } from '@/components/ui/Card'

/** Full-width language picker for settings (ru / en / uz). Persists in the browser via `I18nProvider`. */
export function LanguagePreferencePanel() {
  const { language, setLanguage, t } = useI18n()

  return (
    <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-blue-500/10 text-violet-700 dark:text-violet-200">
          <Languages className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
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
              {LANGUAGES_LIST.find((l) => l.code === language)?.flag}{' '}
              {LANGUAGES_LIST.find((l) => l.code === language)?.name}
            </span>
          </p>
        </div>
      </div>

      <div
        className="mt-6 grid gap-2 sm:grid-cols-3"
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
                'flex flex-col items-center gap-1 rounded-xl border px-4 py-4 text-sm font-medium transition-all',
                active
                  ? 'border-violet-500 bg-violet-500/10 text-violet-800 shadow-sm dark:border-violet-400 dark:bg-violet-500/15 dark:text-violet-100'
                  : 'border-border bg-surface-2/30 text-text-secondary hover:border-violet-500/40 hover:bg-surface-2/60 hover:text-text-primary',
              ].join(' ')}
            >
              <span className="text-2xl" aria-hidden>
                {lang.flag}
              </span>
              <span className="text-xs uppercase tracking-wide text-text-tertiary">{lang.code}</span>
              <span className="text-center text-sm font-semibold text-text-primary">{lang.name}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
