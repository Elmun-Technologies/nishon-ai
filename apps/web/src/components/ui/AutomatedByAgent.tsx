'use client'

import Link from 'next/link'
import { Bot, Lock, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'

/**
 * Locked screen shown when a manual module is frozen because the autonomous AI
 * agent now owns that surface (see `lib/agent-mode.ts`). Honest, on-brand
 * replacement for the manual builder — "this is handled by the AI Agent now"
 * plus a route back to the agent.
 *
 * The underlying page/component is NOT removed; flipping NEXT_PUBLIC_AGENT_MODE
 * off restores the manual builder in place of this screen.
 */
export function AutomatedByAgent({
  module = 'default',
}: {
  /** Which frozen module this is standing in for — selects the copy. */
  module?: 'campaignBuilder' | 'audienceBuilder' | 'retargeting' | 'default'
}) {
  const { t } = useI18n()

  const COPY: Record<string, { title: string; body: string }> = {
    campaignBuilder: {
      title: t('agent.frozen.campaignBuilder.title', 'Kampaniyalarni AI Agent boshqaradi'),
      body: t(
        'agent.frozen.campaignBuilder.body',
        "Qo'lda kampaniya yaratish o'chirildi. AI Agent maqsad va byudjetingizga qarab kampaniyalarni o'zi ishga tushiradi va optimallashtiradi.",
      ),
    },
    audienceBuilder: {
      title: t('agent.frozen.audienceBuilder.title', 'Auditoriyalarni AI Agent tuzadi'),
      body: t(
        'agent.frozen.audienceBuilder.body',
        "Qo'lda auditoriya konstruktori o'chirildi. AI Agent funnel bosqichlariga (TOFU/MOFU/BOFU) qarab auditoriyalarni avtomatik shakllantiradi.",
      ),
    },
    retargeting: {
      title: t('agent.frozen.retargeting.title', 'Retargeting AI Agent nazoratida'),
      body: t(
        'agent.frozen.retargeting.body',
        "Qo'lda retargeting sozlamasi o'chirildi. AI Agent signal va konversiyalarga qarab retargetingni avtomatik yuritadi.",
      ),
    },
    default: {
      title: t('agent.frozen.default.title', 'Bu modulni AI Agent boshqaradi'),
      body: t(
        'agent.frozen.default.body',
        "Bu bo'lim avtonom AI Agent tomonidan avtomatlashtirildi. Sozlamalarni AI Agent o'zi hal qiladi.",
      ),
    },
  }

  const copy = COPY[module] ?? COPY.default

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-surface p-10 text-center shadow-sm">
        <div className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
          <Bot className="h-7 w-7" aria-hidden />
          <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-surface">
            <Lock className="h-3 w-3" aria-hidden />
          </span>
        </div>

        <span className="mt-5 inline-flex items-center gap-1 rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
          <Sparkles className="h-2.5 w-2.5" aria-hidden />
          {t('agent.frozen.badge', 'Automated by AI Agent')}
        </span>

        <h2 className="mt-4 text-2xl font-bold text-text-primary">{copy.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{copy.body}</p>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex items-center gap-1.5 rounded-xl bg-[#1b2e06] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#243a12]"
        >
          <Bot className="h-4 w-4" aria-hidden />
          {t('agent.frozen.cta', 'AI Agent sahifasiga o\'tish')}
        </Link>
      </div>
    </div>
  )
}

export default AutomatedByAgent
