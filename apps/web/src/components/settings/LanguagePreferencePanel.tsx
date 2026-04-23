'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Languages, Loader2, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { LANGUAGES, LANGUAGES_LIST, Language } from '@/i18n/config'
import { Card } from '@/components/ui/Card'
import { showToast } from '@/components/ui/Toast'

// ─── Translation coverage per locale (actual measured %) ─────────────────────
const COVERAGE: Record<Language, number> = { ru: 100, en: 94, uz: 94 }

// ─── Browser language → our Language code ────────────────────────────────────
function detectBrowserLanguage(): Language | null {
  if (typeof navigator === 'undefined') return null
  const raw = navigator.language?.slice(0, 2).toLowerCase()
  if (raw === 'ru') return 'ru'
  if (raw === 'en') return 'en'
  if (raw === 'uz') return 'uz'
  return null
}

// ─── Toast messages per language ─────────────────────────────────────────────
const SAVED_MSG: Record<Language, string> = {
  ru: 'Язык сохранён',
  en: 'Language saved',
  uz: 'Til saqlandi',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LanguagePreferencePanel() {
  const { language, setLanguage, isLoading, t } = useI18n()
  const current = LANGUAGES_LIST.find((l) => l.code === language)!

  // Which card is currently being switched to (to show spinner on that card only)
  const [pendingLang, setPendingLang] = useState<Language | null>(null)

  // Browser language suggestion banner
  const [suggestedLang, setSuggestedLang] = useState<Language | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Keyboard navigation ref array
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Detect browser language once on mount
  useEffect(() => {
    const detected = detectBrowserLanguage()
    if (detected && detected !== language) {
      setSuggestedLang(detected)
    }
  }, [])

  // When loading finishes, fire toast and clear pendingLang
  useEffect(() => {
    if (!isLoading && pendingLang !== null) {
      showToast(SAVED_MSG[pendingLang])
      setPendingLang(null)
    }
  }, [isLoading])

  const handleSelect = useCallback(
    (code: Language) => {
      if (code === language) return
      setPendingLang(code)
      setLanguage(code)
      setBannerDismissed(true)
    },
    [language, setLanguage],
  )

  const handleAcceptSuggestion = useCallback(() => {
    if (suggestedLang) handleSelect(suggestedLang)
    setBannerDismissed(true)
  }, [suggestedLang, handleSelect])

  // Arrow key navigation between cards
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (idx + 1) % LANGUAGES_LIST.length
        cardRefs.current[next]?.focus()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (idx - 1 + LANGUAGES_LIST.length) % LANGUAGES_LIST.length
        cardRefs.current[prev]?.focus()
      }
    },
    [],
  )

  const showBanner = suggestedLang && !bannerDismissed

  return (
    <div className="space-y-4">
      {/* ── Browser language suggestion banner ── */}
      {showBanner && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-violet-500/30 bg-violet-500/8 px-4 py-3 text-sm dark:border-violet-400/30 dark:bg-violet-500/10">
          <div className="flex items-center gap-2.5">
            <Languages className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
            <span className="text-text-secondary">
              {t('workspaceSettings.language.browserDetected', 'Your browser language')}:{' '}
              <span className="font-semibold text-text-primary">
                {LANGUAGES[suggestedLang!].name}
              </span>
              .{' '}
              {t('workspaceSettings.language.switchPrompt', 'Switch to it?')}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptSuggestion}
              className="rounded-lg border border-violet-500/40 bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
            >
              {t('common.confirm', 'Yes')}
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:text-text-primary"
              aria-label={t('common.close', 'Close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main card ── */}
      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        {/* Header */}
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
                {current.localeCode.toLowerCase()} {current.name}
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
          {LANGUAGES_LIST.map((lang, idx) => {
            const active = language === lang.code
            const isPending = pendingLang === lang.code
            const coverage = COVERAGE[lang.code]

            return (
              <button
                key={lang.code}
                ref={(el) => { cardRefs.current[idx] = el }}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleSelect(lang.code)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                disabled={isLoading && !isPending}
                className={[
                  'group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  active
                    ? 'border-violet-500 bg-violet-500/8 shadow-sm dark:border-violet-400 dark:bg-violet-500/12'
                    : 'border-border bg-surface-2/20 hover:border-violet-500/40 hover:bg-surface-2/50',
                ].join(' ')}
              >
                {/* Check badge (top-right) */}
                {active && !isPending && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}

                {/* Spinner on the pending card */}
                {isPending && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center text-violet-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}

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

                {/* Language name */}
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

                {/* Translation coverage badge */}
                <span
                  className={[
                    'mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                    coverage === 100
                      ? active
                        ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                        : 'bg-surface-2 text-text-tertiary'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
                  ].join(' ')}
                >
                  {coverage}%
                </span>
              </button>
            )
          })}
        </div>

        {/* Coverage legend */}
        <p className="mt-4 text-[11px] text-text-tertiary">
          {t(
            'workspaceSettings.language.coverageNote',
            '% — share of UI strings translated. Missing strings fall back to Russian.',
          )}
        </p>
      </Card>
    </div>
  )
}
