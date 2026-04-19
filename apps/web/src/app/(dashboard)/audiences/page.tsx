'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'

type FunnelStage = 'acquisition' | 'reengagement' | 'retargeting' | 'retention'

type AudienceCard = {
  id: string
  name: string
  description: string
  stage: FunnelStage
  tags: string[]
  ai?: boolean
}

const STAGES: Array<{ id: FunnelStage; label: string }> = [
  { id: 'acquisition', label: 'Acquisition Prospecting' },
  { id: 'reengagement', label: 'Acquisition Re-Engagement' },
  { id: 'retargeting', label: 'Retargeting' },
  { id: 'retention', label: 'Retention' },
]

const ALL_STAGES_SET = new Set<FunnelStage>(STAGES.map((s) => s.id))

const STAGE_SECTION: Record<
  FunnelStage,
  { dot: string; titleKey: string; titleFb: string; blurbKey: string; blurbFb: string }
> = {
  acquisition: {
    dot: 'bg-primary',
    titleKey: 'audiences.sectionAcquisitionTitle',
    titleFb: 'Acquisition prospecting',
    blurbKey: 'audiences.sectionAcquisitionBlurb',
    blurbFb: 'Cold audiences and lookalikes for scale testing.',
  },
  reengagement: {
    dot: 'bg-brand-mid',
    titleKey: 'audiences.sectionReengagementTitle',
    titleFb: 'Acquisition re-engagement',
    blurbKey: 'audiences.sectionReengagementBlurb',
    blurbFb: 'Warm users who already had a first touch with your brand.',
  },
  retargeting: {
    dot: 'bg-text-tertiary',
    titleKey: 'audiences.sectionRetargetingTitle',
    titleFb: 'Retargeting',
    blurbKey: 'audiences.sectionRetargetingBlurb',
    blurbFb: 'Site visitors and intent signals worth bringing back.',
  },
  retention: {
    dot: 'bg-brand-lime',
    titleKey: 'audiences.sectionRetentionTitle',
    titleFb: 'Retention',
    blurbKey: 'audiences.sectionRetentionBlurb',
    blurbFb: 'Existing customers to upsell, cross-sell, or reactivate.',
  },
}

function AudienceVisual({ tags }: { tags: string[] }) {
  const t = tags.join(' ').toLowerCase()
  if (t.includes('lookalike')) return <span className="text-2xl leading-none">◎</span>
  if (t.includes('video')) return <span className="text-2xl leading-none">▶</span>
  if (t.includes('visitor') || t.includes('retarget')) return <span className="text-2xl leading-none">↻</span>
  return <span className="text-2xl leading-none">👥</span>
}

