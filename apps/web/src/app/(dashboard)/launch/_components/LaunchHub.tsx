'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { Platform } from '../_lib/types'
import { PlatformGlyph, platformIconShell } from './PlatformGlyph'

export function LaunchHub({ onPick }: { onPick: (p: Platform) => void }) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'drafts' | 'ai_drafts' | 'templates' | 'launches'>(
    'drafts',
  )
  const [search, setSearch] = useState('')

  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const tabs = useMemo(
    () =>
      [
        { id: 'drafts' as const, label: lt('hub.tabDrafts', 'Drafts') },
        { id: 'ai_drafts' as const, label: lt('hub.tabAiDrafts', 'AI drafts') },
        { id: 'templates' as const, label: lt('hub.tabTemplates', 'Templates') },
        { id: 'launches' as const, label: lt('hub.tabLaunches', 'Launches') },
      ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  const platforms = useMemo(
    () =>
      [
        {
          id: 'meta' as const,
          variant: 'meta' as const,
          title: lt('platforms.metaName', 'Meta'),
          desc: lt('platforms.metaDesc', ''),
        },
        {
          id: 'google' as const,
          variant: 'google' as const,
          title: lt('platforms.googleName', 'Google Ads'),
          desc: lt('platforms.googleDesc', ''),
        },
        {
          id: 'yandex' as const,
          variant: 'yandex' as const,
          title: lt('platforms.yandexName', 'Yandex Direct'),
          desc: lt('platforms.yandexDesc', ''),
        },
      ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  const telegramCard = useMemo(
    () => ({
      title: lt('platforms.telegramName', 'Telegram Ads'),
      desc: lt('platforms.telegramDesc', ''),
      badge: lt('platforms.comingSoon', 'Coming soon'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text-primary">
            {lt('hub.title', 'Launch')}
          </h1>
          <p className="text-sm text-text-secondary">{lt('hub.subtitle', '')}</p>
        </div>
        <Button type="button" size="md" className="shrink-0" onClick={() => onPick('meta')}>
          {lt('hub.newCampaign', '+ New campaign')}
        </Button>
      </div>

      <Link
        href="/launch/preview"
        className="flex flex-col gap-1 rounded-2xl border border-brand-mid/30 bg-brand-mid/5 p-4 transition-colors hover:bg-brand-mid/10 dark:border-brand-lime/25 dark:bg-brand-lime/5 dark:hover:bg-brand-lime/10 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
            Yangi oqim
          </p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            Strategiya mindmap → tasdiq → Agent yoki mutaxassis
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Preview, 2 yo‘l, Meta ketma-ketligi bilan chalkashmaslik
          </p>
        </div>
        <span className="text-sm font-semibold text-primary underline">Ochish</span>
      </Link>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={lt('hub.searchPlaceholder', 'Search…')}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 md:max-w-md"
      />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {lt('hub.platformEyebrow', 'Platform')}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="group rounded-2xl border border-border bg-surface p-6 text-left shadow-sm transition-all hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <div className={cn('mb-4', platformIconShell(p.variant))}>
                <PlatformGlyph variant={p.variant} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">{p.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{p.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {lt('hub.platformPick', 'Choose')}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
          ))}
          <div
            role="note"
            aria-label={`${telegramCard.title} — ${telegramCard.badge}`}
            className="flex flex-col rounded-2xl border border-dashed border-border/90 bg-surface-2/50 p-6 text-left shadow-inner dark:bg-surface-elevated/40"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className={platformIconShell('telegram')}>
                <PlatformGlyph variant="telegram" />
              </div>
              <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                {telegramCard.badge}
              </span>
            </div>
            <h3 className="text-base font-semibold text-text-primary">{telegramCard.title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{telegramCard.desc}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 px-6 py-12 text-center">
        <p className="mb-2 text-lg font-semibold text-text-primary">{lt('hub.emptyTitle', '')}</p>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-secondary">
          {lt('hub.emptyBody', '')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={() => onPick('meta')}>
            {lt('hub.newCampaign', '+ New campaign')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => onPick('google')}>
            {lt('hub.ctaGoogleAlt', 'Google Ads')}
          </Button>
        </div>
      </div>
    </div>
  )
}
