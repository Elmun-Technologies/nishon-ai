'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Compass, Filter, RefreshCw, Search, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { meta as metaApi } from '@/lib/api-client'
import { daysBetweenInclusive } from '@/lib/date-range'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { PageHeader, Button, Dialog, Alert } from '@/components/ui'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

type AuditTab = 'meta' | 'targeting' | 'auction' | 'geo' | 'creative' | 'adcopy'

const TAB_IDS: AuditTab[] = ['meta', 'targeting', 'auction', 'geo', 'creative', 'adcopy']

const CREATIVE_FORMATS = [
  { id: 'image', labelKey: 'metaAudit.formatImage', fallback: 'Image', icon: '🖼' },
  { id: 'short', labelKey: 'metaAudit.formatShortVideo', fallback: 'Short Video', icon: '▶' },
  { id: 'medium', labelKey: 'metaAudit.formatMediumVideo', fallback: 'Medium Video', icon: '▶▶' },
  { id: 'long', labelKey: 'metaAudit.formatLongVideo', fallback: 'Long Video', icon: '▶▶▶' },
  { id: 'carousel', labelKey: 'metaAudit.formatCarousel', fallback: 'Carousel', icon: '◫' },
  { id: 'dpa', labelKey: 'metaAudit.formatDpa', fallback: 'DPA', icon: '⊞' },
] as const

const FORMAT_STATS: Record<string, { spend: number; cpl: number; ctr: number; conv: number }> = {
  image: { spend: 1240, cpl: 4.2, ctr: 1.85, conv: 2.1 },
  short: { spend: 980, cpl: 5.1, ctr: 2.4, conv: 1.6 },
  medium: { spend: 720, cpl: 6.3, ctr: 1.9, conv: 1.2 },
  long: { spend: 540, cpl: 7.8, ctr: 1.4, conv: 0.9 },
  carousel: { spend: 1580, cpl: 3.6, ctr: 2.1, conv: 2.8 },
  dpa: { spend: 2100, cpl: 3.1, ctr: 2.6, conv: 3.2 },
}

const MOCK_CAMPAIGNS = [
  { id: 'c1', name: 'Prospecting — Catalog sales', spend: 4200, roas: 2.4, status: 'Active' },
  { id: 'c2', name: 'Retargeting — 30d visitors', spend: 1890, roas: 3.8, status: 'Active' },
  { id: 'c3', name: 'Lead gen — Instant form', spend: 960, roas: 1.2, status: 'Limited' },
  { id: 'c4', name: 'ASC — Advantage+ shopping', spend: 6120, roas: 2.9, status: 'Active' },
]

const MOCK_TARGETING = [
  { id: 't1', segment: 'Broad + Advantage+', health: 88, note: 'Stable CPM' },
  { id: 't2', segment: 'Lookalike 1% purchasers', health: 76, note: 'Watch frequency' },
  { id: 't3', segment: 'Engaged shoppers 30d', health: 64, note: 'Overlap with retargeting' },
]

const MOCK_AUCTION = [
  { key: 'overlap', labelKey: 'metaAudit.overlap', fb: 'Audience overlap', value: 62 },
  { key: 'delivery', labelKey: 'metaAudit.delivery', fb: 'Delivery stability', value: 78 },
  { key: 'competition', labelKey: 'metaAudit.competition', fb: 'Competition index', value: 54 },
]

const MOCK_GEO = [
  { region: 'Tashkent city', share: 34, spend: 1280 },
  { region: 'Regions', share: 41, spend: 1540 },
  { region: 'Samarkand', share: 12, spend: 450 },
  { region: 'Other', share: 13, spend: 490 },
]

const MOCK_COPY = [
  { id: 'cp1', headline: 'Free shipping today', body: 'Order before midnight…', ctr: 2.1, leads: 48 },
  { id: 'cp2', headline: 'Last units in stock', body: 'Tap to see sizes…', ctr: 1.7, leads: 31 },
  { id: 'cp3', headline: 'New collection drop', body: 'Video + carousel bundle…', ctr: 2.4, leads: 56 },
]

const VIEW_STORAGE = 'meta-audit-saved-view-v1'

type KpiMode = 'roas' | 'leads' | 'spend' | 'ctr' | 'clicks'

interface CampaignMetrics {
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
}

interface ReportCampaign {
  id: string
  name: string
  status: string
  objective: string | null
  metrics: CampaignMetrics
}

interface ReportAccount {
  id: string
  name: string
  currency: string
  campaigns: ReportCampaign[]
}

interface ReportData {
  workspaceId: string
  days: number
  accounts: ReportAccount[]
}

interface LiveCampaignRow {
  id: string
  name: string
  status: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  accountName: string
  currency: string
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-400/10',
  PAUSED: 'text-amber-400 bg-amber-400/10',
  DELETED: 'text-red-400 bg-red-400/10',
  ARCHIVED: 'text-text-tertiary bg-surface-2',
}

function daysForDateRange(
  range: '7' | '30' | 'month' | 'custom',
  fromDate?: string,
  toDate?: string,
): number {
  if (range === '7') return 7
  if (range === '30') return 30
  if (range === 'custom') {
    const d = daysBetweenInclusive(fromDate ?? '', toDate ?? '')
    return d ?? 7
  }
  const d = new Date()
  return Math.max(1, d.getDate())
}

function tpl(template: string, vars: Record<string, string | number>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v))
  }
  return out
}

