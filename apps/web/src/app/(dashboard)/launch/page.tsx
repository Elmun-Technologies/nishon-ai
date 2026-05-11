'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Facebook, Send } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { MetaCampaignForm } from './_components/MetaCampaignForm'
import { GoogleCampaignForm } from './_components/GoogleCampaignForm'
import { YandexCampaignForm } from './_components/YandexCampaignForm'

type Platform = 'meta' | 'google' | 'yandex'
type LaunchMode = 'self' | 'ai' | 'expert'

/** Multicolor “G” mark so Google reads clearly at a glance (official palette). */
function GoogleLogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function platformIconShell(variant: 'meta' | 'google' | 'yandex' | 'telegram') {
  const base = 'flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl shadow-sm'
  switch (variant) {
    case 'meta':
      return cn(base, 'bg-[#0866FF]/14 ring-2 ring-[#0866FF]/25 dark:bg-[#0866FF]/20')
    case 'google':
      return cn(base, 'bg-white ring-2 ring-border/90 dark:bg-surface dark:ring-border')
    case 'yandex':
      return cn(base, 'bg-[#FC3F1D]/12 ring-2 ring-[#FC3F1D]/28 dark:bg-[#FC3F1D]/15')
    case 'telegram':
      return cn(base, 'bg-[#229ED9]/14 ring-2 ring-[#229ED9]/30 dark:bg-[#229ED9]/18')
    default:
      return base
  }
}

function PlatformGlyph({ variant }: { variant: 'meta' | 'google' | 'yandex' | 'telegram' }) {
  switch (variant) {
    case 'meta':
      return <Facebook className="h-10 w-10 text-[#0866FF]" strokeWidth={2} aria-hidden />
    case 'google':
      return <GoogleLogoMark className="h-10 w-10" />
    case 'yandex':
      return (
        <span
          className="select-none text-[2.125rem] font-black leading-none tracking-tight text-[#FC3F1D]"
          aria-hidden
        >
          Я
        </span>
      )
    case 'telegram':
      return <Send className="h-9 w-9 -rotate-12 text-[#229ED9]" strokeWidth={2.25} aria-hidden />
    default:
      return null
  }
}