const AUDIENCES: AudienceCard[] = [
  { id: 'super-lookalike', name: 'Super lookalike', description: 'Top-performing audience lookalikes combination.', stage: 'acquisition', tags: ['Lookalike', 'Prospecting'], ai: true },
  { id: 'video-addicts-lal', name: 'Video Addicts lookalike', description: 'Lookalike from users who watched 95% videos.', stage: 'acquisition', tags: ['Video', 'Lookalike'] },
  { id: 'ios-high-intent', name: 'High-intent iOS users', description: 'Lookalike of high-intent iOS visitors/customers.', stage: 'acquisition', tags: ['iOS', 'High Intent'], ai: true },
  { id: 'android-high-intent', name: 'High-intent Android users', description: 'Lookalike of high-intent Android visitors/customers.', stage: 'acquisition', tags: ['Android', 'High Intent'] },
  { id: 'top-url', name: 'Top-URL purchaser lookalike', description: 'Lookalike of users who visited high-value URLs and purchased.', stage: 'acquisition', tags: ['Top URL', 'Purchasers'] },
  { id: 'deep-browser', name: 'Deep browsers lookalike', description: 'Lookalike of users spending 8+ minutes on site.', stage: 'acquisition', tags: ['Behavioral', 'Lookalike'] },
  { id: 'social-engagers', name: 'Social media engagers', description: 'Instagram/Facebook engagers, page visitors and fans.', stage: 'reengagement', tags: ['Social', 'Engagers'] },
  { id: 'video-addicts', name: 'Video Addicts', description: 'Users who watched 95% of one of your videos.', stage: 'reengagement', tags: ['Video', 'Warm'] },
  { id: 'ad-watchers', name: 'Ad viewers (3 sec)', description: 'Users who watched 3+ seconds of your video ads.', stage: 'reengagement', tags: ['Video Ads', 'Warm'] },
  { id: 'all-visitors-30', name: 'All visitors (last 30 days)', description: 'Everyone who visited website in last 30 days.', stage: 'retargeting', tags: ['Visitors', '30d'] },
  { id: 'high-intent-30', name: 'High-intent visitors (last 30 days)', description: 'Visitors showing high buying intent in last 30 days.', stage: 'retargeting', tags: ['High Intent', '30d'] },
  { id: 'custom-recency', name: 'Custom recency visitors', description: 'Build 0-3 and 3-30 day recency audiences.', stage: 'retargeting', tags: ['Recency', 'Custom'] },
  { id: 'multi-visits', name: 'Multiple visits', description: 'Users with at least 3 visits in last 30 days.', stage: 'retargeting', tags: ['Frequency', 'Visitors'] },
  { id: 'basic-retention', name: 'Basic retention (180 days)', description: 'Customers who purchased in previous 180 days.', stage: 'retention', tags: ['Customers', '180d'] },
  { id: 'fresh-customers', name: 'Fresh customers (10 days)', description: 'Recent customers from last 10 days.', stage: 'retention', tags: ['Customers', '10d'] },
  { id: 'reactivation', name: 'Reactivation (60-180 days)', description: 'Past customers from 60-180 days for reactivation.', stage: 'retention', tags: ['Reactivation', '60-180d'] },
]

const PREBUILT_LIBRARY: Record<string, string[]> = {
  'Acquisition prospecting': [
    'Infrequent/Occasional/Frequent silver-gold-platinum customer lookalikes',
    'Low/medium/high AOV visitors with low/high intent (infrequent/occasional/frequent)',
    'Category-specific purchaser lookalikes',
    'Category-specific low/high-intent visitor lookalikes',
    'Facebook/Instagram fans lookalike',
    'Video casuals/enthusiasts/addicts lookalike',
    '10-sec ad watcher lookalike',
    'Website lead lookalike',
    'Super lookalike',
    'High-intent Android/iOS users',
    'Top-URL low/high-intent visitor lookalike',
    'Top-URL purchaser lookalike',
    'Interest targeting & audience mixes',
    'Broad targeting',
    'Deep browsers / medium-length browsers lookalike',
    'Top-event lookalike',
  ],
  'Acquisition re-engagement': [
    'Video casuals / enthusiasts / addicts',
    'Ad watchers (3+ sec)',
    'Instagram/Facebook fans',
    'Collection & Instant Experience ad engagers',
  ],
  Retargeting: [
    'All visitors last 30 days',
    'High-intent visitors last 30 days',
    'All visitors 30-180 days',
    'High-intent visitors 30-180 days',
    'All / high-intent custom recency visitors',
    'Multiple visits (3+ in last 30d)',
    'Deep browsers / medium-length browsers',
    'Category-specific medium/high intent',
    'Top URL low/high-intent visitors',
    'Website leads',
    'Top events',
  ],
  Retention: [
    'Basic retention (180 days)',
    'Fresh customers (10 days)',
    'Custom recency purchasers',
    'Reactivation (60-180 days)',
    'Top-URL purchasers',
    'Category-specific purchasers',
  ],
}

const STAGE_LIBRARY_KEY: Record<FunnelStage, keyof typeof PREBUILT_LIBRARY> = {
  acquisition: 'Acquisition prospecting',
  reengagement: 'Acquisition re-engagement',
  retargeting: 'Retargeting',
  retention: 'Retention',
}