function flattenReportData(data: ReportData): LiveCampaignRow[] {
  const rows: LiveCampaignRow[] = []
  for (const a of data.accounts) {
    const currency = a.currency || 'USD'
    for (const c of a.campaigns) {
      rows.push({
        id: c.id,
        name: c.name,
        status: c.status,
        spend: c.metrics.spend,
        clicks: c.metrics.clicks,
        impressions: c.metrics.impressions,
        ctr: c.metrics.ctr,
        cpc: c.metrics.cpc,
        accountName: a.name,
        currency,
      })
    }
  }
  return rows
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

function computeAuditFindings(
  rows: LiveCampaignRow[],
  t: (key: string, def: string) => string,
): { facts: string[]; risks: string[]; actions: string[] } {
  const facts: string[] = []
  const risks: string[] = []
  const actions: string[] = []
  if (!rows.length) return { facts, risks, actions }

  const currency = rows[0]?.currency ?? 'USD'
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0)
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)
  const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  facts.push(
    tpl(t('metaAudit.factTotalSpend', 'Total spend in period: {{amount}}.'), {
      amount: formatCurrency(totalSpend, currency),
    }),
  )
  facts.push(tpl(t('metaAudit.factCampaignCount', '{{count}} campaigns in scope.'), { count: rows.length }))
  const accountNames = new Set(rows.map((r) => r.accountName))
  facts.push(tpl(t('metaAudit.factAccountCount', '{{count}} ad account(s) included.'), { count: accountNames.size }))

  const top = [...rows].sort((a, b) => b.spend - a.spend)[0]!
  const topShare = totalSpend > 0 ? Math.round((top.spend / totalSpend) * 1000) / 10 : 0
  facts.push(
    tpl(t('metaAudit.factTopSpend', 'Highest spend: "{{name}}" at {{amount}} ({{share}}% of total).'), {
      name: top.name,
      amount: formatCurrency(top.spend, currency),
      share: topShare,
    }),
  )
  facts.push(
    tpl(t('metaAudit.factWeightedCtr', 'Blended CTR (clicks ÷ impressions): {{ctr}}%.'), {
      ctr: blendedCtr.toFixed(2),
    }),
  )
  facts.push(tpl(t('metaAudit.factTotalClicks', 'Total clicks: {{count}}.'), { count: totalClicks }))
  facts.push(tpl(t('metaAudit.factTotalImpressions', 'Total impressions: {{count}}.'), { count: totalImpressions }))

  if (totalSpend > 0 && topShare >= 55) {
    risks.push(
      tpl(t('metaAudit.riskSpendConcentration', 'Budget is concentrated: top campaign "{{name}}" takes {{share}}% of spend.'), {
        name: top.name,
        share: topShare,
      }),
    )
    actions.push(t('metaAudit.actionRebalanceBudget', 'Reallocate part of the budget away from the single largest spender until efficiency is validated.'))
  }

  const cpcPool = rows.filter((r) => r.clicks >= 5 && r.cpc > 0).map((r) => r.cpc)
  const medianCpc = median(cpcPool)

  for (const r of rows) {
    if (r.spend >= 25 && r.clicks === 0 && r.impressions >= 500) {
      risks.push(
        tpl(t('metaAudit.riskSpendNoClicks', '"{{name}}" spent {{amount}} with zero clicks.'), {
          name: r.name,
          amount: formatCurrency(r.spend, currency),
        }),
      )
      actions.push(
        tpl(t('metaAudit.actionFixNoClicks', 'Pause or cap delivery on "{{name}}" until click-through returns.'), { name: r.name }),
      )
    }
  }

  for (const r of rows) {
    if (r.impressions < 2000 || r.spend < 50) continue
    if (blendedCtr <= 0) continue
    if (r.ctr < blendedCtr * 0.5) {
      risks.push(
        tpl(t('metaAudit.riskLowCtrVsAvg', 'CTR on "{{name}}" is {{ctr}}%, well below the account blended {{avg}}%.'), {
          name: r.name,
          ctr: r.ctr.toFixed(2),
          avg: blendedCtr.toFixed(2),
        }),
      )
      actions.push(
        tpl(t('metaAudit.actionReviewLowCtr', 'Open "{{name}}" in Ads Manager: test new primary text/creative.'), { name: r.name }),
      )
      break
    }
  }

  for (const r of rows) {
    if (r.clicks < 10 || medianCpc <= 0) continue
    if (r.cpc > medianCpc * 2) {
      risks.push(
        tpl(t('metaAudit.riskHighCpcVsMedian', 'CPC on "{{name}}" is {{cpc}} vs. median {{median}}.'), {
          name: r.name,
          cpc: formatCurrency(r.cpc, currency),
          median: formatCurrency(medianCpc, currency),
        }),
      )
      actions.push(
        tpl(t('metaAudit.actionReviewHighCpc', 'Audit "{{name}}": check frequency and placements.'), { name: r.name }),
      )
      break
    }
  }

  const dedupe = (arr: string[]) => Array.from(new Set(arr))
  return { facts, risks: dedupe(risks), actions: dedupe(actions) }
}

function MetaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function MetaAuditPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const searchRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<AuditTab>('meta')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minSpend, setMinSpend] = useState('0')
  const [maxSpend, setMaxSpend] = useState('0')
  const [gradedBy, setGradedBy] = useState('leads')
  const [dateRange, setDateRange] = useState<'7' | '30' | 'month' | 'custom'>('7')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')
  const [kpi, setKpi] = useState<KpiMode>('roas')
  const [persona, setPersona] = useState<'owner' | 'specialist'>('owner')
  const [preset, setPreset] = useState('')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [introOpen, setIntroOpen] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [selectedFormats, setSelectedFormats] = useState<Record<string, boolean>>({})
  const [selectedCopy, setSelectedCopy] = useState<Record<string, boolean>>({})
  const [liveData, setLiveData] = useState<ReportData | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')

  const reportingDays = useMemo(
    () => daysForDateRange(dateRange, customFromDate, customToDate),
    [dateRange, customFromDate, customToDate],
  )

  const metaAuditDatePresets = useMemo(
    () => [
      { id: '7', label: t('metaAudit.date7', 'Last 7 days') },
      { id: '30', label: t('metaAudit.date30', 'Last 30 days') },
      { id: 'month', label: t('metaAudit.dateMonth', 'This month') },
    ],
    [t],
  )

  const loadReporting = useCallback(() => {
    if (!currentWorkspace?.id) {
      setLiveData(null)
      setLiveError('')
      setLiveLoading(false)
      return
    }
    setLiveLoading(true)
    setLiveError('')
    metaApi
      .reporting(currentWorkspace.id, reportingDays)
      .then((res) => {
        setLiveData(res.data as ReportData)
      })
      .catch(() => {
        setLiveData(null)
        setLiveError(t('metaAudit.loadError', 'Could not load Meta reporting. Check that Meta Ads is connected for this workspace.'))
      })
      .finally(() => {
        setLiveLoading(false)
        setLastRefresh(new Date())
      })
  }, [currentWorkspace?.id, reportingDays, t])

  useEffect(() => {
    loadReporting()
  }, [loadReporting])

  const liveRows = useMemo(() => (liveData ? flattenReportData(liveData) : []), [liveData])
  const isLiveData = liveRows.length > 0
  const hasReportingAccounts = Boolean(liveData && liveData.accounts.length > 0)
  const noCampaignRows = hasReportingAccounts && liveRows.length === 0 && !liveError

  useEffect(() => {
    if (isLiveData && (kpi === 'roas' || kpi === 'leads')) setKpi('spend')
  }, [isLiveData, kpi])

  useEffect(() => {
    if (!isLiveData && (kpi === 'ctr' || kpi === 'clicks')) setKpi('roas')
  }, [isLiveData, kpi])

  useEffect(() => {
    if (!feedback) return
    const id = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(id)
  }, [feedback])

  const tabLabels = useMemo(
    () =>
      ({
        meta: t('metaAudit.tabMeta', 'Meta Dashboard'),
        targeting: t('metaAudit.tabTargeting', 'Targeting Insights'),
        auction: t('metaAudit.tabAuction', 'Auction Insights'),
        geo: t('metaAudit.tabGeo', 'Geo & Demo Insights'),
        creative: t('metaAudit.tabCreative', 'Creative Insights'),
        adcopy: t('metaAudit.tabAdcopy', 'Ad Copy Insights'),
      }) satisfies Record<AuditTab, string>,
    [t],
  )

  const tabHelp: Record<AuditTab, string> = useMemo(
    () =>
      isLiveData
        ? {
            meta: t('metaAudit.metaHelpLive', 'Account snapshot from synced reporting: spend, CTR, CPC, and campaigns in this date range.'),
            targeting: t(
              'metaAudit.targetingHelpLive',
              'Illustrative layout. Audience overlap and fatigue still require breakdowns not yet in this reporting feed.',
            ),
            auction: t('metaAudit.auctionHelpLive', 'Illustrative layout. Auction diagnostics need placement/auction breakdowns from Meta.'),
            geo: t('metaAudit.geoHelpLive', 'Illustrative layout. Geo split is not in the current campaign-level reporting payload.'),
            creative: t('metaAudit.creativeHelpLive', 'Illustrative layout. Use Reporting export or Ads Manager for creative-level IDs.'),
            adcopy: t('metaAudit.adcopyHelpLive', 'Illustrative layout. Copy-level metrics need ad-level breakdowns.'),
          }
        : {
            meta: t('metaAudit.metaHelp', 'Account snapshot: spend, ROAS, and top campaigns (sample).'),
            targeting: t('metaAudit.targetingHelp', 'Audience breadth vs. performance — spot overlap or fatigue risk (sample).'),
            auction: t('metaAudit.auctionHelp', 'Auction pressure and delivery — why costs move (sample).'),
            geo: t('metaAudit.geoHelp', 'Budget split by region — where results come from (sample).'),
            creative: t('metaAudit.creativeHelp', 'Formats and a simple performance map — pick winners for Ad Launcher (sample).'),
            adcopy: t('metaAudit.adcopyHelp', 'Headline and body patterns vs. metrics (sample).'),
          },
    [isLiveData, t],
  )

  const auditFindings = useMemo(() => computeAuditFindings(liveRows, t), [liveRows, t])

  const liveTotals = useMemo(() => {
    if (!liveRows.length) return null
    const spend = liveRows.reduce((s, r) => s + r.spend, 0)
    const clicks = liveRows.reduce((s, r) => s + r.clicks, 0)
    const impressions = liveRows.reduce((s, r) => s + r.impressions, 0)
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const currency = liveRows[0]?.currency ?? 'USD'
    return { spend, clicks, impressions, ctr, currency }
  }, [liveRows])

  const dateLabel = useMemo(() => {
    if (dateRange === '7') return t('metaAudit.date7', 'Last 7 days')
    if (dateRange === '30') return t('metaAudit.date30', 'Last 30 days')
    if (dateRange === 'custom') {
      if (customFromDate && customToDate) return `${customFromDate} → ${customToDate}`
      return t('metaAudit.dateCustom', 'Custom range')
    }
    return t('metaAudit.dateMonth', 'This month')
  }, [dateRange, customFromDate, customToDate, t])

  const sampleSpendMultiplier =
    dateRange === '7'
      ? 1
      : dateRange === '30'
        ? 3.2
        : dateRange === 'custom'
          ? Math.max(reportingDays / 7, 1)
          : 4.5

  const filteredLiveRows = useMemo(() => {
    let list = liveRows
    if (preset === 'winners') {
      const med = median(list.map((r) => r.ctr).filter((x) => x > 0))
      list = list.filter((r) => r.ctr >= med || med === 0)
    }
    if (preset === 'learning') {
      list = list.filter((r) => /limited|learning/i.test(r.status))
    }
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    const dir = (a: LiveCampaignRow, b: LiveCampaignRow) => {
      if (kpi === 'ctr') return b.ctr - a.ctr
      if (kpi === 'clicks') return b.clicks - a.clicks
      if (kpi === 'spend') return b.spend - a.spend
      return b.spend - a.spend
    }
    return [...list].sort(dir)
  }, [liveRows, search, preset, kpi])

  const filteredMockCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MOCK_CAMPAIGNS
    return MOCK_CAMPAIGNS.filter((c) => c.name.toLowerCase().includes(q) || c.id.includes(q))
  }, [search])

  const showCreativeChrome = tab === 'creative' || tab === 'adcopy'

  const selectedFormatCount = Object.values(selectedFormats).filter(Boolean).length
  const selectedCopyCount = Object.values(selectedCopy).filter(Boolean).length

  const toggleFormat = useCallback((id: string) => {
    setSelectedFormats((p) => ({ ...p, [id]: !p[id] }))
  }, [])

  const toggleCopy = useCallback((id: string) => {
    setSelectedCopy((p) => ({ ...p, [id]: !p[id] }))
  }, [])

  const onRefresh = () => {
    loadReporting()
    setFeedback(
      isLiveData
        ? t('metaAudit.refreshedLive', 'Reporting data refreshed.')
        : t('metaAudit.refreshed', 'Preview refreshed (demo). Connect Meta for live sync.'),
    )
  }

  const onSaveView = () => {
    try {
      sessionStorage.setItem(
        VIEW_STORAGE,
        JSON.stringify({ tab, kpi, preset, dateRange, at: Date.now() }),
      )
    } catch {
      /* ignore */
    }
    setFeedback(t('metaAudit.savedViewOk', 'View saved in this browser.'))
  }

  const onApplyFilters = () => {
    setFiltersOpen(false)
    setFeedback(t('metaAudit.filtersApplied', 'Filters applied to the preview.'))
  }

  const onClearFilters = () => {
    setFeedback(t('metaAudit.filtersCleared', 'Filters cleared.'))
  }

  const maxSpendFormat = Math.max(...Object.values(FORMAT_STATS).map((s) => s.spend), 1)

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-8">
      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('metaAudit.allFilters', 'All filters')}
        className="max-h-[min(90vh,640px)] max-w-3xl overflow-y-auto"
      >
        <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('metaAudit.filterCreativeType', 'Creative type')}
            </p>
            <ul className="space-y-2">
              {CREATIVE_FORMATS.map((f) => (
                <label key={f.id} className="flex cursor-pointer items-center gap-2 text-text-secondary">
                  <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
                  <span>{t(f.labelKey, f.fallback)}</span>
                </label>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('metaAudit.filterFunnel', 'Funnel stage')}
            </p>
            <ul className="space-y-2">
              {['Acquisition', 'Retargeting', 'Retention'].map((x) => (
                <label key={x} className="flex cursor-pointer items-center gap-2 text-text-secondary">
                  <input type="checkbox" className="rounded border-border text-primary" />
                  {x}
                </label>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('metaAudit.filterPlacement', 'Placement')}
            </p>
            <ul className="space-y-2">
              {['Facebook Feed', 'Instagram Feed', 'Stories', 'Audience Network'].map((x) => (
                <label key={x} className="flex cursor-pointer items-center gap-2 text-text-secondary">
                  <input type="checkbox" className="rounded border-border text-primary" />
                  {x}
                </label>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('metaAudit.filterDevice', 'Device')}
            </p>
            <ul className="space-y-2">
              {['Desktop', 'Mobile app', 'Mobile web'].map((x) => (
                <label key={x} className="flex cursor-pointer items-center gap-2 text-text-secondary">
                  <input type="checkbox" className="rounded border-border text-primary" />
                  {x}
                </label>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4 text-center text-sm text-text-tertiary">
          {t('metaAudit.filtersEmptyPreview', 'No rows match these filters yet. Apply to refresh the workspace view.')}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={onClearFilters}
          >
            {t('metaAudit.clearFilters', 'Clear filters')}
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setFiltersOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" type="button" onClick={onApplyFilters}>
              {t('metaAudit.applyFilters', 'Apply filters')}
            </Button>
          </div>
        </div>
      </Dialog>

      {introOpen && (
        <Alert variant="info" className="border-brand-mid/25 bg-brand-lime/10 dark:border-brand-mid/30 dark:bg-brand-lime/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-text-primary">{t('metaAudit.introTitle', 'How to use Meta Audit')}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {isLiveData
                  ? t(
                      'metaAudit.introBodyLive',
                      'Each tab answers one question about your Meta ads. The dashboard tab uses live reporting data; other tabs stay illustrative until deeper breakdowns sync.',
                    )
                  : t(
                      'metaAudit.introBody',
                      'Each tab answers one question about your Meta ads. Figures here are samples so you can learn the layout before connecting Meta.',
                    )}
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
                <li>{t('metaAudit.introStep1', 'Choose a date range and KPI (top right).')}</li>
                <li>
                  {t(
                    'metaAudit.introStep2',
                    'Switch tabs: dashboard, targeting, auction, geo, creatives, and ad copy.',
                  )}
                </li>
                <li>{t('metaAudit.introStep3', 'Use presets and filters, then save a view you open every week.')}</li>
              </ol>
              <p className="mt-3 text-sm text-text-secondary">
                {persona === 'owner'
                  ? t('metaAudit.tipOwner', 'Prioritize spend concentration and any campaigns with spend but no clicks — those waste budget first.')
                  : t(
                      'metaAudit.tipSpecialist',
                      'Compare CTR and CPC to the account median; pause or retest outliers before scaling winners.',
                    )}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
              onClick={() => setIntroOpen(false)}
              aria-label={t('metaAudit.dismissIntro', 'Got it, hide this')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIntroOpen(false)}>
              {t('metaAudit.dismissIntro', 'Got it, hide this')}
            </Button>
          </div>
        </Alert>
      )}

      {feedback && (
        <Alert variant="success" className="flex items-center justify-between gap-3">
          <span>{feedback}</span>
          <button type="button" className="text-sm underline" onClick={() => setFeedback(null)}>
            OK
          </button>
        </Alert>
      )}

      {liveError && (
        <Alert variant="error" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{liveError}</span>
          <Link
            href="/settings/meta"
            className="shrink-0 text-sm font-semibold text-brand-ink underline decoration-brand-mid/50 hover:no-underline dark:text-brand-lime"
          >
            {t('metaAudit.connectMeta', 'Open Meta settings')}
          </Link>
        </Alert>
      )}

      <section className="rounded-2xl border border-brand-mid/20 bg-gradient-to-br from-brand-lime/[0.08] via-surface-2/95 to-surface-2/90 p-3 dark:from-brand-lime/5 dark:via-surface-elevated/90 dark:to-surface-elevated/90 dark:border-brand-mid/25">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-mid/30 bg-gradient-to-br from-brand-mid/25 to-brand-lime/40 text-brand-ink shadow-sm dark:from-brand-mid/40 dark:to-brand-lime/30">
                <Compass className="h-4 w-4" />
              </span>
              {t('metaAudit.title', '360° Meta Audit')}
            </span>
          }
          subtitle={
            <span className="space-y-2">
              <span className="mr-2 inline-flex items-center gap-2 align-middle">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    isLiveData
                      ? 'border-brand-mid/35 bg-brand-lime/35 text-brand-ink dark:bg-brand-lime/25 dark:text-brand-lime'
                      : 'border-border bg-surface-2 text-text-tertiary',
                  )}
                >
                  {isLiveData ? t('metaAudit.badgeLive', 'Live data') : t('metaAudit.badgeSample', 'Sample walkthrough')}
                </span>
                {liveLoading && <span className="text-xs text-text-tertiary">{t('common.loading', 'Loading…')}</span>}
              </span>
              <span className="block">
                {isLiveData
                  ? t(
                      'metaAudit.subtitleLive',
                      'Six views to diagnose Meta performance. Numbers below come from your connected Meta accounts for the selected period.',
                    )
                  : t(
                      'metaAudit.subtitle',
                      'Six views to diagnose Meta performance. Below is sample data until your ad account is connected.',
                    )}
              </span>
            </span>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="gap-1.5"
                onClick={onRefresh}
                disabled={liveLoading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', liveLoading && 'animate-spin')} />
                {t('common.refresh', 'Refresh')}
              </Button>
              <DateRangeFilter
                variant="select"
                value={dateRange}
                onValueChange={(id) => setDateRange(id as typeof dateRange)}
                presets={metaAuditDatePresets}
                fromDate={customFromDate}
                toDate={customToDate}
                onFromDateChange={setCustomFromDate}
                onToDateChange={setCustomToDate}
                selectClassName="rounded-xl border border-brand-mid/20 bg-surface px-3 py-2 text-xs font-medium text-text-primary shadow-sm focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-lime/40"
                dateInputClassName="rounded-xl border border-brand-mid/20 bg-surface px-3 py-2 text-xs font-medium text-text-primary shadow-sm focus:border-brand-mid focus:outline-none focus:ring-2 focus:ring-brand-lime/40"
              />
              <span className="hidden text-xs text-text-tertiary sm:inline">
                {dateLabel}
                {lastRefresh && (
                  <span className="ml-1">
                    · {lastRefresh.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </span>
            </div>
          }
        />
      </section>

      <div className="overflow-x-auto">
        <nav
          className="flex min-w-max gap-1 rounded-xl border border-border bg-surface-2 p-1 shadow-sm dark:bg-surface-elevated/80"
          aria-label="Meta audit sections"
        >
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200 sm:text-sm',
                tab === id
                  ? 'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink shadow-sm'
                  : 'text-text-tertiary hover:bg-surface hover:text-text-primary dark:hover:bg-surface-2',
              )}
            >
              {tabLabels[id]}
            </button>
          ))}
        </nav>
      </div>

      <p className="text-sm text-text-secondary">{tabHelp[tab]}</p>

      {isLiveData && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
            {t('metaAudit.periodNote', 'Period-over-period is not available until daily or comparison windows are exposed by the API.')}
          </p>
        </div>
      )}

      {(isLiveData || noCampaignRows) && (
        <section className="rounded-2xl border border-brand-mid/20 bg-surface p-4 shadow-sm ring-1 ring-brand-lime/10 dark:border-brand-mid/25 dark:ring-brand-lime/5">
          <h2 className="text-sm font-semibold text-brand-ink dark:text-brand-lime">
            {t('metaAudit.findingsTitle', 'Audit findings (from reporting)')}
          </h2>
          {noCampaignRows && (
            <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
              {t(
                'metaAudit.findingNoCampaigns',
                'Meta is connected but no campaign rows were returned for this period — widen the date range or check account access.',
              )}
            </p>
          )}
          {isLiveData && (
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-brand-mid/20 bg-brand-lime/[0.07] p-4 dark:bg-brand-lime/5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/80 dark:text-brand-lime/90">
                  {t('metaAudit.factsTitle', 'Facts')}
                </p>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-text-secondary">
                  {auditFindings.facts.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  {t('metaAudit.risksTitle', 'Weak spots')}
                </p>
                {auditFindings.risks.length === 0 ? (
                  <p className="text-sm text-amber-950/80 dark:text-amber-100/90">
                    {t(
                      'metaAudit.risksEmpty',
                      'No automatic risk flags for this window. Rules check spend concentration, CTR vs. blended average, CPC vs. median, and spend without clicks.',
                    )}
                  </p>
                ) : (
                  <ul className="list-disc space-y-1.5 pl-4 text-sm text-amber-950/90 dark:text-amber-50/95">
                    {auditFindings.risks.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  {t('metaAudit.actionsTitle', 'Recommendations')}
                </p>
                {auditFindings.actions.length === 0 ? (
                  <p className="text-sm text-emerald-950/70 dark:text-emerald-100/80">—</p>
                ) : (
                  <ul className="list-disc space-y-1.5 pl-4 text-sm text-emerald-950/90 dark:text-emerald-50/95">
                    {auditFindings.actions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {currentWorkspace && !liveLoading && liveData && liveData.accounts.length === 0 && !liveError && (
        <Alert variant="info">{t('metaAudit.findingEmptyConnect', 'Connect a Meta ad account in workspace settings to run a live audit.')}</Alert>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-brand-mid/15 bg-surface p-3 shadow-sm ring-1 ring-border/50 lg:flex-row lg:flex-wrap lg:items-center dark:border-brand-mid/20">
        <div className="flex flex-col gap-1 border-b border-border pb-3 text-xs lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
          <span className="font-semibold uppercase tracking-wide text-text-tertiary">{t('metaAudit.personaLabel', 'View as')}</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setPersona('owner')}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
                persona === 'owner'
                  ? 'border-transparent bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink shadow-sm'
                  : 'border-border text-text-secondary hover:bg-surface-2',
              )}
            >
              {t('metaAudit.personaOwner', 'Account owner')}
            </button>
            <button
              type="button"
              onClick={() => setPersona('specialist')}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
                persona === 'specialist'
                  ? 'border-transparent bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink shadow-sm'
                  : 'border-border text-text-secondary hover:bg-surface-2',
              )}
            >
              {t('metaAudit.personaSpecialist', 'Targetologist')}
            </button>
          </div>
          <span className="max-w-xs text-[11px] leading-snug text-text-tertiary lg:max-w-[220px]">
            {persona === 'owner'
              ? t('metaAudit.personaHintOwner', 'High-level risks, budget concentration, and clear next checks.')
              : t('metaAudit.personaHintSpecialist', 'Delivery metrics (CTR, CPC), outliers vs. account average, and campaign-level fixes.')}
          </span>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (tab !== 'meta') setTab('meta')
            setShowSearch(true)
            queueMicrotask(() => searchRef.current?.focus())
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
        >
          <Search className="h-3.5 w-3.5" />
          {t('metaAudit.filterData', 'Filter data')}
        </button>
        {showSearch && (
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('metaAudit.searchPlaceholder', 'Search campaigns…')}
            className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-primary md:max-w-xs dark:bg-surface"
          />
        )}
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="min-w-[140px] rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs text-text-secondary dark:bg-surface"
        >
          <option value="">{t('metaAudit.loadPreset', 'Load filter preset…')}</option>
          <option value="winners">{t('metaAudit.presetWinners', 'Winning ad sets')}</option>
          <option value="learning">{t('metaAudit.presetLearning', 'Learning limited')}</option>
        </select>
        <Button type="button" variant="secondary" size="sm" onClick={onSaveView}>
          {t('metaAudit.saveView', 'Save this view')}
        </Button>
        <div className="min-w-[120px] flex-1" />
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1.5 dark:bg-surface">
          <MetaGlyph className="h-4 w-4 shrink-0 text-text-tertiary" />
          <select
            value={kpi}
            onChange={(e) => setKpi(e.target.value as KpiMode)}
            className="min-w-[110px] bg-transparent text-xs font-medium text-text-primary outline-none"
          >
            {isLiveData ? (
              <>
                <option value="spend">{t('metaAudit.metricSpend', 'Amount spent')}</option>
                <option value="ctr">{t('metaAudit.metricCtr', 'CTR (blended)')}</option>
                <option value="clicks">{t('metaAudit.kpiClicks', 'Clicks')}</option>
              </>
            ) : (
              <>
                <option value="roas">{t('metaAudit.metricRoas', 'ROAS (All)')}</option>
                <option value="leads">{t('metaAudit.metricLeads', 'Leads (All)')}</option>
                <option value="spend">{t('metaAudit.metricSpend', 'Amount spent')}</option>
              </>
            )}
          </select>
        </div>
        </div>
      </div>

      {tab === 'meta' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {isLiveData && liveTotals ? (
              <>
                <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <p className="text-xs font-medium text-text-tertiary">{t('metaAudit.kpiSpend', 'Amount spent')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
                    {formatCurrency(liveTotals.spend, liveTotals.currency)}
                  </p>
                  <p className="mt-1 text-[11px] text-text-tertiary">{dateLabel}</p>
                </div>
                <div className="rounded-xl border border-brand-mid/25 bg-gradient-to-br from-brand-lime/20 to-brand-lime/5 p-4 shadow-sm dark:from-brand-lime/15 dark:to-transparent">
                  <p className="text-xs font-medium text-brand-ink/70 dark:text-brand-lime/80">{t('metaAudit.kpiCtr', 'CTR (blended)')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink dark:text-brand-lime">{liveTotals.ctr.toFixed(2)}%</p>
                  <p className="mt-1 text-[11px] text-text-tertiary">{t('metaAudit.metricCtr', 'CTR (blended)')}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-sm dark:border-emerald-500/30">
                  <p className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300/90">{t('metaAudit.kpiClicks', 'Clicks')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-200">
                    {formatNumber(liveTotals.clicks)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-900/70 dark:text-emerald-200/80">
                    {t('metaAudit.roasUnavailableNote', 'ROAS is not in this reporting sync yet.')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <p className="text-xs font-medium text-text-tertiary">{t('metaAudit.kpiSpend', 'Amount spent')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
                    ${(13270 * sampleSpendMultiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="mt-1 text-[11px] text-text-tertiary">{dateLabel}</p>
                </div>
                <div className="rounded-xl border border-brand-mid/20 bg-brand-lime/10 p-4 shadow-sm dark:bg-brand-lime/5">
                  <p className="text-xs font-medium text-text-tertiary">{t('metaAudit.metricRoas', 'ROAS (All)')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink dark:text-brand-lime">
                    {kpi === 'roas' ? '2.6' : kpi === 'leads' ? '—' : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 shadow-sm dark:border-amber-500/25">
                  <p className="text-xs font-medium text-amber-900/70 dark:text-amber-200/80">{t('metaAudit.kpiLeads', 'Leads (All)')}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-100">{kpi === 'leads' ? '184' : '142'}</p>
                </div>
              </>
            )}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-brand-mid/15 bg-surface shadow-sm dark:border-brand-mid/20">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead className="border-b border-brand-mid/10 bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary dark:bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3">{t('metaAudit.campaignColumn', 'Campaign')}</th>
                  <th className="px-4 py-3 text-right">{t('metaAudit.spendColumn', 'Spend')}</th>
                  {isLiveData ? (
                    <>
                      <th className="px-4 py-3 text-right">{t('metaAudit.clicksColumn', 'Clicks')}</th>
                      <th className="px-4 py-3 text-right">{t('metaAudit.impressionsColumn', 'Impressions')}</th>
                      <th className="px-4 py-3 text-right">{t('metaAudit.ctrColumn', 'CTR')}</th>
                      <th className="px-4 py-3 text-right">{t('metaAudit.cpcColumn', 'CPC')}</th>
                    </>
                  ) : (
                    <th className="px-4 py-3 text-right">{t('metaAudit.roasColumn', 'ROAS')}</th>
                  )}
                  <th className="px-4 py-3">{t('metaAudit.statusColumn', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {isLiveData
                  ? filteredLiveRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3 font-medium text-text-primary">{row.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                          {formatCurrency(row.spend, row.currency)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{formatNumber(row.clicks)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{formatNumber(row.impressions)}</td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right tabular-nums',
                            row.ctr >= 2 ? 'text-emerald-500' : row.ctr >= 1 ? 'text-text-primary' : row.ctr > 0 ? 'text-amber-500' : 'text-text-tertiary',
                          )}
                        >
                          {row.ctr.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                          {row.cpc > 0 ? formatCurrency(row.cpc, row.currency) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-[10px] font-semibold uppercase',
                              STATUS_BADGE[row.status] ?? 'text-text-tertiary bg-surface-2',
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  : filteredMockCampaigns.map((row) => (
                      <tr key={row.id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3 font-medium text-text-primary">{row.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">${row.spend.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{row.roas.toFixed(1)}×</td>
                        <td className="px-4 py-3 text-text-secondary">{row.status}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLiveData && (
            <p className="text-center text-xs">
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-medium text-amber-900 dark:text-amber-200">
                {t('metaAudit.sampleNote', 'Sample data')}
              </span>
            </p>
          )}
        </div>
      )}

      {tab === 'targeting' && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-4 py-3">{t('metaAudit.segmentColumn', 'Audience / placement')}</th>
                <th className="px-4 py-3">{t('metaAudit.healthColumn', 'Health')}</th>
                <th className="px-4 py-3">{t('metaAudit.noteColumn', 'Note')}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TARGETING.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{row.segment}</td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums font-semibold text-primary">{row.health}</span>
                    <span className="text-text-tertiary">/100</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'auction' && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('metaAudit.auctionSignal', 'Signal')}
          </p>
          <ul className="space-y-4">
            {MOCK_AUCTION.map((row) => (
              <li key={row.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-text-primary">{t(row.labelKey, row.fb)}</span>
                  <span className="tabular-nums font-medium text-text-secondary">{row.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime"
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-tertiary">{t('metaAudit.auctionValue', 'Value (sample)')}</p>
        </div>
      )}

      {tab === 'geo' && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-4 py-3">{t('metaAudit.regionColumn', 'Region')}</th>
                <th className="px-4 py-3">{t('metaAudit.shareColumn', 'Spend share')}</th>
                <th className="px-4 py-3">{t('metaAudit.spendColumn', 'Spend')}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_GEO.map((row) => (
                <tr key={row.region} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-text-primary">{row.region}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{row.share}%</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">${row.spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreativeChrome && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-2 text-xs dark:bg-surface-2/30">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">{t('metaAudit.gradedBy', 'Graded by')}</span>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1">
                <MetaGlyph className="h-3.5 w-3.5 text-text-tertiary" />
                <select
                  value={gradedBy}
                  onChange={(e) => setGradedBy(e.target.value)}
                  className="bg-transparent text-xs font-medium outline-none"
                >
                  <option value="leads">{t('metaAudit.kpiLeads', 'Leads (All)')}</option>
                  <option value="purchases">{t('metaAudit.kpiPurchases', 'Purchases')}</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-1.5 text-text-secondary">
              <span className="text-text-tertiary">{t('metaAudit.minSpend', 'Min. spend')}</span>
              <span className="text-text-tertiary">$</span>
              <input
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-xs tabular-nums"
              />
            </label>
            <label className="flex items-center gap-1.5 text-text-secondary">
              <span className="text-text-tertiary">{t('metaAudit.maxSpend', 'Max. spend')}</span>
              <span className="text-text-tertiary">$</span>
              <input
                value={maxSpend}
                onChange={(e) => setMaxSpend(e.target.value)}
                className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-xs tabular-nums"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brand-mid/35 bg-brand-lime/15 px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-lime/25 dark:text-brand-lime"
            >
              <Filter className="h-3.5 w-3.5" />
              {t('metaAudit.smartFilter', 'Smart filter')}
            </button>
          </div>

          {tab === 'creative' && (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                {CREATIVE_FORMATS.map((f) => {
                  const st = FORMAT_STATS[f.id]
                  const spendPct = Math.round((st.spend / maxSpendFormat) * 100)
                  const on = Boolean(selectedFormats[f.id])
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFormat(f.id)}
                      className={cn(
                        'flex min-h-[168px] flex-col gap-2 rounded-xl border p-3 text-left shadow-sm transition-colors',
                        on
                          ? 'border-brand-mid/40 bg-brand-lime/10 ring-1 ring-brand-lime/25 dark:border-brand-mid/50'
                          : 'border-border bg-surface hover:border-brand-mid/30',
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-lg" aria-hidden>
                          {f.icon}
                        </span>
                        <span className="truncate text-[11px] font-semibold text-text-primary">{t(f.labelKey, f.fallback)}</span>
                      </div>
                      <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                        <span className="text-text-tertiary">{t('metaAudit.amountSpent', 'Spend')}</span>
                        <span className="text-right font-medium tabular-nums">${st.spend.toLocaleString()}</span>
                        <span className="text-text-tertiary">{t('metaAudit.cpl', 'CPL')}</span>
                        <span className="text-right font-medium tabular-nums">${st.cpl.toFixed(2)}</span>
                        <span className="text-text-tertiary">CTR</span>
                        <span className="text-right font-medium tabular-nums">{st.ctr.toFixed(1)}%</span>
                        <span className="text-text-tertiary">{t('metaAudit.convRate', 'Conv. rate')}</span>
                        <span className="text-right font-medium tabular-nums">{st.conv.toFixed(1)}%</span>
                      </div>
                      <div className="space-y-1 border-t border-border/60 pt-1">
                          <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime"
                            style={{ width: `${spendPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-text-tertiary">
                          <span>{t('metaAudit.leadsBar', 'Leads')}</span>
                          <span>{t('metaAudit.spendBar', 'Spend')}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold text-text-primary">{t('metaAudit.creativeMatrix', 'Creative matrix')}</h2>
                  <Button type="button" variant="secondary" size="sm">
                    {t('metaAudit.seeAllCreatives', 'See all creatives')}
                  </Button>
                </div>
                <div className="p-4">
                  <p className="mb-3 text-xs text-text-secondary">
                    {t(
                      'metaAudit.matrixBlurb',
                      'Strong results + controlled spend sit toward the top-right. Early tests sit bottom-left (illustrative).',
                    )}
                  </p>
                  <div className="relative mx-auto aspect-square max-w-lg rounded-2xl border border-border bg-gradient-to-br from-surface-2 via-surface to-surface-2 shadow-inner dark:from-surface-2 dark:via-surface dark:to-brand-ink/20">
                    <span className="absolute left-1 top-4 rotate-180 text-[10px] font-bold text-primary [writing-mode:vertical-rl]">
                      {t('metaAudit.quadrantScalable', 'SCALABLE')}
                    </span>
                    <span className="absolute right-1 top-4 text-[10px] font-bold text-text-secondary [writing-mode:vertical-rl]">
                      {t('metaAudit.quadrantCore', 'CORE PERFORMERS')}
                    </span>
                    <span className="absolute bottom-4 left-1 rotate-180 text-[10px] font-bold text-text-tertiary [writing-mode:vertical-rl]">
                      {t('metaAudit.quadrantStarted', 'GETTING STARTED')}
                    </span>
                    <span className="absolute bottom-4 right-1 text-[10px] font-bold text-amber-600 [writing-mode:vertical-rl] dark:text-amber-400">
                      {t('metaAudit.quadrantOverspend', 'OVERSPEND')}
                    </span>
                    <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-semibold text-text-tertiary">
                      {t('metaAudit.axisLeads', 'Leads (All)')}
                    </span>
                    <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-text-tertiary">
                      {t('metaAudit.axisSpend', 'Spend')}
                    </span>
                    <div className="pointer-events-none absolute inset-10 flex flex-col items-center justify-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-primary/90 shadow" style={{ marginLeft: '38%', marginBottom: '12%' }} title="Sample" />
                      <div className="h-3 w-3 rounded-full bg-primary/50" style={{ marginLeft: '22%', marginTop: '8%' }} />
                      <div className="h-3 w-3 rounded-full bg-text-tertiary/60" style={{ marginLeft: '-18%', marginTop: '14%' }} />
                      <p className="max-w-xs px-4 text-center text-xs text-text-tertiary">
                        {t('metaAudit.matrixSampleCaption', 'Illustrative dots — connect Meta to plot your real creatives here.')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-2/40 px-4 py-3 text-xs dark:bg-surface-2/20">
                  <span className="text-text-secondary">
                    {CREATIVE_FORMATS.length} {t('metaAudit.formatTypes', 'format types')} · {selectedFormatCount}{' '}
                    {t('metaAudit.selectedWord', 'selected')}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedFormatCount > 0 ? (
                      <Link
                        href="/ad-launcher"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-brand-ink hover:opacity-95"
                      >
                        {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-tertiary opacity-70">
                        {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
                      </span>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === 'adcopy' && (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="mb-4 text-xs text-text-secondary">
                {t('metaAudit.copySelectHint', 'Select rows, then send them to Ad Launcher.')}
              </p>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-text-secondary">
                  {MOCK_COPY.length} {t('metaAudit.copyVariants', 'copy variants')}
                </span>
                <span className="text-text-tertiary">
                  {selectedCopyCount} {t('metaAudit.selectedWord', 'selected')}
                </span>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
                  {MOCK_COPY.map((row) => {
                    const on = Boolean(selectedCopy[row.id])
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => toggleCopy(row.id)}
                        className={cn(
                          'w-full rounded-xl border p-4 text-left transition-colors',
                          on ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/25',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-text-primary">{row.headline}</p>
                            <p className="mt-1 text-xs text-text-secondary">{row.body}</p>
                          </div>
                          <input type="checkbox" checked={on} readOnly className="mt-1 rounded border-border text-primary" />
                        </div>
                        <p className="mt-2 text-[11px] text-text-tertiary">
                          CTR {row.ctr}% · {row.leads} {t('metaAudit.kpiLeads', 'Leads').split(' ')[0]}
                        </p>
                      </button>
                    )
                  })}
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-border p-3">
                    <p className="mb-2 text-xs font-semibold">{t('metaAudit.adCopyLength', 'Ad copy length (0)')}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Short', 'Medium', 'Long'] as const).map((len) => (
                        <div key={len} className="rounded-lg border border-border bg-surface-2/50 p-3 text-center dark:bg-surface-2/30">
                          <p className="mb-2 text-xs font-bold text-text-primary">{len}</p>
                          <p className="text-[10px] text-text-tertiary">{t('metaAudit.placeholderMetrics', '')}</p>
                          <p className="mt-2 text-lg font-semibold text-text-secondary">—</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedCopyCount > 0 ? (
                    <Link
                      href="/ad-launcher"
                      className="block rounded-lg border border-primary bg-primary py-2 text-center text-xs font-semibold text-brand-ink hover:opacity-95"
                    >
                      {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
                    </Link>
                  ) : (
                    <span className="block cursor-not-allowed rounded-lg border border-dashed border-border py-2 text-center text-xs font-semibold text-text-tertiary opacity-60">
                      {t('metaAudit.openAdLauncher', 'Open in Ad Launcher')}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
