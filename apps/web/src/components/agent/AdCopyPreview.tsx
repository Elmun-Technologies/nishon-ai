'use client'

import { useState } from 'react'
import { Megaphone, MousePointerClick, Sparkles, Target } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { adCopyFor, type CopyLang, type Vertical } from '@/lib/ad-copy-templates'
import type { FunnelStage } from '@/lib/funnel-allocator'

/**
 * Tabbed preview of AI-generated ad copy for each funnel stage. The copy is
 * produced client-side from the detected business vertical (see
 * ad-copy-templates.ts) so the user sees finished marketing instantly.
 */

const TABS: Array<{ stage: FunnelStage; icon: typeof Target }> = [
  { stage: 'TOFU', icon: Megaphone },
  { stage: 'MOFU', icon: Target },
  { stage: 'BOFU', icon: MousePointerClick },
]

export function AdCopyPreview({ vertical }: { vertical: Vertical }) {
  const { t, language } = useI18n()
  const [stage, setStage] = useState<FunnelStage>('TOFU')

  const lang = (['uz', 'ru', 'en'] as const).includes(language as CopyLang)
    ? (language as CopyLang)
    : 'uz'
  const copy = adCopyFor(vertical, stage, lang)

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-brand-mid dark:text-brand-lime" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('agent.copy.title', 'AI tayyorlagan reklama matni')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map(({ stage: s, icon: Icon }) => {
          const active = stage === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'border-brand-lime bg-brand-lime/10 text-brand-mid dark:text-brand-lime'
                  : 'border-border text-text-secondary hover:border-brand-lime/40',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {s}
            </button>
          )
        })}
      </div>

      {/* Copy card */}
      <div className="mt-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
          {t(`agent.copy.stage.${stage}`, stage)}
        </p>
        <h4 className="mt-1.5 text-base font-bold text-text-primary">{copy.headline}</h4>
        <p className="mt-1.5 text-sm leading-snug text-text-secondary">{copy.body}</p>
        <div className="mt-3">
          <span className="inline-flex items-center rounded-lg bg-[#1b2e06] px-3 py-1.5 text-xs font-semibold text-white">
            {copy.cta}
          </span>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-text-tertiary">
        {t('agent.copy.hint', 'Namuna matnlar — agent faollashgach real kreativlar tayyorlanadi.')}
      </p>
    </div>
  )
}

export default AdCopyPreview