const FULL_FUNNEL_RECOMMENDATIONS: Array<{
  title: string
  intro?: string
  points: string[]
}> = [
  {
    title: 'Strategic caveat (important)',
    intro:
      "76 ta audience mavjud bo'lsa ham, hammasini birdan launch qilmang. Bu “menu strategy”: bosqichma-bosqich test qiling, budgetni tarqatib yubormang.",
    points: [
      'Har funnel bosqichida 2-4 ta eng kuchli audience bilan boshlang.',
      "Winner topilgach keyingi audience'larni qo'shib boring.",
      "Budget va frequency nazorat qilinmasa tezda ad fatigue paydo bo'ladi.",
    ],
  },
  {
    title: 'Acquisition prospecting — what usually wins',
    intro: "Winning audience har doim 2 omilga bog'liq: Quality + Quantity.",
    points: [
      'Lookalike of Video Addicts (95% watchers).',
      "Agar 95% yetarli bo'lmasa: Video Enthusiasts (75%) yoki Video Casuals (50%).",
      'Super lookalike (top-performing audience kombinatsiyasi).',
      'Niche prospecting from top URLs (eng muhim sahifalar visitorlari).',
      "Interest targeting & audience mixes (studio'da tayyorlangan interest setlar).",
      'Broad targeting (pixel data kuchli accountlar uchun).',
    ],
  },
  {
    title: 'Acquisition re-engagement',
    points: [
      'Video Addicts / Enthusiasts / Casuals.',
      'Social Media Engagers (FB/IG page/ad engagement).',
      "Ad Viewers (kamida 3 soniya video ko'rganlar).",
    ],
  },
  {
    title: 'Retargeting best practice',
    intro:
      "72 soat “hot window”: user saytingizga kirgandan keyin 1-3 marta/kun ko'rsatish odatda eng yaxshi natija beradi.",
    points: [
      'Custom recency visitors 0-3 days (aggressive retargeting).',
      'Custom recency visitors 3-30 days (frequencyni pasaytirib).',
      "30-180 day cohort'larni alohida campaign/ad setlarda tekshirish.",
    ],
  },
  {
    title: 'Retention strategy',
    points: [
      'Basic retention (180 days) — recurring purchase businesslar uchun start nuqta.',
      'Fresh customers (10 days) — upsell/cross-sell.',
      'Reactivation (60-180 days) — qayta faollashtirish.',
    ],
  },
]

const ERFM_EXPLAINER = [
  'eRFM = engagement + recency + frequency + monetary value modeli.',
  'Order value segmentlari: Silver/Low, Gold/Medium, Platinum/High.',
  'Frequency segmentlari: Infrequent/Low, Occasional/Medium, Frequent/High.',
  'AI ushbu segmentlarni Meta pixel signaliga uzatib lookalike sifatini oshiradi.',
]

const TARGET_NETWORKS = [
  'Meta / Facebook',
  'Google Ads',
  'Yandex Direct',
  'TikTok Ads',
  'LinkedIn Ads',
  'Snapchat Ads',
  'X Ads',
  'Pinterest Ads',
  'DV360',
  'va boshqa tarmoqlar',
]

const IMPLEMENTATION_CHECKLIST: Array<{ module: string; items: string[] }> = [
  { module: 'Core', items: ['login/register', 'org/workspace/team', 'RBAC', 'billing', 'audit logs'] },
  {
    module: 'Integrations',
    items: ['Meta Ads', 'Google Ads', 'Yandex Direct', 'TikTok Ads', 'LinkedIn Ads', 'Snapchat Ads', 'Pinterest Ads', 'X Ads', 'GA4', 'Shopify/CRM'],
  },
  {
    module: 'Sync engine',
    items: ['OAuth', 'token refresh', 'scheduled/incremental sync', 'backfill', 'webhooks', 'retry/error monitoring'],
  },
  {
    module: 'Reporting + Metrics',
    items: ['overview dashboard', 'drill-down reports', 'custom reports', 'exports', 'scheduled reports', 'ROAS/CPA/CTR/CPM/CPC/LTV/funnel metrics'],
  },
  {
    module: 'Automation + AI',
    items: ['rules', 'budget/bid changes', 'alerts', 'recommendations', 'anomaly detection', 'forecasting', 'AI analyst chat'],
  },
]

