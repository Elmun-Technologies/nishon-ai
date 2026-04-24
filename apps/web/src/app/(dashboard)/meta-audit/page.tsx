'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { meta as metaApi } from '@/lib/api-client'
import { Alert, Button, Dialog } from '@/components/ui'
import { cn } from '@/lib/utils'

import { AuditHeader } from './_components/AuditHeader'
import { AuditToolbar } from './_components/AuditToolbar'
import { AuditFindingsCard } from './_components/AuditFindingsCard'
import { MetaDashboardTab } from './_components/tabs/MetaDashboardTab'
import { TargetingTab } from './_components/tabs/TargetingTab'
import { AuctionTab } from './_components/tabs/AuctionTab'
import { GeoTab } from './_components/tabs/GeoTab'
import { CreativeTab } from './_components/tabs/CreativeTab'
import { AdCopyTab } from './_components/tabs/AdCopyTab'

import { TAB_IDS, CREATIVE_FORMATS, VIEW_STORAGE } from './_components/constants'
import { daysForDateRange, flattenReportData, computeAuditFindings, median } from './_components/utils'
import type { AuditTab, KpiMode, Persona, DateRange, ReportData } from './_components/types'

export default function MetaAuditPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()

  // Tab & UI state
  const [tab, setTab] = useState<AuditTab>('meta')
  const [persona, setPersona] = useState<Persona>('owner')
  const [kpi, setKpi] = useState<KpiMode>('roas')
  const [introOpen, setIntroOpen] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('7')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')
  const [preset, setPreset] = useState('')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [minSpend, setMinSpend] = useState('0')
  const [maxSpend, setMaxSpend] = useState('0')
  const [gradedBy, setGradedBy] = useState('leads')
  const [selectedFormats, setSelectedFormats] = useState<Record<string, boolean>>({})
  const [selectedCopy, setSelectedCopy] = useState<Record<string, boolean>>({})

  // Live data state
  const [liveData, setLiveData] = useState<ReportData | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const reportingDays = useMemo(
    () => daysForDateRange(dateRange, customFromDate, customToDate),
    [dateRange, customFromDate, customToDate],
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
      .then((res) => setLiveData(res.data as ReportData))
      .catch(() => {
        setLiveData(null)
        setLiveError(t('metaAudit.loadError', 'Could not load Meta reporting. Check that Meta Ads is connected for this workspace.'))
      })
      .finally(() => {
        setLiveLoading(false)
        setLastRefresh(new Date())
      })
  }, [currentWorkspace?.id, reportingDays, t])

  useEffect(() => { loadReporting() }, [loadReporting])

  const liveRows = useMemo(() => (liveData ? flattenReportData(liveData) : []), [liveData])
  const isLiveData = liveRows.length > 0
  const hasReportingAccounts = Boolean(liveData && liveData.accounts.length > 0)
  const noCampaignRows = hasReportingAccounts && liveRows.length === 0 && !liveError

  // Reset KPI when data mode changes
  useEffect(() => {
    if (isLiveData && (kpi === 'roas' || kpi === 'leads')) setKpi('spend')
  }, [isLiveData, kpi])
  useEffect(() => {
    if (!isLiveData && (kpi === 'ctr' || kpi === 'clicks')) setKpi('roas')
  }, [isLiveData, kpi])

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return
    const id = window.setTimeout(() => setFeedback(null), 4000)
    return () => window.clearTimeout(id)
  }, [feedback])

  const tabLabels: Record<AuditTab, string> = useMemo(
    () => ({
      meta:      t('metaAudit.tabMeta',      'Meta Dashboard'),
      targeting: t('metaAudit.tabTargeting', 'Targeting Insights'),
      auction:   t('metaAudit.tabAuction',   'Auction Insights'),
      geo:       t('metaAudit.tabGeo',       'Geo & Demo Insights'),
      creative:  t('metaAudit.tabCreative',  'Creative Insights'),
      adcopy:    t('metaAudit.tabAdcopy',    'Ad Copy Insights'),
    }),
    [t],
  )

  const tabHelp: Record<AuditTab, string> = useMemo(
    () =>
      isLiveData
        ? {
            meta:      t('metaAudit.metaHelpLive',      'Account snapshot from synced reporting: spend, CTR, CPC, and campaigns in this date range.'),
            targeting: t('metaAudit.targetingHelpLive', 'Illustrative layout. Audience overlap and fatigue still require breakdowns not yet in this reporting feed.'),
            auction:   t('metaAudit.auctionHelpLive',   'Illustrative layout. Auction diagnostics need placement/auction breakdowns from Meta.'),
            geo:       t('metaAudit.geoHelpLive',       'Illustrative layout. Geo split is not in the current campaign-level reporting payload.'),
            creative:  t('metaAudit.creativeHelpLive',  'Illustrative layout. Use Reporting export or Ads Manager for creative-level IDs.'),
            adcopy:    t('metaAudit.adcopyHelpLive',    'Illustrative layout. Copy-level metrics need ad-level breakdowns.'),
          }
        : {
            meta:      t('metaAudit.metaHelp',      'Account snapshot: spend, ROAS, and top campaigns (sample).'),
            targeting: t('metaAudit.targetingHelp', 'Audience breadth vs. performance — spot overlap or fatigue risk (sample).'),
            auction:   t('metaAudit.auctionHelp',   'Auction pressure and delivery — why costs move (sample).'),
            geo:       t('metaAudit.geoHelp',       'Budget split by region — where results come from (sample).'),
            creative:  t('metaAudit.creativeHelp',  'Formats and a simple performance map — pick winners for Ad Launcher (sample).'),
            adcopy:    t('metaAudit.adcopyHelp',    'Headline and body patterns vs. metrics (sample).'),
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
    if (dateRange === 'custom' && customFromDate && customToDate) return `${customFromDate} → ${customToDate}`
    if (dateRange === 'custom') return t('metaAudit.dateCustom', 'Custom range')
    return t('metaAudit.dateMonth', 'This month')
  }, [dateRange, customFromDate, customToDate, t])

  const sampleSpendMultiplier =
    dateRange === '7' ? 1 : dateRange === '30' ? 3.2 : dateRange === 'custom' ? Math.max(reportingDays / 7, 1) : 4.5

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
    const dir = (a: typeof liveRows[0], b: typeof liveRows[0]) => {
      if (kpi === 'ctr') return b.ctr - a.ctr
      if (kpi === 'clicks') return b.clicks - a.clicks
      return b.spend - a.spend
    }
    return [...list].sort(dir)
  }, [liveRows, search, preset, kpi])

  const MOCK_CAMP = [
    { id: 'c1', name: 'Prospecting — Catalog sales', spend: 4200, roas: 2.4, status: 'Active' },
    { id: 'c2', name: 'Retargeting — 30d visitors',  spend: 1890, roas: 3.8, status: 'Active' },
    { id: 'c3', name: 'Lead gen — Instant form',     spend: 960,  roas: 1.2, status: 'Limited' },
    { id: 'c4', name: 'ASC — Advantage+ shopping',   spend: 6120, roas: 2.9, status: 'Active' },
  ]

  const filteredMockCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MOCK_CAMP
    return MOCK_CAMP.filter((c) => c.name.toLowerCase().includes(q) || c.id.includes(q))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

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
      sessionStorage.setItem(VIEW_STORAGE, JSON.stringify({ tab, kpi, preset, dateRange, at: Date.now() }))
    } catch { /* ignore */ }
    setFeedback(t('metaAudit.savedViewOk', 'View saved in this browser.'))
  }

  const onApplyFilters = () => {
    setFiltersOpen(false)
    setFeedback(t('metaAudit.filtersApplied', 'Filters applied to the preview.'))
  }

  const onClearFilters = () => {
    setFeedback(t('metaAudit.filtersCleared', 'Filters cleared.'))
  }

  const toggleFormat = (id: string) => setSelectedFormats((p) => ({ ...p, [id]: !p[id] }))
  const toggleCopy   = (id: string) => setSelectedCopy((p) => ({ ...p, [id]: !p[id] }))

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-8">

      {/* Filters dialog */}
      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('metaAudit.allFilters', 'All filters')}
        className="max-h-[min(90vh,640px)] max-w-3xl overflow-y-auto"
      >
        <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
          {[
            {
              label: t('metaAudit.filterCreativeType', 'Creative type'),
              items: CREATIVE_FORMATS.map((f) => ({ key: f.id, label: t(f.labelKey, f.fallback) })),
              checked: true,
            },
            {
              label: t('metaAudit.filterFunnel', 'Funnel stage'),
              items: ['Acquisition', 'Retargeting', 'Retention'].map((x) => ({ key: x, label: x })),
              checked: false,
            },
            {
              label: t('metaAudit.filterPlacement', 'Placement'),
              items: ['Facebook Feed', 'Instagram Feed', 'Stories', 'Audience Network'].map((x) => ({ key: x, label: x })),
              checked: false,
            },
            {
              label: t('metaAudit.filterDevice', 'Device'),
              items: ['Desktop', 'Mobile app', 'Mobile web'].map((x) => ({ key: x, label: x })),
              checked: false,
            },
          ].map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">{group.label}</p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-2 text-text-secondary">
                    <input type="checkbox" defaultChecked={group.checked} className="rounded border-border text-primary" />
                    <span>{item.label}</span>
                  </label>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4 text-center text-sm text-text-tertiary">
          {t('metaAudit.filtersEmptyPreview', 'No rows match these filters yet. Apply to refresh the workspace view.')}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={onClearFilters}>
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

      {/* Intro banner */}
      {introOpen && (
        <Alert variant="info" className="border-brand-mid/25 bg-brand-lime/10 dark:border-brand-mid/30 dark:bg-brand-lime/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-text-primary">{t('metaAudit.introTitle', 'How to use Meta Audit')}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {isLiveData
                  ? t('metaAudit.introBodyLive', 'Each tab answers one question about your Meta ads. The dashboard tab uses live reporting data; other tabs stay illustrative until deeper breakdowns sync.')
                  : t('metaAudit.introBody', 'Each tab answers one question about your Meta ads. Figures here are samples so you can learn the layout before connecting Meta.')}
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
                <li>{t('metaAudit.introStep1', 'Choose a date range and KPI (top right).')}</li>
                <li>{t('metaAudit.introStep2', 'Switch tabs: dashboard, targeting, auction, geo, creatives, and ad copy.')}</li>
                <li>{t('metaAudit.introStep3', 'Use presets and filters, then save a view you open every week.')}</li>
              </ol>
              <p className="mt-3 text-sm text-text-secondary">
                {persona === 'owner'
                  ? t('metaAudit.tipOwner', 'Prioritize spend concentration and any campaigns with spend but no clicks — those waste budget first.')
                  : t('metaAudit.tipSpecialist', 'Compare CTR and CPC to the account median; pause or retest outliers before scaling winners.')}
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

      {/* Feedback toast */}
      {feedback && (
        <Alert variant="success" className="flex items-center justify-between gap-3">
          <span>{feedback}</span>
          <button type="button" className="text-sm underline" onClick={() => setFeedback(null)}>OK</button>
        </Alert>
      )}

      {/* Live error */}
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

      {/* Header */}
      <AuditHeader
        isLiveData={isLiveData}
        liveLoading={liveLoading}
        dateRange={dateRange}
        customFromDate={customFromDate}
        customToDate={customToDate}
        dateLabel={dateLabel}
        lastRefresh={lastRefresh}
        onRefresh={onRefresh}
        onDateRangeChange={setDateRange}
        onFromDateChange={setCustomFromDate}
        onToDateChange={setCustomToDate}
      />

      {/* Tab navigation */}
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

      {/* Tab description */}
      <p className="text-sm text-text-secondary">{tabHelp[tab]}</p>

      {/* Live data notice */}
      {isLiveData && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 dark:border-amber-500/30">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
            {t('metaAudit.periodNote', 'Period-over-period is not available until daily or comparison windows are exposed by the API.')}
          </p>
        </div>
      )}

      {/* Audit findings */}
      {(isLiveData || noCampaignRows) && (
        <AuditFindingsCard findings={auditFindings} noCampaignRows={noCampaignRows} />
      )}

      {/* Empty Meta account notice */}
      {currentWorkspace && !liveLoading && liveData && liveData.accounts.length === 0 && !liveError && (
        <Alert variant="info">
          {t('metaAudit.findingEmptyConnect', 'Connect a Meta ad account in workspace settings to run a live audit.')}
        </Alert>
      )}

      {/* Toolbar */}
      <AuditToolbar
        persona={persona}
        kpi={kpi}
        isLiveData={isLiveData}
        search={search}
        showSearch={showSearch}
        preset={preset}
        onPersonaChange={setPersona}
        onKpiChange={setKpi}
        onSearchChange={setSearch}
        onShowSearch={() => { setTab('meta'); setShowSearch(true) }}
        onPresetChange={setPreset}
        onSaveView={onSaveView}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      {/* Tab content */}
      {tab === 'meta' && (
        <MetaDashboardTab
          isLiveData={isLiveData}
          liveLoading={liveLoading}
          liveTotals={liveTotals}
          filteredLiveRows={filteredLiveRows}
          filteredMockCampaigns={filteredMockCampaigns}
          kpi={kpi}
          dateLabel={dateLabel}
          sampleSpendMultiplier={sampleSpendMultiplier}
        />
      )}

      {tab === 'targeting' && <TargetingTab />}

      {tab === 'auction' && <AuctionTab />}

      {tab === 'geo' && <GeoTab />}

      {tab === 'creative' && (
        <CreativeTab
          selectedFormats={selectedFormats}
          minSpend={minSpend}
          maxSpend={maxSpend}
          gradedBy={gradedBy}
          onToggleFormat={toggleFormat}
          onMinSpendChange={setMinSpend}
          onMaxSpendChange={setMaxSpend}
          onGradedByChange={setGradedBy}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      )}

      {tab === 'adcopy' && (
        <AdCopyTab
          selectedCopy={selectedCopy}
          onToggleCopy={toggleCopy}
        />
      )}
    </div>
  )
}