export default function LaunchPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [launchMode, setLaunchMode] = useState<LaunchMode>('self')
  const [activeTab, setActiveTab] = useState<'drafts' | 'ai_drafts' | 'templates' | 'launches'>('drafts')
  const [search, setSearch] = useState('')
  const [launchModeConfirmed, setLaunchModeConfirmed] = useState(false)

  const lt = useCallback(
    (path: string, fallback: string) => t(`launchWizard.${path}`, fallback),
    [t],
  )

  const handlePlatformPick = (nextPlatform: Platform) => {
    setPlatform(nextPlatform)
    setLaunchModeConfirmed(false)
    setLaunchMode('self')
  }

  const handleLaunchModeConfirm = () => {
    if (!platform) return
    if (launchMode === 'ai') {
      router.push(`/create-agent?platform=${platform}`)
      return
    }
    if (launchMode === 'expert') {
      const ws = currentWorkspace
      const params = new URLSearchParams()
      params.set('from', 'launch')
      if (platform) params.set('platform', platform)
      if (ws?.name?.trim()) params.set('business', ws.name.trim())
      if (ws?.industry?.trim()) params.set('industry', ws.industry.trim())
      if (ws?.goal) params.set('goal', String(ws.goal))
      const qParts: string[] = []
      if (ws?.industry?.trim()) qParts.push(ws.industry.trim())
      if (ws?.goal) qParts.push(String(ws.goal).replace(/_/g, ' '))
      if (ws?.name?.trim()) qParts.push(ws.name.trim())
      if (platform === 'meta') qParts.push('Meta Facebook Instagram ads')
      else if (platform === 'google') qParts.push('Google Ads')
      else if (platform === 'yandex') qParts.push('Yandex Direct')
      const q = qParts.join(' ').trim()
      if (q) params.set('q', q)
      router.push(`/marketplace/search?${params.toString()}`)
      return
    }
    setLaunchModeConfirmed(true)
  }

  const tabs = useMemo(
    () =>
      [
        { id: 'drafts' as const, label: lt('hub.tabDrafts', 'Drafts') },
        { id: 'ai_drafts' as const, label: lt('hub.tabAiDrafts', 'AI drafts') },
        { id: 'templates' as const, label: lt('hub.tabTemplates', 'Templates') },
        { id: 'launches' as const, label: lt('hub.tabLaunches', 'Launches') },
      ],
    [lt],
  )

  const selectablePlatformCards = useMemo(
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
    [lt],
  )

  const telegramSoonCard = useMemo(
    () => ({
      title: lt('platforms.telegramName', 'Telegram Ads'),
      desc: lt('platforms.telegramDesc', ''),
      badge: lt('platforms.comingSoon', 'Coming soon'),
    }),
    [lt],
  )

  if (!platform) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text-primary">
              {lt('hub.title', 'Launch')}
            </h1>
            <p className="text-sm text-text-secondary">{lt('hub.subtitle', '')}</p>
          </div>
          <Button type="button" size="md" className="shrink-0" onClick={() => handlePlatformPick('meta')}>
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
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-primary'
              }`}
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
            {selectablePlatformCards.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePlatformPick(p.id)}
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
              aria-label={`${telegramSoonCard.title} — ${telegramSoonCard.badge}`}
              className="flex flex-col rounded-2xl border border-dashed border-border/90 bg-surface-2/50 p-6 text-left shadow-inner dark:bg-surface-elevated/40"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className={platformIconShell('telegram')}>
                  <PlatformGlyph variant="telegram" />
                </div>
                <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                  {telegramSoonCard.badge}
                </span>
              </div>
              <h3 className="text-base font-semibold text-text-primary">{telegramSoonCard.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{telegramSoonCard.desc}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 px-6 py-12 text-center">
          <p className="mb-2 text-lg font-semibold text-text-primary">{lt('hub.emptyTitle', '')}</p>
          <p className="mx-auto mb-6 max-w-md text-sm text-text-secondary">
            {lt('hub.emptyBody', '')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={() => handlePlatformPick('meta')}>
              {lt('hub.newCampaign', '+ New campaign')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => handlePlatformPick('google')}>
              {lt('hub.ctaGoogleAlt', 'Google Ads')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (platform && !launchModeConfirmed) {
    const platformTitle =
      platform === 'meta'
        ? lt('platforms.metaName', 'Meta')
        : platform === 'google'
          ? lt('platforms.googleName', 'Google Ads')
          : lt('platforms.yandexName', 'Yandex Direct')

    return (
      <div className="mx-auto max-w-3xl space-y-8 py-6">
        <div>
          <button
            type="button"
            onClick={() => setPlatform(null)}
            className="mb-3 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {lt('mode.back', 'Back')}
          </button>
          <h1 className="mb-1 text-2xl font-semibold text-text-primary">{platformTitle}</h1>
          <p className="text-sm font-medium text-text-primary">{lt('mode.howTitle', '')}</p>
          <p className="mt-1 text-sm text-text-secondary">{lt('mode.howSubtitle', '')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(
            [
              { id: 'self' as const, title: lt('mode.selfTitle', ''), desc: lt('mode.selfDesc', '') },
              { id: 'ai' as const, title: lt('mode.aiTitle', ''), desc: lt('mode.aiDesc', '') },
              { id: 'expert' as const, title: lt('mode.expertTitle', ''), desc: lt('mode.expertDesc', '') },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setLaunchMode(mode.id)}
              className={`rounded-2xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
                launchMode === mode.id
                  ? 'border-primary bg-primary/[0.06] shadow-sm'
                  : 'border-border hover:border-text-tertiary/40'
              }`}
            >
              <p className="mb-2 text-sm font-semibold text-text-primary">{mode.title}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{mode.desc}</p>
            </button>
          ))}
        </div>

        <Button type="button" size="lg" fullWidth onClick={handleLaunchModeConfirm}>
          {launchMode === 'self'
            ? lt('mode.confirmSelf', '')
            : launchMode === 'ai'
              ? lt('mode.confirmAi', '')
              : lt('mode.confirmExpert', '')}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    )
  }

  const back = () => setLaunchModeConfirmed(false)

  if (platform === 'meta') return <MetaCampaignForm onBack={back} />
  if (platform === 'google') return <GoogleCampaignForm onBack={back} />
  if (platform === 'yandex') return <YandexCampaignForm onBack={back} />

  return null
}
