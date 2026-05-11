'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, LayoutGrid, Search, Sparkles } from 'lucide-react'
import { Alert, Button, Input, Textarea } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { campaigns as campaignsApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { cn } from '@/lib/utils'
import { SectionCard } from './SectionCard'

type GoogleFormData = {
  name: string
  campaignType: 'search' | 'display' | 'smart'
  keywords: string
  headline1: string
  headline2: string
  headline3: string
  description1: string
  description2: string
  finalUrl: string
  dailyBudget: string
  biddingStrategy: 'target_cpa' | 'maximize' | 'manual'
}

const INITIAL: GoogleFormData = {
  name: '',
  campaignType: 'search',
  keywords: '',
  headline1: '',
  headline2: '',
  headline3: '',
  description1: '',
  description2: '',
  finalUrl: '',
  dailyBudget: '',
  biddingStrategy: 'target_cpa',
}

function parsePositiveNumber(v: string) {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function GoogleCampaignForm({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [data, setData] = useState<GoogleFormData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const lt = (path: string, fallback: string) => t(`launchWizard.${path}`, fallback)

  const types = useMemo(
    () => [
      {
        id: 'search' as const,
        icon: Search,
        title: lt('google.s1Search', 'Search'),
        desc: lt('google.s1SearchDesc', 'Text ads in Google search results.'),
      },
      {
        id: 'display' as const,
        icon: LayoutGrid,
        title: lt('google.s1Display', 'Display'),
        desc: lt('google.s1DisplayDesc', 'Banners on sites and apps.'),
      },
      {
        id: 'smart' as const,
        icon: Sparkles,
        title: lt('google.s1Smart', 'Smart'),
        desc: lt('google.s1SmartDesc', 'Automated optimization by Google.'),
      },
    ],
    [t],
  )

  const valid = {
    name: data.name.trim().length >= 2,
    keywords: data.keywords.trim().length > 0,
    adText: data.headline1.trim().length > 0 && data.description1.trim().length > 0,
    url: /^https?:\/\//i.test(data.finalUrl.trim()),
    budget: parsePositiveNumber(data.dailyBudget) !== null,
  }
  const allValid = valid.name && valid.keywords && valid.adText && valid.url && valid.budget

  const handleLaunch = async () => {
    setError('')
    if (!valid.budget) return setError(lt('meta.errorBudget', 'Enter a valid daily budget.'))
    setSaving(true)
    try {
      await campaignsApi.create(currentWorkspace?.id ?? '', {
        name: data.name.trim() || 'Google campaign',
        platform: 'google',
        objective: 'leads',
        dailyBudget: parsePositiveNumber(data.dailyBudget) ?? 0,
        totalBudget: (parsePositiveNumber(data.dailyBudget) ?? 0) * 30,
      })
      router.push('/campaigns')
    } catch (err: any) {
      setError(err?.message || 'Error creating campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('common.back', 'Back')}
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {lt('google.pageTitle', 'Google Ads campaign')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{lt('form.saved', 'All changes saved')}</p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <SectionCard
        title={lt('form.secName', 'Campaign name')}
        description={lt('form.secNameDesc', 'Internal name — visible only to you.')}
        complete={valid.name}
      >
        <Input
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          placeholder="Google: Brand search"
        />
      </SectionCard>

      <SectionCard
        title={lt('form.secCampaignType', 'Campaign type')}
        description={lt('form.secCampaignTypeDesc', 'Choose where ads should appear.')}
        complete
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {types.map((tp) => {
            const Icon = tp.icon
            const selected = data.campaignType === tp.id
            return (
              <button
                key={tp.id}
                type="button"
                onClick={() => setData((d) => ({ ...d, campaignType: tp.id }))}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                  selected
                    ? 'border-brand-mid/50 bg-brand-mid/[0.06] ring-1 ring-brand-mid/20 dark:border-brand-lime/40 dark:bg-brand-lime/10'
                    : 'border-border bg-surface hover:border-text-tertiary/40 hover:bg-surface-2/60',
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
                  <Icon className="h-4 w-4 text-text-secondary" />
                </span>
                <span className="text-sm font-semibold text-text-primary">{tp.title}</span>
                <span className="text-xs text-text-secondary">{tp.desc}</span>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={lt('form.secKeywords', 'Keywords')}
        description={lt('form.secKeywordsDesc', 'The ad runs when users search these terms.')}
        complete={valid.keywords}
      >
        <Textarea
          value={data.keywords}
          onChange={(e) => setData((d) => ({ ...d, keywords: e.target.value }))}
          placeholder={lt('google.s2Ph', 'One keyword per line…')}
          rows={5}
        />
      </SectionCard>

      <SectionCard
        title={lt('form.secAdText', 'Ad text')}
        description={lt('form.secAdTextDesc', 'Headlines and descriptions visible in search.')}
        complete={valid.adText}
      >
        <Input
          value={data.headline1}
          onChange={(e) => setData((d) => ({ ...d, headline1: e.target.value }))}
          placeholder={lt('google.h1', 'Headline 1')}
        />
        <Input
          value={data.headline2}
          onChange={(e) => setData((d) => ({ ...d, headline2: e.target.value }))}
          placeholder={lt('google.h2', 'Headline 2')}
        />
        <Input
          value={data.headline3}
          onChange={(e) => setData((d) => ({ ...d, headline3: e.target.value }))}
          placeholder={lt('google.h3', 'Headline 3')}
        />
        <Textarea
          value={data.description1}
          onChange={(e) => setData((d) => ({ ...d, description1: e.target.value }))}
          placeholder={lt('google.d1', 'Description 1')}
          rows={2}
        />
        <Textarea
          value={data.description2}
          onChange={(e) => setData((d) => ({ ...d, description2: e.target.value }))}
          placeholder={lt('google.d2', 'Description 2')}
          rows={2}
        />
      </SectionCard>

      <SectionCard
        title={lt('form.secLandingUrl', 'Landing URL')}
        description={lt('form.secLandingUrlDesc', 'The page users land on after clicking.')}
        complete={valid.url}
      >
        <Input
          type="url"
          value={data.finalUrl}
          onChange={(e) => setData((d) => ({ ...d, finalUrl: e.target.value }))}
          placeholder="https://"
        />
      </SectionCard>

      <SectionCard
        title={lt('form.secBudget', 'Budget and bid')}
        description={lt('form.secBidStrategyDesc', 'Choose how bids are managed.')}
        complete={valid.budget}
      >
        <Input
          type="number"
          min={1}
          label={lt('google.daily', 'Daily budget ($)')}
          value={data.dailyBudget}
          onChange={(e) => setData((d) => ({ ...d, dailyBudget: e.target.value }))}
          placeholder="50"
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary" htmlFor="g-bid">
            {lt('form.secBidStrategy', 'Bid strategy')}
          </label>
          <select
            id="g-bid"
            value={data.biddingStrategy}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                biddingStrategy: e.target.value as GoogleFormData['biddingStrategy'],
              }))
            }
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
          >
            <option value="target_cpa">{lt('google.bidTcpa', 'Target CPA')}</option>
            <option value="maximize">{lt('google.bidMax', 'Maximize conversions')}</option>
            <option value="manual">{lt('google.bidManual', 'Manual')}</option>
          </select>
        </div>
      </SectionCard>

      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur dark:bg-surface-elevated/95 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lt('common.back', 'Back')}
        </Button>
        <Button
          type="button"
          loading={saving}
          disabled={!allValid || saving}
          onClick={handleLaunch}
          className="sm:min-w-[200px]"
        >
          {lt('common.launch', 'Publish')}
        </Button>
      </div>
    </div>
  )
}
