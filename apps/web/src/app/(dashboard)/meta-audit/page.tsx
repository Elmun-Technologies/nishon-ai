'use client'

import { useMemo, useState } from 'react'
import { Compass, Filter, RefreshCw, Search } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button, Dialog } from '@/components/ui'

type AuditTab =
  | 'meta'
  | 'targeting'
  | 'auction'
  | 'geo'
  | 'creative'
  | 'adcopy'

const TAB_IDS: AuditTab[] = ['meta', 'targeting', 'auction', 'geo', 'creative', 'adcopy']

const CREATIVE_FORMATS = [
  { id: 'image', labelKey: 'metaAudit.formatImage', fallback: 'Image', icon: '🖼' },
  { id: 'short', labelKey: 'metaAudit.formatShortVideo', fallback: 'Short Video', icon: '▶' },
  { id: 'medium', labelKey: 'metaAudit.formatMediumVideo', fallback: 'Medium Video', icon: '▶▶' },
  { id: 'long', labelKey: 'metaAudit.formatLongVideo', fallback: 'Long Video', icon: '▶▶▶' },
  { id: 'carousel', labelKey: 'metaAudit.formatCarousel', fallback: 'Carousel', icon: '◫' },
  { id: 'dpa', labelKey: 'metaAudit.formatDpa', fallback: 'DPA', icon: '⊞' },
] as const

function MetaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function MetaAuditPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<AuditTab>('meta')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minSpend, setMinSpend] = useState('0')
  const [maxSpend, setMaxSpend] = useState('0')
  const [gradedBy, setGradedBy] = useState('leads')

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

  const showCreativeChrome = tab === 'creative' || tab === 'adcopy'

  return (
    <div className="space-y-4 max-w-7xl pb-8">
      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('metaAudit.allFilters', 'All filters')}
        className="max-w-3xl max-h-[min(90vh,640px)] overflow-y-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
              {t('metaAudit.filterCreativeType', 'Creative type')}
            </p>
            <ul className="space-y-2">
              {CREATIVE_FORMATS.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-text-secondary cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-border" />
                  <span>{t(f.labelKey, f.fallback)}</span>
                </label>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
              {t('metaAudit.filterFunnel', 'Funnel stage')}
            </p>
            <ul className="space-y-2">
              {['Acquisition', 'Retargeting', 'Retention'].map((x) => (
                <label key={x} className="flex items-center gap-2 text-text-secondary cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  {x}
                </label>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
              {t('metaAudit.filterPlacement', 'Placement')}
            </p>
            <ul className="space-y-2">
              {['Facebook Feed', 'Instagram Feed', 'Stories', 'Audience Network'].map((x) => (
                <label key={x} className="flex items-center gap-2 text-text-secondary cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  {x}
                </label>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
              {t('metaAudit.filterDevice', 'Device')}
            </p>
            <ul className="space-y-2">
              {['Desktop', 'Mobile app', 'Mobile web'].map((x) => (
                <label key={x} className="flex items-center gap-2 text-text-secondary cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  {x}
                </label>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border bg-surface-2/40 p-4 text-center text-sm text-text-tertiary">
          {t('metaAudit.filtersEmptyPreview', 'No rows match these filters yet. Apply to refresh the workspace view.')}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <button type="button" className="text-sm font-medium text-violet-600 dark:text-violet-300 hover:underline">
            {t('metaAudit.clearFilters', 'Clear filters')}
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" onClick={() => setFiltersOpen(false)}>
              {t('metaAudit.applyFilters', 'Apply filters')}
            </Button>
          </div>
        </div>
      </Dialog>

      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={
            <span className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-sm">
                <Compass className="h-4 w-4" />
              </span>
              {t('metaAudit.title', '360° Meta Audit')}
            </span>
          }
          subtitle={t('metaAudit.subtitle', 'Deep-dive tabs for Meta performance — UI preview, wire to live data later.')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white/90 px-3 py-2 text-xs font-medium text-text-secondary shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-900/80"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('common.refresh', 'Refresh')}
              </button>
              <div className="rounded-xl border border-border bg-white/90 px-3 py-2 text-xs font-medium text-text-primary shadow-sm dark:border-slate-600 dark:bg-slate-900/80">
                {t('metaAudit.last7Days', 'Last 7 days')}
                <span className="text-text-tertiary font-normal ml-1">· Apr 12 – Apr 19</span>
              </div>
            </div>
          }
        />
      </section>

      {/* Primary tabs */}
      <div className="border-b border-border/80 overflow-x-auto">
        <nav className="flex gap-1 min-w-max pb-px" aria-label="Meta audit sections">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? 'border-violet-500 text-violet-600 dark:text-violet-300'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tabLabels[id]}
            </button>
          ))}
        </nav>
      </div>

      {/* Control bar */}
      <div className="rounded-xl border border-border/70 bg-white/90 p-3 shadow-sm flex flex-wrap items-center gap-2 dark:bg-slate-900/70">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-2"
        >
          <Search className="h-3.5 w-3.5" />
          {t('metaAudit.filterData', 'Filter data')}
        </button>
        <select className="rounded-lg border border-border bg-surface px-2 py-2 text-xs text-text-secondary min-w-[140px]">
          <option>{t('metaAudit.loadPreset', 'Load filter preset…')}</option>
          <option>{t('metaAudit.presetWinners', 'Winning ad sets')}</option>
          <option>{t('metaAudit.presetLearning', 'Learning limited')}</option>
        </select>
        <button
          type="button"
          disabled
          className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-tertiary cursor-not-allowed"
        >
          {t('metaAudit.saveView', 'Save this view')}
        </button>
        <div className="flex-1 min-w-[120px]" />
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5">
          <MetaGlyph className="h-4 w-4 text-blue-500 shrink-0" />
          <select className="bg-transparent text-xs font-medium text-text-primary outline-none min-w-[100px]">
            <option>ROAS (All)</option>
            <option>{t('metaAudit.kpiLeads', 'Leads (All)')}</option>
            <option>{t('metaAudit.kpiSpend', 'Amount spent')}</option>
          </select>
        </div>
      </div>

      {/* Tab: Creative / Ad copy */}
      {showCreativeChrome && (
        <>
          <div className="rounded-xl border border-border/70 bg-violet-500/5 dark:bg-violet-950/20 px-3 py-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary">{t('metaAudit.gradedBy', 'Graded by')}</span>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1">
                <MetaGlyph className="h-3.5 w-3.5 text-blue-500" />
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
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-200 hover:bg-violet-500/15"
            >
              <Filter className="h-3.5 w-3.5" />
              {t('metaAudit.smartFilter', 'Smart filter')}
            </button>
          </div>

          {tab === 'creative' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                {CREATIVE_FORMATS.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-border/80 bg-white/95 p-3 shadow-sm dark:bg-slate-900/80 flex flex-col gap-2 min-h-[160px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-lg" aria-hidden>
                        {f.icon}
                      </span>
                      <span className="text-[11px] font-semibold text-text-primary truncate">{t(f.labelKey, f.fallback)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] flex-1">
                      <span className="text-text-tertiary">{t('metaAudit.amountSpent', 'Spend')}</span>
                      <span className="text-right font-medium tabular-nums">$0</span>
                      <span className="text-text-tertiary">{t('metaAudit.cpl', 'CPL')}</span>
                      <span className="text-right font-medium tabular-nums">—</span>
                      <span className="text-text-tertiary">CTR</span>
                      <span className="text-right font-medium tabular-nums">0%</span>
                      <span className="text-text-tertiary">{t('metaAudit.convRate', 'Conv. rate')}</span>
                      <span className="text-right font-medium tabular-nums">—</span>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-border/60">
                      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full w-0 bg-violet-500 rounded-full" />
                      </div>
                      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full w-0 bg-blue-500 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[9px] text-text-tertiary">
                        <span>{t('metaAudit.leadsBar', 'Leads')}</span>
                        <span>{t('metaAudit.spendBar', 'Spend')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <section className="rounded-2xl border border-border/70 bg-white/95 shadow-sm overflow-hidden dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
                  <h2 className="text-sm font-semibold text-text-primary">{t('metaAudit.creativeMatrix', 'Creative matrix')}</h2>
                  <button
                    type="button"
                    className="text-xs font-semibold text-violet-600 dark:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/40 hover:bg-violet-500/10"
                  >
                    {t('metaAudit.seeAllCreatives', 'See all creatives')}
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative mx-auto max-w-lg aspect-square rounded-2xl border border-border/60 bg-gradient-to-br from-cyan-100/90 via-white to-rose-100/95 dark:from-cyan-950/50 dark:via-slate-900 dark:to-rose-950/40 shadow-inner">
                    <span className="absolute left-1 top-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 [writing-mode:vertical-rl] rotate-180">
                      {t('metaAudit.quadrantScalable', 'SCALABLE')}
                    </span>
                    <span className="absolute right-1 top-4 text-[10px] font-bold text-indigo-800 dark:text-indigo-200 [writing-mode:vertical-rl]">
                      {t('metaAudit.quadrantCore', 'CORE PERFORMERS')}
                    </span>
                    <span className="absolute left-1 bottom-4 text-[10px] font-bold text-rose-500 [writing-mode:vertical-rl] rotate-180">
                      {t('metaAudit.quadrantStarted', 'GETTING STARTED')}
                    </span>
                    <span className="absolute right-1 bottom-4 text-[10px] font-bold text-pink-600 [writing-mode:vertical-rl]">
                      {t('metaAudit.quadrantOverspend', 'OVERSPEND')}
                    </span>
                    <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-semibold text-text-tertiary">
                      {t('metaAudit.axisLeads', 'Leads (All)')}
                    </span>
                    <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-text-tertiary">
                      {t('metaAudit.axisSpend', 'Spend')}
                    </span>
                    <div className="absolute inset-8 flex items-center justify-center pointer-events-none">
                      <p className="text-xs text-text-tertiary text-center px-4">
                        {t('metaAudit.matrixEmpty', 'Creatives (0) — connect Meta and sync to plot performance.')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3 bg-surface-2/30 dark:bg-slate-900/90 text-xs">
                  <span className="text-text-secondary">{t('metaAudit.creativesCount', 'Creatives (0)')}</span>
                  <select className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs">
                    <option>{t('metaAudit.sortLeadsHigh', 'Sort: Leads (high first)')}</option>
                  </select>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-text-tertiary">{t('metaAudit.selectedCount', '0 selected')}</span>
                    <button
                      type="button"
                      disabled
                      className="rounded-lg bg-violet-500/30 text-white/80 px-3 py-1.5 text-xs font-semibold cursor-not-allowed"
                    >
                      {t('metaAudit.openInLauncher', 'Open in Ads Launcher')}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === 'adcopy' && (
            <section className="rounded-2xl border border-border/70 bg-white/95 p-6 shadow-sm dark:bg-slate-900/80">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
                <span className="text-text-secondary">{t('metaAudit.piecesOfCopy', 'Pieces of copy (0)')}</span>
                <select className="rounded-lg border border-border bg-surface px-2 py-1.5">
                  <option>{t('metaAudit.sortLeadsHigh', 'Sort: Leads (high first)')}</option>
                </select>
                <span className="text-text-tertiary">{t('metaAudit.selectedCount', '0 selected')}</span>
                <button type="button" disabled className="rounded-lg border border-violet-500/40 px-3 py-1.5 text-violet-400 cursor-not-allowed text-xs font-semibold">
                  {t('metaAudit.openInLauncher', 'Open in Ads Launcher')}
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold mb-3">{t('metaAudit.adCopyLength', 'Ad copy length (0)')}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Short', 'Medium', 'Long'] as const).map((len) => (
                      <div key={len} className="rounded-lg border border-border/80 bg-surface-2/40 p-3 text-center">
                        <p className="text-xs font-bold text-text-primary mb-2">{len}</p>
                        <p className="text-[10px] text-text-tertiary">{t('metaAudit.placeholderMetrics', 'Amount · CPL · CTR')}</p>
                        <p className="text-lg font-semibold text-text-tertiary mt-2">—</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { title: t('metaAudit.emojiPerf', 'Emoji performance'), with: '😀', without: t('metaAudit.without', 'Without') },
                    { title: t('metaAudit.linkPerf', 'Link performance'), with: '🔗', without: t('metaAudit.without', 'Without') },
                  ].map((c) => (
                    <div key={c.title} className="rounded-xl border border-border p-3">
                      <p className="text-xs font-semibold mb-2">{c.title}</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-surface-2/50 p-2">
                          <span className="text-text-tertiary">{t('metaAudit.with', 'With')} {c.with}</span>
                          <p className="font-semibold text-text-primary mt-1">—</p>
                        </div>
                        <div className="rounded-lg bg-surface-2/50 p-2">
                          <span className="text-text-tertiary">{c.without}</span>
                          <p className="font-semibold text-text-primary mt-1">—</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Other tabs: placeholder audit surface */}
      {!showCreativeChrome && (
        <section className="rounded-2xl border border-border/70 bg-white/95 p-8 text-center shadow-sm dark:bg-slate-900/80">
          <p className="text-sm font-medium text-text-primary mb-1">{tabLabels[tab]}</p>
          <p className="text-xs text-text-tertiary max-w-md mx-auto">
            {t(
              'metaAudit.tabPlaceholder',
              'This audit view is scaffolded for layout parity. Hook charts and tables to Meta sync when endpoints are ready.',
            )}
          </p>
        </section>
      )}
    </div>
  )
}