export default function AudiencesPage() {
  const { t } = useI18n()
  const [enabledStages, setEnabledStages] = useState<Set<FunnelStage>>(
    () => new Set<FunnelStage>(['acquisition', 'reengagement', 'retargeting', 'retention']),
  )
  const [subMenuStage, setSubMenuStage] = useState<FunnelStage | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [splitByFunnel, setSplitByFunnel] = useState(true)
  const [budgetType, setBudgetType] = useState<'CBO' | 'ABO'>('CBO')
  const [objective, setObjective] = useState('Sales')
  const [campaignName, setCampaignName] = useState('AdSpectr - Acquisition Prospecting - Master Campaign')
  const [rowType, setRowType] = useState<'New' | 'Existing'>('New')

  const effectiveStages = enabledStages.size === 0 ? ALL_STAGES_SET : enabledStages

  const filtered = useMemo(() => {
    return AUDIENCES.filter((a) => {
      const byStage = effectiveStages.has(a.stage)
      const byQuery =
        query.trim() === '' ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      return byStage && byQuery
    })
  }, [effectiveStages, query])

  const primaryStage =
    (STAGES.map((s) => s.id).find((id) => effectiveStages.has(id)) as FunnelStage | undefined) ?? 'acquisition'
  const section = STAGE_SECTION[primaryStage]

  function toggleStage(id: FunnelStage) {
    setEnabledStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAudience = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAllInView = () => {
    const ids = filtered.map((item) => item.id)
    setSelected((prev) => {
      const hasAll = ids.every((id) => prev.includes(id))
      if (hasAll) return prev.filter((id) => !ids.includes(id))
      return Array.from(new Set([...prev, ...ids]))
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('navigation.audiences', 'Audiences')}
        subtitle={t('audiences.subtitle', 'Build full-funnel audience sets and launch them consistently')}
        actions={
          <Link
            href="/audiences/studio"
            className="inline-flex items-center justify-center rounded-xl border border-primary/35 bg-surface px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {t('audiences.openStudio', 'Audience Studio')}
          </Link>
        }
      />
      <div className="min-h-full overflow-hidden rounded-2xl border border-border bg-surface text-text-secondary shadow-sm dark:bg-surface-elevated">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-text-primary">{t('audiences.launcherTitle', 'Audience Launcher')}</h2>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium tabular-nums text-text-secondary">
              {selected.length} {t('audiences.selectedCount', 'selected')}
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-xs text-text-tertiary">
            {t('audiences.launcherSubtitle', 'AdSpectr full-funnel targeting strategy with an optimized workflow for maximum ROAS.')}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-brand-ink disabled:opacity-40 dark:text-brand-ink"
          disabled={selected.length === 0}
        >
          {t('common.next', 'Next')}
        </button>
      </div>

      <div className="p-5 space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for audience..."
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary md:max-w-sm dark:bg-surface"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {STAGES.map((stage) => {
              const on = enabledStages.has(stage.id)
              const lib = PREBUILT_LIBRARY[STAGE_LIBRARY_KEY[stage.id]] ?? []
              return (
                <div key={stage.id} className="relative rounded-lg border border-border bg-surface-2 dark:bg-surface">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleStage(stage.id)}
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                    <span className={`flex-1 text-sm font-medium ${on ? 'text-text-primary' : 'text-text-tertiary'}`}>{stage.label}</span>
                    <button
                      type="button"
                      onClick={() => setSubMenuStage((s) => (s === stage.id ? null : stage.id))}
                      className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface hover:text-text-primary dark:hover:bg-surface-2"
                      aria-expanded={subMenuStage === stage.id}
                      aria-label={t('audiences.toggleSubtypes', 'Show template list')}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${subMenuStage === stage.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {subMenuStage === stage.id && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-primary/25 bg-surface p-2 shadow-lg dark:border-border dark:bg-surface-elevated">
                      {lib.slice(0, 10).map((line) => (
                        <label
                          key={line}
                          className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2 dark:hover:bg-surface-2"
                        >
                          <input type="checkbox" className="mt-0.5 rounded border-border" readOnly tabIndex={-1} />
                          <span className="text-[11px] leading-snug text-text-secondary">{line}</span>
                        </label>
                      ))}
                      {lib.length > 10 && (
                        <p className="text-[10px] text-text-tertiary px-2 py-1">+{lib.length - 10} more…</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-2 w-2 rounded-full shrink-0 ${section.dot}`} aria-hidden />
              <div>
                <p className="text-sm font-semibold text-text-primary">{t(section.titleKey, section.titleFb)}</p>
                <p className="max-w-xl text-xs text-text-secondary">{t(section.blurbKey, section.blurbFb)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={selectAllInView}
              className="rounded-lg border border-primary/35 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-primary dark:bg-surface"
            >
              Select all in this view
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((audience) => {
              const active = selected.includes(audience.id)
              return (
                <button
                  key={audience.id}
                  onClick={() => toggleAudience(audience.id)}
                  className={`flex flex-col rounded-xl border p-4 text-left transition ${
                    active
                      ? 'border-primary bg-surface-2 ring-1 ring-primary/20 dark:bg-surface'
                      : 'border-border bg-surface hover:border-primary/35 dark:bg-surface-2'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2 text-[10px] text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-border" />0 created
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-border" />0 live
                      </span>
                    </div>
                    <span
                      className={`h-4 w-4 shrink-0 rounded border ${active ? 'border-primary bg-primary' : 'border-border'}`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-2 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-surface-2 text-primary dark:bg-surface">
                      <AudienceVisual tags={audience.tags} />
                    </div>
                    <p className="w-full text-sm font-semibold text-text-primary">{audience.name}</p>
                    <p className="line-clamp-3 text-xs leading-relaxed text-text-secondary">{audience.description}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {audience.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] text-text-secondary dark:bg-surface"
                        >
                          {tag}
                        </span>
                      ))}
                      {audience.ai && (
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          AI
                        </span>
                      )}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-text-tertiary" aria-hidden>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-2 dark:bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-medium text-text-primary">Campaign Set Up</p>
            <span className="text-xs text-text-tertiary">Step 1 of 4</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-text-tertiary" aria-hidden>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="font-medium text-text-primary">Where to launch Facebook ad sets:</span>
            </div>

            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setSplitByFunnel(true)
                  setRowType('New')
                }}
                className={`px-3 py-2 text-xs ${splitByFunnel ? 'bg-primary/15 font-medium text-text-primary' : 'bg-surface text-text-tertiary'}`}
              >
                Split campaigns per funnel stage
              </button>
              <button
                type="button"
                onClick={() => {
                  setSplitByFunnel(false)
                  setRowType('Existing')
                }}
                className={`px-3 py-2 text-xs ${!splitByFunnel ? 'bg-primary/15 font-medium text-text-primary' : 'bg-surface text-text-tertiary'}`}
              >
                Launch all ad sets to one campaign
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-[920px] w-full text-left text-xs">
                <thead className="bg-surface-2 text-[11px] uppercase tracking-wide text-text-tertiary dark:bg-surface">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold w-14">Audiences</th>
                    {splitByFunnel && <th className="px-3 py-2.5 font-semibold min-w-[200px]">Funnel stage</th>}
                    <th className="px-3 py-2.5 font-semibold w-24">Type</th>
                    <th className="px-3 py-2.5 font-semibold min-w-[240px]">Campaign name</th>
                    <th className="px-3 py-2.5 font-semibold w-36">Campaign Objective</th>
                    <th className="px-3 py-2.5 font-semibold w-28">Budget type</th>
                    <th className="px-3 py-2.5 font-semibold min-w-[160px]">Campaign Budget</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border align-top">
                    <td className="px-3 py-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-surface-2 text-[11px] font-bold text-text-primary dark:bg-surface">
                        {Math.max(1, selected.length)}
                      </span>
                    </td>
                    {splitByFunnel && (
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          <span className="text-[11px] leading-snug text-text-secondary">
                            {STAGES.find((s) => s.id === primaryStage)?.label ?? 'Acquisition'} Lookalike Campaign
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="inline-flex rounded-md border border-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setRowType('New')}
                          className={`px-2 py-1 text-[10px] font-semibold ${rowType === 'New' ? 'bg-primary/15 text-text-primary' : 'bg-surface text-text-tertiary'}`}
                        >
                          New
                        </button>
                        <button
                          type="button"
                          onClick={() => setRowType('Existing')}
                          className={`px-2 py-1 text-[10px] font-semibold ${rowType === 'Existing' ? 'bg-primary/15 text-text-primary' : 'bg-surface text-text-tertiary'}`}
                        >
                          Existing
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {rowType === 'Existing' ? (
                        <select className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-[11px] text-text-secondary">
                          <option value="">Select Facebook Campaign…</option>
                          <option>AA-Лиды-Fikr yetakchilari-09.04.2026</option>
                          <option>Prospecting / Advantage+ shopping</option>
                          <option>Retargeting — 30d visitors</option>
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            value={campaignName}
                            maxLength={128}
                            onChange={(e) => setCampaignName(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-2 py-2 pr-14 text-[11px]"
                            placeholder="Campaign name"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary tabular-nums">
                            {campaignName.length}/128
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-[11px]"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                      >
                        <option>Sales</option>
                        <option>Leads</option>
                        <option>Traffic</option>
                        <option>Engagement</option>
                        <option>Awareness</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex rounded-md border border-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setBudgetType('CBO')}
                          className={`px-2 py-1 text-[10px] font-semibold ${budgetType === 'CBO' ? 'bg-primary/15 text-text-primary' : 'bg-surface text-text-tertiary'}`}
                        >
                          CBO
                        </button>
                        <button
                          type="button"
                          onClick={() => setBudgetType('ABO')}
                          className={`px-2 py-1 text-[10px] font-semibold ${budgetType === 'ABO' ? 'bg-primary/15 text-text-primary' : 'bg-surface text-text-tertiary'}`}
                        >
                          ABO
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-text-tertiary leading-snug">
                      Budget is set on ad set level
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => {
                setRowType('New')
                setCampaignName(`AdSpectr - New campaign ${new Date().toLocaleDateString()}`)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-transparent px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <span className="text-base leading-none">+</span>
              Create New Campaign
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface-2 p-4 dark:bg-surface">
          <div className="flex items-center justify-between">
            <p className="font-medium text-text-primary">Select the Ad Creatives</p>
            <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-brand-ink">
              Save Changes
            </button>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-text-tertiary mb-2">Your selected audiences</p>
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 ? (
                <span className="text-xs text-text-tertiary">{t('audiences.noAudienceSelected', 'No audience selected yet.')}</span>
              ) : (
                selected.map((id) => {
                  const item = AUDIENCES.find((a) => a.id === id)
                  return (
                    <span key={id} className="rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text-secondary dark:bg-surface">
                      {item?.name}
                    </span>
                  )
                })
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-lg border border-border bg-surface p-2">
                <div className="mb-2 aspect-[4/5] rounded bg-surface-2 dark:bg-surface" />
                <p className="text-xs text-text-tertiary">Creative #{n}</p>
                <p className="text-[11px] text-text-tertiary mt-1">ROAS, CTR, thumb-stop va spend metrikalari bo'yicha saralash.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface-2 p-4 dark:bg-surface">
          <div className="flex items-center justify-between">
            <p className="font-medium text-text-primary">Set Up the Audiences</p>
            <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-brand-ink">
              Save Changes
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Choose Locations</p>
              <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option>Worldwide</option>
                <option>Uzbekistan</option>
                <option>Kazakhstan</option>
                <option>Custom selection</option>
              </select>
              <p className="text-xs text-text-tertiary">Language, geo va exclusionlarni alohida saqlash mumkin.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Recency</p>
              <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option>0-180 days</option>
                <option>0-3 days</option>
                <option>3-30 days</option>
                <option>30-180 days</option>
              </select>
              <p className="text-xs text-text-tertiary">0-3 kun “hot window”, 3-30 kun esa pastroq frequency bilan.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Lookalike percentage</p>
              <input type="range" min={1} max={20} defaultValue={5} className="w-full" />
              <p className="text-xs text-text-tertiary">Tavsiya: 0-5% dan boshlang, keyin scale qiling.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium">Conversion + Budget</p>
              <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <option>Purchase</option>
                <option>Add to Cart</option>
                <option>Lead</option>
              </select>
              <input className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" defaultValue="USD 10 / day" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-surface-2 p-4 dark:bg-surface">
          <div className="flex items-center justify-between">
            <p className="font-medium text-text-primary">Summary & Launch</p>
            <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-brand-ink">
              Launch
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-text-tertiary text-xs mb-1">When to launch</p>
              <p>Launch now yoki schedule (midnight / custom time).</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-text-tertiary text-xs mb-1">Naming structure</p>
              <p>Account label + Audience + Placement + Age + Gender + Location.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-2 p-4 dark:bg-surface">
          <h3 className="mb-3 text-base font-semibold text-text-primary">Target multi-network scope</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {TARGET_NETWORKS.map((network) => (
              <span
                key={network}
                className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-text-secondary dark:bg-surface"
              >
                {network}
              </span>
            ))}
          </div>

          <h3 className="mb-3 text-base font-semibold text-text-primary">Winning audiences playbook (to'liq)</h3>
          <p className="mb-3 text-sm text-text-secondary">
            Asosiy prinsip: 76 ta preset bor, lekin hammasini birdan ishga tushirmang. Restaurant menyusi kabi — eng kuchli kombinatsiyalarni bosqichma-bosqich test qiling.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Object.entries(PREBUILT_LIBRARY).map(([title, items]) => (
              <div key={title} className="rounded-lg border border-border p-3">
                <p className="font-medium text-sm mb-2">{title}</p>
                <ul className="list-inside list-disc space-y-1.5 text-xs text-text-tertiary">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-sm font-medium mb-2">AdSpectr vs Facebook Ads Manager (nima uchun bu section kerak)</p>
            <ul className="grid grid-cols-1 gap-2 text-xs text-text-tertiary md:grid-cols-2">
              <li>• AdSpectr'da preset audiences va exclusionlar oldindan beriladi.</li>
              <li>• AI lookalike segmentlar bilan sifat + hajm balansini yaxshilaydi.</li>
              <li>• Funnel stage'larni kampaniyalarga alohida ajratish osonlashadi.</li>
              <li>• Creative picker performance ma'lumotlari bilan ishlaydi.</li>
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-sm font-medium mb-2">eRFM model (detal)</p>
            <ul className="list-inside list-disc space-y-1.5 text-xs text-text-tertiary">
              {ERFM_EXPLAINER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-3">
            {FULL_FUNNEL_RECOMMENDATIONS.map((section) => (
              <div key={section.title} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{section.title}</p>
                {section.intro && <p className="mt-1 text-xs text-text-secondary">{section.intro}</p>}
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-text-tertiary">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-sm font-medium mb-3">Platform implementation checklist (kerakli qismlar)</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {IMPLEMENTATION_CHECKLIST.map((group) => (
                <div key={group.module} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium mb-2">{group.module}</p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-text-tertiary">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
    </div>
  )
}
