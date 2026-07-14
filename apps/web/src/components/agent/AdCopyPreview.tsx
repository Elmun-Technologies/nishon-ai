'use client'

import { useEffect, useState } from 'react'
import { Loader2, Megaphone, MousePointerClick, Sparkles, Target } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { adCopyFor, type AdCopy, type CopyLang, type Vertical } from '@/lib/ad-copy-templates'
import type { AgentGoal, FunnelStage } from '@/lib/funnel-allocator'
import { regenerateAdCopy } from '@/lib/regenerate-copy'

/**
 * Tabbed preview of AI-generated ad copy for each funnel stage. Copy is
 * produced client-side from the detected vertical (see ad-copy-templates.ts),
 * with an opt-in "Regenerate with AI" button that hits the server LLM. Once a
 * stage has been regenerated, its live LLM copy replaces the template and is
 * badged with a "✨ AI" chip so users see the difference.
 */

const TABS: Array<{ stage: FunnelStage; icon: typeof Target }> = [
  { stage: 'TOFU', icon: Megaphone },
  { stage: 'MOFU', icon: Target },
  { stage: 'BOFU', icon: MousePointerClick },
]

export function AdCopyPreview({
  vertical,
  websiteUrl,
  goal,
}: {
  vertical: Vertical
  websiteUrl?: string
  goal?: AgentGoal
}) {
  const { t, language } = useI18n()
  const [stage, setStage] = useState<FunnelStage>('TOFU')
  const [aiCopyByStage, setAiCopyByStage] = useState<
    Partial<Record<FunnelStage, AdCopy>>
  >({})
  const [loadingStage, setLoadingStage] = useState<FunnelStage | null>(null)
  const [errorStage, setErrorStage] = useState<FunnelStage | null>(null)

  // If the input context changes materially, clear cached AI copies.
  useEffect(() => {
    setAiCopyByStage({})
  }, [vertical, websiteUrl, goal])

  const lang: CopyLang = (['uz', 'ru', 'en'] as const).includes(language as CopyLang)
    ? (language as CopyLang)
    : 'uz'
  const aiCopy = aiCopyByStage[stage]
  const copy = aiCopy ?? adCopyFor(vertical, stage, lang)
  const isAi = !!aiCopy
  const isLoading = loadingStage === stage

  async function handleRegenerate() {
    if (isLoading || !goal) return
    setErrorStage(null)
    setLoadingStage(stage)
    const res = await regenerateAdCopy({
      websiteUrl: websiteUrl ?? '',
      goal,
      stage,
      lang,
    })
    setLoadingStage(null)
    if (res.source === 'ai') {
      setAiCopyByStage((prev) => ({ ...prev, [stage]: res.copy }))
    } else {
      setErrorStage(stage)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand-mid dark:text-brand-lime" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('agent.copy.title', 'AI tayyorlagan reklama matni')}
          </p>
        </div>
        {isAi && (
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
            <Sparkles className="h-2.5 w-2.5" aria-hidden />
            {t('agent.regen.aiBadge', 'AI')}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map(({ stage: s, icon: Icon }) => {
          const active = stage === s
          const generated = !!aiCopyByStage[s]
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'border-brand-lime bg-brand-lime/10 text-brand-mid dark:text-brand-lime'
                  : 'border-border text-text-secondary hover:border-brand-lime/40',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {s}
              {generated && (
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-lime"
                  aria-label={t('agent.regen.aiBadge', 'AI')}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Copy card */}
      <div className="mt-3 min-h-[168px] rounded-xl border border-border bg-surface p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </span>
            <p className="text-xs font-medium text-text-secondary">
              {t('agent.regen.loading', 'AI yangi matn tayyorlamoqda…')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                {t(`agent.copy.stage.${stage}`, stage)}
              </p>
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide',
                  isAi ? 'text-brand-mid dark:text-brand-lime' : 'text-text-tertiary',
                )}
              >
                · {isAi ? t('agent.regen.sourceAi', 'AI') : t('agent.regen.sourceTemplate', 'Namuna')}
              </span>
            </div>
            <h4 className="mt-1.5 text-base font-bold text-text-primary">{copy.headline}</h4>
            <p className="mt-1.5 text-sm leading-snug text-text-secondary">{copy.body}</p>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-lg bg-[#1b2e06] px-3 py-1.5 text-xs font-semibold text-white">
                {copy.cta}
              </span>
            </div>
          </>
        )}
      </div>

      {errorStage === stage && (
        <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
          {t('agent.regen.fallback', 'AI ulanmadi — namuna matn ko‘rsatilmoqda.')}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-text-tertiary">
          {t('agent.copy.hint', 'Namuna matnlar — agent faollashgach real kreativlar tayyorlanadi.')}
        </p>
        {goal && (
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-lime/30 bg-brand-lime/10 px-3 py-1.5 text-xs font-semibold text-brand-mid transition-colors hover:bg-brand-lime/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-lime"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-3 w-3" aria-hidden />
            )}
            {t('agent.regen.button', 'AI bilan qayta yozish')}
          </button>
        )}
      </div>
    </div>
  )
}

export default AdCopyPreview
