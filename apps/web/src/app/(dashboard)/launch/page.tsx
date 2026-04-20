'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Globe,
  Megaphone,
  Search,
  Send,
  ShoppingCart,
  Target,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { campaigns as campaignsApi } from '@/lib/api-client'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import {
  WizardAsideHint,
  WizardChoiceRow,
  WizardProgressBar,
  WizardStepCard,
} from '@/components/launch/wizard-shell'
import { cn } from '@/lib/utils'

type Platform = 'meta' | 'google' | 'yandex'
type LaunchMode = 'self' | 'ai' | 'expert'
type MetaStep = 1 | 2 | 3 | 4 | 5
type GoogleStep = 1 | 2 | 3 | 4 | 5
type YandexStep = 1 | 2 | 3 | 4

type MetaObjective = 'leads' | 'traffic' | 'sales' | 'awareness'

function parsePositiveNumber(v: string) {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatMoneyUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

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
        <span className="select-none text-[2.125rem] font-black leading-none tracking-tight text-[#FC3F1D]" aria-hidden>
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const lt = useCallback(
    (path: string, fallback: string) => t(`launchWizard.${path}`, fallback),
    [t],
  )

  const handlePlatformPick = (nextPlatform: Platform) => {
    setPlatform(nextPlatform)
    setLaunchModeConfirmed(false)
    setLaunchMode('self')
    setMetaStep(1)
    setGoogleStep(1)
    setYandexStep(1)
    setMetaData({
      name: '',
      objective: '',
      minAge: 18,
      maxAge: 65,
      location: 'UZ',
      dailyBudget: '',
      campaignDuration: 7,
      creativeName: '',
      creativeUrl: '',
      creativeText: '',
      ctaButton: 'learn_more',
    })
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

  const exitToMode = () => {
    setLaunchModeConfirmed(false)
    setMetaStep(1)
    setGoogleStep(1)
    setYandexStep(1)
    setError('')
  }

  const [metaStep, setMetaStep] = useState<MetaStep>(1)
  const [metaData, setMetaData] = useState({
    name: '',
    objective: '' as '' | MetaObjective,
    minAge: 18,
    maxAge: 65,
    location: 'UZ',
    dailyBudget: '',
    campaignDuration: 7,
    creativeName: '',
    creativeUrl: '',
    creativeText: '',
    ctaButton: 'learn_more',
  })

  const [googleStep, setGoogleStep] = useState<GoogleStep>(1)
  const [googleData, setGoogleData] = useState({
    name: '',
    campaignType: 'search',
    objective: 'leads',
    keywords: '',
    headline1: '',
    headline2: '',
    headline3: '',
    description1: '',
    description2: '',
    finalUrl: '',
    dailyBudget: '',
    biddingStrategy: 'target_cpa',
  })

  const [yandexStep, setYandexStep] = useState<YandexStep>(1)
  const [yandexData, setYandexData] = useState({
    name: '',
    campaignType: 'search',
    keywords: '',
    negativeKeywords: '',
    headline: '',
    description: '',
    url: '',
    dailyBudget: '',
    strategy: 'average_cpc',
  })

  const metaObjectives = useMemo(
    () =>
      [
        {
          id: 'leads' as const,
          icon: <Target className="h-5 w-5" aria-hidden />,
        },
        {
          id: 'traffic' as const,
          icon: <Globe className="h-5 w-5" aria-hidden />,
        },
        {
          id: 'sales' as const,
          icon: <ShoppingCart className="h-5 w-5" aria-hidden />,
        },
        {
          id: 'awareness' as const,
          icon: <Megaphone className="h-5 w-5" aria-hidden />,
        },
      ] as const,
    [],
  )

  const handleMetaLaunch = async () => {
    setSaving(true)
    setError('')
    const nameTrim = metaData.name.trim()
    if (!nameTrim) {
      setError(lt('meta.errorName', 'Enter a campaign name.'))
      setSaving(false)
      return
    }
    const daily = parsePositiveNumber(metaData.dailyBudget)
    if (!daily) {
      setError(lt('meta.errorBudget', 'Enter a valid daily budget.'))
      setSaving(false)
      return
    }
    if (metaData.minAge >= metaData.maxAge) {
      setError(lt('meta.errorAge', 'Invalid age range.'))
      setSaving(false)
      return
    }
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: nameTrim,
        platform: 'meta',
        objective: metaData.objective || 'leads',
        dailyBudget: daily,
        totalBudget: daily * metaData.campaignDuration,
      })
      router.push(`/campaigns`)
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleGoogleLaunch = async () => {
    setSaving(true)
    setError('')
    const daily = parsePositiveNumber(googleData.dailyBudget)
    if (!daily) {
      setError(lt('meta.errorBudget', 'Enter a valid daily budget.'))
      setSaving(false)
      return
    }
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: googleData.name || 'Google campaign',
        platform: 'google',
        objective: googleData.objective,
        dailyBudget: daily,
        totalBudget: daily * 30,
      })
      router.push(`/campaigns`)
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleYandexLaunch = async () => {
    setSaving(true)
    setError('')
    const daily = parsePositiveNumber(yandexData.dailyBudget)
    if (!daily) {
      setError(lt('meta.errorBudget', 'Enter a valid daily budget.'))
      setSaving(false)
      return
    }
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: yandexData.name || 'Yandex campaign',
        platform: 'yandex',
        objective: 'leads',
        dailyBudget: daily,
        totalBudget: daily * 30,
      })
      router.push(`/campaigns`)
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  const metaStepValid = useMemo(() => {
    if (metaStep === 1) return !!metaData.objective
    if (metaStep === 2)
      return metaData.name.trim().length >= 2 && metaData.minAge < metaData.maxAge && metaData.minAge >= 13
    if (metaStep === 3) return parsePositiveNumber(metaData.dailyBudget) !== null
    return true
  }, [metaStep, metaData])

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
          <p className="mx-auto mb-6 max-w-md text-sm text-text-secondary">{lt('hub.emptyBody', '')}</p>
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

  const wizardHeader = (title: string, step: number, total: number) => (
    <div className="space-y-4">
      <div>
        <button
          type="button"
          onClick={exitToMode}
          className="mb-2 flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('common.back', 'Back')}
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {lt('common.step', 'Step')} {step} {lt('common.of', 'of')} {total}
        </p>
      </div>
      <WizardProgressBar step={step} total={total} />
    </div>
  )

  if (platform === 'meta') {
    const objectiveLabel = (id: MetaObjective) => {
      const map: Record<MetaObjective, string> = {
        leads: lt('meta.objLeads', 'Leads'),
        traffic: lt('meta.objTraffic', 'Traffic'),
        sales: lt('meta.objSales', 'Sales'),
        awareness: lt('meta.objAwareness', 'Awareness'),
      }
      return map[id]
    }

    const objectiveDesc = (id: MetaObjective) => {
      const map: Record<MetaObjective, string> = {
        leads: lt('meta.objLeadsDesc', ''),
        traffic: lt('meta.objTrafficDesc', ''),
        sales: lt('meta.objSalesDesc', ''),
        awareness: lt('meta.objAwarenessDesc', ''),
      }
      return map[id]
    }

    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        {wizardHeader(lt('meta.pageTitle', 'Meta campaign'), metaStep, 5)}
        {error ? <Alert variant="error">{error}</Alert> : null}

        {metaStep === 1 && (
          <WizardStepCard>
            <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] md:p-8">
              <div className="space-y-8">
                <div>
                  <label className="text-label font-medium text-text-secondary" htmlFor="meta-buying-type">
                    {lt('meta.buyingType', 'Buying type')}
                  </label>
                  <select
                    id="meta-buying-type"
                    disabled
                    className="mt-2 w-full cursor-not-allowed rounded-xl border border-border bg-surface-2/80 px-4 py-3 text-sm text-text-secondary"
                  >
                    <option>{lt('meta.buyingAuction', 'Auction')}</option>
                  </select>
                  <p className="mt-2 text-xs text-text-tertiary">{lt('meta.buyingHint', '')}</p>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{lt('meta.objectiveTitle', '')}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{lt('meta.objectiveSubtitle', '')}</p>
                  <div className="mt-5 space-y-2">
                    {metaObjectives.map((o) => (
                      <WizardChoiceRow
                        key={o.id}
                        tone="meta"
                        selected={metaData.objective === o.id}
                        onClick={() => setMetaData((d) => ({ ...d, objective: o.id }))}
                        icon={o.icon}
                        title={objectiveLabel(o.id)}
                        description={objectiveDesc(o.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <WizardAsideHint>{lt('meta.objectiveHint', '')}</WizardAsideHint>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
              <Button type="button" variant="ghost" size="md" onClick={exitToMode}>
                {lt('common.exitWizard', 'Exit')}
              </Button>
              <Button
                type="button"
                size="md"
                disabled={!metaData.objective}
                onClick={() => setMetaStep(2)}
                className="md:min-w-[160px]"
              >
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {metaStep === 2 && (
          <WizardStepCard>
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{lt('meta.audienceTitle', '')}</h2>
                <p className="mt-1 text-sm text-text-secondary">{lt('meta.audienceSubtitle', '')}</p>
              </div>
              <Input
                label={lt('meta.campaignName', 'Campaign name')}
                value={metaData.name}
                onChange={(e) => setMetaData((d) => ({ ...d, name: e.target.value }))}
                placeholder={lt('meta.campaignNamePh', '')}
              />
              <div>
                <p className="text-label mb-2 font-medium text-text-secondary">{lt('meta.ageLabel', 'Age')}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={13}
                    max={75}
                    value={metaData.minAge}
                    onChange={(e) => setMetaData((d) => ({ ...d, minAge: Number(e.target.value) }))}
                    className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                  />
                  <span className="text-text-tertiary">—</span>
                  <input
                    type="number"
                    min={13}
                    max={75}
                    value={metaData.maxAge}
                    onChange={(e) => setMetaData((d) => ({ ...d, maxAge: Number(e.target.value) }))}
                    className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                  />
                </div>
              </div>
              <div>
                <label className="text-label mb-2 block font-medium text-text-secondary" htmlFor="meta-loc">
                  {lt('meta.locationLabel', 'Location')}
                </label>
                <select
                  id="meta-loc"
                  value={metaData.location}
                  onChange={(e) => setMetaData((d) => ({ ...d, location: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                >
                  <option value="UZ">{lt('meta.locUZ', '')}</option>
                  <option value="KZ">{lt('meta.locKZ', '')}</option>
                  <option value="TJ">{lt('meta.locTJ', '')}</option>
                  <option value="TM">{lt('meta.locTM', '')}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setMetaStep(1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" disabled={!metaStepValid} onClick={() => setMetaStep(3)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {metaStep === 3 && (
          <WizardStepCard>
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{lt('meta.budgetTitle', '')}</h2>
                <p className="mt-1 text-sm text-text-secondary">{lt('meta.budgetSubtitle', '')}</p>
              </div>
              <div>
                <label className="text-label mb-2 block font-medium text-text-secondary" htmlFor="meta-daily">
                  {lt('meta.dailyUsd', 'Daily budget')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">$</span>
                  <input
                    id="meta-daily"
                    type="number"
                    min={1}
                    step={1}
                    value={metaData.dailyBudget}
                    onChange={(e) => setMetaData((d) => ({ ...d, dailyBudget: e.target.value }))}
                    placeholder="50"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                  />
                  <span className="text-xs text-text-tertiary">{lt('meta.perDay', '/ day')}</span>
                </div>
              </div>
              <div>
                <label className="text-label mb-2 block font-medium text-text-secondary" htmlFor="meta-dur">
                  {lt('meta.duration', 'Duration')}:{' '}
                  {lt('meta.durationDays', '{{n}} days').replace('{{n}}', String(metaData.campaignDuration))}
                </label>
                <input
                  id="meta-dur"
                  type="range"
                  min={1}
                  max={90}
                  value={metaData.campaignDuration}
                  onChange={(e) => setMetaData((d) => ({ ...d, campaignDuration: Number(e.target.value) }))}
                  className="mt-2 w-full accent-primary"
                />
                <p className="mt-2 text-xs text-text-tertiary">
                  {lt('meta.totalSpend', '').replace(
                    '{{amount}}',
                    formatMoneyUsd(
                      (parsePositiveNumber(metaData.dailyBudget) ?? 0) * metaData.campaignDuration,
                    ),
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setMetaStep(2)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" disabled={!metaStepValid} onClick={() => setMetaStep(4)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {metaStep === 4 && (
          <WizardStepCard>
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{lt('meta.creativeTitle', '')}</h2>
                <p className="mt-1 text-sm text-text-secondary">{lt('meta.creativeSubtitle', '')}</p>
              </div>
              <Input
                label={lt('meta.creativeUrl', 'URL')}
                value={metaData.creativeUrl}
                onChange={(e) => setMetaData((d) => ({ ...d, creativeUrl: e.target.value }))}
                placeholder="https://"
              />
              <div className="space-y-2">
                <label className="text-label font-medium text-text-secondary">{lt('meta.creativeText', '')}</label>
                <Textarea
                  value={metaData.creativeText}
                  onChange={(e) => setMetaData((d) => ({ ...d, creativeText: e.target.value }))}
                  placeholder="…"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-label mb-2 block font-medium text-text-secondary" htmlFor="meta-cta">
                  {lt('meta.ctaLabel', 'CTA')}
                </label>
                <select
                  id="meta-cta"
                  value={metaData.ctaButton}
                  onChange={(e) => setMetaData((d) => ({ ...d, ctaButton: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                >
                  <option value="learn_more">{lt('meta.cta_learn_more', '')}</option>
                  <option value="contact_us">{lt('meta.cta_contact', '')}</option>
                  <option value="shop_now">{lt('meta.cta_shop', '')}</option>
                  <option value="sign_up">{lt('meta.cta_signup', '')}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setMetaStep(3)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setMetaStep(5)}>
                {lt('common.review', 'Review')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {metaStep === 5 && (
          <WizardStepCard>
            <div className="space-y-6 p-6 md:p-8">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{lt('meta.reviewTitle', '')}</h2>
                <p className="mt-1 text-sm text-text-secondary">{lt('meta.reviewSubtitle', '')}</p>
              </div>
              <dl className="space-y-3 rounded-xl border border-border bg-surface-2/50 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('meta.revName', '')}</dt>
                  <dd className="max-w-[60%] text-right font-medium text-text-primary">{metaData.name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('meta.revObjective', '')}</dt>
                  <dd className="font-medium text-text-primary">
                    {metaData.objective ? objectiveLabel(metaData.objective) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('meta.revAudience', '')}</dt>
                  <dd className="font-medium text-text-primary">
                    {metaData.minAge}–{metaData.maxAge},{' '}
                    {
                      {
                        UZ: lt('meta.locUZ', ''),
                        KZ: lt('meta.locKZ', ''),
                        TJ: lt('meta.locTJ', ''),
                        TM: lt('meta.locTM', ''),
                      }[metaData.location]
                    }
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('meta.revBudget', '')}</dt>
                  <dd className="font-medium text-text-primary">${metaData.dailyBudget || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('meta.revDuration', '')}</dt>
                  <dd className="font-medium text-text-primary">
                    {lt('meta.durationDays', '').replace('{{n}}', String(metaData.campaignDuration))}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-3">
                  <dt className="text-text-tertiary">{lt('meta.revTotal', '')}</dt>
                  <dd className="text-base font-semibold text-text-primary">
                    {formatMoneyUsd(
                      (parsePositiveNumber(metaData.dailyBudget) ?? 0) * metaData.campaignDuration,
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setMetaStep(4)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('meta.edit', 'Edit')}
              </Button>
              <Button type="button" loading={saving} onClick={handleMetaLaunch} className="md:min-w-[200px]">
                {lt('common.launch', 'Publish')}
              </Button>
            </div>
          </WizardStepCard>
        )}
      </div>
    )
  }

  if (platform === 'google') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        {wizardHeader(lt('google.pageTitle', 'Google Ads'), googleStep, 5)}
        {error ? <Alert variant="error">{error}</Alert> : null}

        {googleStep === 1 && (
          <WizardStepCard>
            <div className="space-y-5 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('google.s1Title', '')}</h2>
              <div className="space-y-2">
                {(
                  [
                    { value: 'search' as const, title: lt('google.s1Search', ''), desc: lt('google.s1SearchDesc', '') },
                    { value: 'display' as const, title: lt('google.s1Display', ''), desc: lt('google.s1DisplayDesc', '') },
                    { value: 'smart' as const, title: lt('google.s1Smart', ''), desc: lt('google.s1SmartDesc', '') },
                  ] as const
                ).map((opt) => (
                  <WizardChoiceRow
                    key={opt.value}
                    selected={googleData.campaignType === opt.value}
                    onClick={() => setGoogleData((d) => ({ ...d, campaignType: opt.value }))}
                    icon={<Search className="h-5 w-5" aria-hidden />}
                    title={opt.title}
                    description={opt.desc}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={exitToMode}>
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setGoogleStep(2)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {googleStep === 2 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('google.s2Title', '')}</h2>
              <Textarea
                value={googleData.keywords}
                onChange={(e) => setGoogleData((d) => ({ ...d, keywords: e.target.value }))}
                placeholder={lt('google.s2Ph', '')}
                rows={5}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setGoogleStep(1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setGoogleStep(3)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {googleStep === 3 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('google.s3Title', '')}</h2>
              <Input
                value={googleData.headline1}
                onChange={(e) => setGoogleData((d) => ({ ...d, headline1: e.target.value }))}
                placeholder={lt('google.h1', '')}
              />
              <Input
                value={googleData.headline2}
                onChange={(e) => setGoogleData((d) => ({ ...d, headline2: e.target.value }))}
                placeholder={lt('google.h2', '')}
              />
              <Input
                value={googleData.headline3}
                onChange={(e) => setGoogleData((d) => ({ ...d, headline3: e.target.value }))}
                placeholder={lt('google.h3', '')}
              />
              <Textarea
                value={googleData.description1}
                onChange={(e) => setGoogleData((d) => ({ ...d, description1: e.target.value }))}
                placeholder={lt('google.d1', '')}
                rows={2}
              />
              <Textarea
                value={googleData.description2}
                onChange={(e) => setGoogleData((d) => ({ ...d, description2: e.target.value }))}
                placeholder={lt('google.d2', '')}
                rows={2}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setGoogleStep(2)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setGoogleStep(4)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {googleStep === 4 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('google.s4Title', '')}</h2>
              <Input
                type="number"
                min={1}
                label={lt('google.daily', '')}
                value={googleData.dailyBudget}
                onChange={(e) => setGoogleData((d) => ({ ...d, dailyBudget: e.target.value }))}
                placeholder="50"
              />
              <div>
                <label className="text-label mb-2 block font-medium text-text-secondary" htmlFor="g-bid">
                  {lt('google.bid', '')}
                </label>
                <select
                  id="g-bid"
                  value={googleData.biddingStrategy}
                  onChange={(e) => setGoogleData((d) => ({ ...d, biddingStrategy: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                >
                  <option value="target_cpa">{lt('google.bidTcpa', '')}</option>
                  <option value="maximize">{lt('google.bidMax', '')}</option>
                  <option value="manual">{lt('google.bidManual', '')}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setGoogleStep(3)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setGoogleStep(5)}>
                {lt('common.review', 'Review')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {googleStep === 5 && (
          <WizardStepCard>
            <div className="space-y-5 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('google.s5Title', '')}</h2>
              <dl className="space-y-2 rounded-xl border border-border bg-surface-2/50 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('google.revType', '')}</dt>
                  <dd className="font-medium">{googleData.campaignType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('google.revBudget', '')}</dt>
                  <dd className="font-medium">${googleData.dailyBudget || '—'}/day</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-tertiary">{lt('google.revAds', '')}</dt>
                  <dd className="max-w-[55%] text-right font-medium">{lt('google.revAdsVal', '')}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setGoogleStep(4)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('meta.edit', 'Edit')}
              </Button>
              <Button type="button" loading={saving} onClick={handleGoogleLaunch}>
                {lt('common.launch', 'Publish')}
              </Button>
            </div>
          </WizardStepCard>
        )}
      </div>
    )
  }

  if (platform === 'yandex') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        {wizardHeader(lt('yandex.pageTitle', 'Yandex'), yandexStep, 4)}
        {error ? <Alert variant="error">{error}</Alert> : null}

        {yandexStep === 1 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s1Title', '')}</h2>
              <div className="space-y-2">
                {(
                  [
                    { value: 'search' as const, title: lt('yandex.s1Search', ''), desc: lt('yandex.s1SearchDesc', '') },
                    { value: 'smart' as const, title: lt('yandex.s1Smart', ''), desc: lt('yandex.s1SmartDesc', '') },
                  ] as const
                ).map((opt) => (
                  <WizardChoiceRow
                    key={opt.value}
                    selected={yandexData.campaignType === opt.value}
                    onClick={() => setYandexData((d) => ({ ...d, campaignType: opt.value }))}
                    icon={<span className="text-sm font-bold text-[#FC3F1D]">Y</span>}
                    title={opt.title}
                    description={opt.desc}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={exitToMode}>
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setYandexStep(2)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {yandexStep === 2 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s2Title', '')}</h2>
              <Textarea
                value={yandexData.keywords}
                onChange={(e) => setYandexData((d) => ({ ...d, keywords: e.target.value }))}
                placeholder={lt('yandex.s2Ph', '')}
                rows={4}
              />
              <Textarea
                value={yandexData.negativeKeywords}
                onChange={(e) => setYandexData((d) => ({ ...d, negativeKeywords: e.target.value }))}
                placeholder={lt('yandex.s2NegPh', '')}
                rows={2}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setYandexStep(1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setYandexStep(3)}>
                {lt('common.continue', 'Continue')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {yandexStep === 3 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s3Title', '')}</h2>
              <Input
                value={yandexData.headline}
                onChange={(e) => setYandexData((d) => ({ ...d, headline: e.target.value }))}
                placeholder={lt('yandex.headline', '')}
              />
              <Textarea
                value={yandexData.description}
                onChange={(e) => setYandexData((d) => ({ ...d, description: e.target.value }))}
                placeholder={lt('yandex.desc', '')}
                rows={3}
              />
              <Input
                value={yandexData.url}
                onChange={(e) => setYandexData((d) => ({ ...d, url: e.target.value }))}
                placeholder={lt('yandex.url', '')}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setYandexStep(2)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('common.back', 'Back')}
              </Button>
              <Button type="button" onClick={() => setYandexStep(4)}>
                {lt('common.review', 'Review')}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </WizardStepCard>
        )}

        {yandexStep === 4 && (
          <WizardStepCard>
            <div className="space-y-4 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-text-primary">{lt('yandex.s4Title', '')}</h2>
              <Input
                type="number"
                min={1}
                label={lt('yandex.daily', '')}
                value={yandexData.dailyBudget}
                onChange={(e) => setYandexData((d) => ({ ...d, dailyBudget: e.target.value }))}
                placeholder="50"
              />
              <div>
                <label className="text-label mb-2 block font-medium text-text-secondary" htmlFor="y-str">
                  {lt('yandex.bid', '')}
                </label>
                <select
                  id="y-str"
                  value={yandexData.strategy}
                  onChange={(e) => setYandexData((d) => ({ ...d, strategy: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
                >
                  <option value="average_cpc">{lt('yandex.bidCpc', '')}</option>
                  <option value="highest_position">{lt('yandex.bidPos', '')}</option>
                  <option value="weekly_budget">{lt('yandex.bidWeek', '')}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 md:flex-row md:justify-between md:px-8">
              <Button type="button" variant="secondary" onClick={() => setYandexStep(3)}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {lt('meta.edit', 'Edit')}
              </Button>
              <Button type="button" loading={saving} onClick={handleYandexLaunch}>
                {lt('common.launch', 'Publish')}
              </Button>
            </div>
          </WizardStepCard>
        )}
      </div>
    )
  }

  return null
}
