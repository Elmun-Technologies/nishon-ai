'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Filter,
  ImageIcon,
  Layers,
  LayoutGrid,
  Search,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button, Alert, Dialog } from '@/components/ui'
import { cn } from '@/lib/utils'

type AdTab = 'ads' | 'new' | 'clusters' | 'insights'

type LauncherRow = {
  id: string
  name: string
  spend: number
  editedLabel: string
  editedTs: number
  cpl: number
  kind: Exclude<AdTab, 'insights'>
}

const TABS: Array<{ id: AdTab; labelKey: string; fallback: string; icon: typeof LayoutGrid }> = [
  { id: 'ads', labelKey: 'adLauncher.tabAds', fallback: 'Ads', icon: LayoutGrid },
  { id: 'new', labelKey: 'adLauncher.tabNewAds', fallback: 'New Ads', icon: ImageIcon },
  { id: 'clusters', labelKey: 'adLauncher.tabClusters', fallback: 'Creative clusters', icon: Layers },
  { id: 'insights', labelKey: 'adLauncher.tabInsights', fallback: 'Insights', icon: BarChart3 },
]

const MOCK_ROWS: LauncherRow[] = [
  { id: '120001', kind: 'ads', name: 'Carousel — Winter sale', spend: 1240, editedLabel: '2025-04-12', editedTs: 1712966400000, cpl: 4.2 },
  { id: '120002', kind: 'ads', name: 'Video — Product demo 15s', spend: 890, editedLabel: '2025-04-10', editedTs: 1712793600000, cpl: 6.1 },
  { id: '120003', kind: 'ads', name: 'Single image — Lead form', spend: 2100, editedLabel: '2025-04-08', editedTs: 1712620800000, cpl: 3.4 },
  { id: '120004', kind: 'ads', name: 'Collection — Catalog sales', spend: 450, editedLabel: '2025-04-01', editedTs: 1712016000000, cpl: 8.9 },
  { id: '120005', kind: 'ads', name: 'Reels — UGC testimonial', spend: 320, editedLabel: '2025-03-28', editedTs: 1711584000000, cpl: 5.5 },
  { id: 'n2001', kind: 'new', name: 'Draft — Spring lookbook', spend: 0, editedLabel: '2025-04-11', editedTs: 1712880000000, cpl: 0 },
  { id: 'n2002', kind: 'new', name: 'Draft — Promo countdown', spend: 0, editedLabel: '2025-04-09', editedTs: 1712707200000, cpl: 0 },
  { id: 'n2003', kind: 'new', name: 'Draft — Stylist cut 6s', spend: 0, editedLabel: '2025-04-05', editedTs: 1712361600000, cpl: 0 },
  { id: 'c3001', kind: 'clusters', name: 'Cluster — Top hooks A/B', spend: 560, editedLabel: '2025-04-07', editedTs: 1712534400000, cpl: 4.8 },
  { id: 'c3002', kind: 'clusters', name: 'Cluster — UGC pack #2', spend: 720, editedLabel: '2025-04-06', editedTs: 1712448000000, cpl: 5.1 },
  { id: 'c3003', kind: 'clusters', name: 'Cluster — Static + logo', spend: 180, editedLabel: '2025-03-30', editedTs: 1711843200000, cpl: 9.2 },
]

const AD_SETS: Array<{ id: string; label: string; memberIds: string[] }> = [
  { id: 'as1', label: 'Prospecting / Advantage+ shopping', memberIds: ['120001', '120002', '120005'] },
  { id: 'as2', label: 'Retargeting — 30d visitors', memberIds: ['120003', '120004'] },
  { id: 'as3', label: 'Drafts bucket', memberIds: ['n2001', 'n2002'] },
]

const INSPIRATION_IDS = ['120003', '120001', 'n2001'] as const

const STORAGE_KEY = 'adlauncher-selection-v1'

function formatMoney(n: number) {
  if (n <= 0) return '—'
  return `$${n.toLocaleString()}`
}

export default function AdLauncherPage() {
  const { t } = useI18n()
  const al = (k: string, fb: string) => t(`adLauncher.${k}`, fb)

  const [tab, setTab] = useState<AdTab>('ads')
  const [selected, setSelected] = useState<Record<string, LauncherRow>>({})
  const [sortMode, setSortMode] = useState<'edited_desc' | 'spend_desc' | 'spend_asc'>('edited_desc')
  const [metric, setMetric] = useState<'cpl' | 'spend'>('cpl')
  const [minSpend, setMinSpend] = useState('0')
  const [search, setSearch] = useState('')
  const [smartOn, setSmartOn] = useState(false)
  const [manualId, setManualId] = useState('')
  const [creativePreset, setCreativePreset] = useState('new')
  const [showInspiration, setShowInspiration] = useState(false)
  const [showAdSets, setShowAdSets] = useState(false)
  const [pickedSets, setPickedSets] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'info' | 'warning'; text: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const rowById = useMemo(() => Object.fromEntries(MOCK_ROWS.map((r) => [r.id, r])), [])

  useEffect(() => {
    if (!feedback) return
    const tmr = window.setTimeout(() => setFeedback(null), 4200)
    return () => window.clearTimeout(tmr)
  }, [feedback])

  const addToSelection = useCallback((rows: LauncherRow[], notify?: boolean) => {
    setSelected((prev) => {
      let added = 0
      const next = { ...prev }
      for (const r of rows) {
        if (!next[r.id]) {
          next[r.id] = r
          added += 1
        }
      }
      if (notify) {
        queueMicrotask(() => {
          setFeedback({
            variant: added === 0 ? 'info' : 'success',
            text:
              added === 0
                ? t('adLauncher.alreadySelected', 'Already in selection.')
                : t('adLauncher.addedOk', 'Added to selection.'),
          })
        })
      }
      return next
    })
  }, [t])

  const toggleRow = useCallback((row: LauncherRow) => {
    setSelected((prev) => {
      if (prev[row.id]) {
        const next = { ...prev }
        delete next[row.id]
        return next
      }
      return { ...prev, [row.id]: row }
    })
  }, [])

  const removeSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const filteredRows = useMemo(() => {
    const min = Math.max(0, parseFloat(minSpend) || 0)
    let list = MOCK_ROWS.filter((r) => r.kind === tab)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    list = list.filter((r) => r.spend >= min)
    if (smartOn) list = list.filter((r) => r.spend >= 200)
    const sorted = [...list]
    if (metric === 'cpl') {
      sorted.sort((a, b) => (a.cpl || 999) - (b.cpl || 999))
    } else if (sortMode === 'edited_desc') {
      sorted.sort((a, b) => b.editedTs - a.editedTs)
    } else if (sortMode === 'spend_desc') {
      sorted.sort((a, b) => b.spend - a.spend)
    } else {
      sorted.sort((a, b) => a.spend - b.spend)
    }
    return sorted
  }, [tab, search, minSpend, smartOn, sortMode, metric])

  const insights = useMemo(() => {
    const adsOnly = MOCK_ROWS.filter((r) => r.kind === 'ads')
    const spend = adsOnly.reduce((s, r) => s + r.spend, 0)
    const withCpl = adsOnly.filter((r) => r.cpl > 0)
    const avgCpl = withCpl.length ? withCpl.reduce((s, r) => s + r.cpl, 0) / withCpl.length : 0
    return { spend, count: adsOnly.length, avgCpl }
  }, [])

  const previewCount = Object.keys(selected).length

  const handleSave = () => {
    if (previewCount === 0) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.values(selected).map((r) => r.id)))
    } catch {
      /* ignore */
    }
    setFeedback({ variant: 'success', text: t('adLauncher.savedOk', 'Selection saved for this browser session.') })
  }

  const handleManualApply = () => {
    const id = manualId.trim()
    if (!id) {
      setFeedback({ variant: 'warning', text: t('adLauncher.invalidId', 'Enter an ad ID.') })
      return
    }
    const known = rowById[id]
    if (known) addToSelection([known], true)
    else {
      const synthetic: LauncherRow = {
        id,
        name: `Ad ${id}`,
        spend: 0,
        editedLabel: '—',
        editedTs: Date.now(),
        cpl: 0,
        kind: 'ads',
      }
      addToSelection([synthetic], true)
    }
    setManualId('')
  }

  const handleAdSetsConfirm = () => {
    const ids = new Set<string>()
    AD_SETS.forEach((s) => {
      if (pickedSets[s.id]) s.memberIds.forEach((id) => ids.add(id))
    })
    const rows = Array.from(ids)
      .map((id) => rowById[id])
      .filter(Boolean) as LauncherRow[]
    if (rows.length) addToSelection(rows, true)
    setShowAdSets(false)
    setPickedSets({})
  }

  const handleInspiration = (idx: number) => {
    const id = INSPIRATION_IDS[idx]
    const row = rowById[id]
    if (row) addToSelection([row], true)
  }

  const renderTable = () => (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
      <table className="min-w-[640px] w-full border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-tertiary dark:bg-surface-elevated">
          <tr>
            <th className="w-12 px-3 py-2.5" aria-label="Select" />
            <th className="px-3 py-2.5">{al('columnAd', 'Ad')}</th>
            <th className="px-3 py-2.5">{al('columnSpend', 'Spend')}</th>
            <th className="px-3 py-2.5">{al('columnCpl', 'CPL')}</th>
            <th className="px-3 py-2.5">{al('columnEdited', 'Last edited')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center">
                {search.trim() || smartOn || (parseFloat(minSpend) || 0) > 0 ? (
                  <p className="text-text-tertiary">{al('emptyFiltered', 'No rows match your filters.')}</p>
                ) : (
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Layers className="h-6 w-6 opacity-80" />
                    </div>
                    <p className="font-medium text-text-primary">{t('adLauncher.emptyTitle', 'No data for this time frame')}</p>
                    <p className="mt-1 text-sm text-text-tertiary">
                      {t(
                        'adLauncher.emptyBody',
                        'Choose another date range or connect Meta to load ads and creatives into the launcher.',
                      )}
                    </p>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => {
              const on = Boolean(selected[row.id])
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'cursor-pointer border-b border-border/60 transition-colors last:border-0',
                    on ? 'bg-primary/8' : 'hover:bg-surface-2/80',
                  )}
                  onClick={() => toggleRow(row)}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleRow(row)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-border text-primary focus:ring-primary/30"
                      aria-label={row.name}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-text-primary">{row.name}</p>
                    <p className="text-xs text-text-tertiary">ID {row.id}</p>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-text-secondary">{formatMoney(row.spend)}</td>
                  <td className="px-3 py-2.5 tabular-nums text-text-secondary">{row.cpl > 0 ? `$${row.cpl.toFixed(2)}` : '—'}</td>
                  <td className="px-3 py-2.5 text-text-secondary">{row.editedLabel}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )

  const renderInsights = () => (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">{al('insightsHint', 'Aggregates from sample data until Meta is connected.')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-tertiary">{al('insightSpend', 'Total spend (sample)')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{formatMoney(insights.spend)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-tertiary">{al('insightRows', 'Rows in view')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{insights.count}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-tertiary">{al('insightAvgCpl', 'Avg CPL (sample)')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">${insights.avgCpl.toFixed(2)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-surface-2/50 p-4 text-sm text-text-secondary dark:bg-surface-2/30">
        {t('adLauncher.emptyBody', 'Choose another date range or connect Meta to load ads and creatives into the launcher.')}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 pb-8">
      <section className="rounded-2xl border border-border bg-surface-2/80 p-3 dark:bg-surface-elevated/80">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={
            <span className="inline-flex items-center gap-2">
              {t('adLauncher.title', 'Ad Launcher')}
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-text-tertiary"
                title={t('adLauncher.infoHint', 'Pick ads, presets, and filters before pushing to Meta.')}
              >
                ?
              </span>
            </span>
          }
          subtitle={t('adLauncher.subtitle', 'Search, sort, and bundle creatives — launcher shell (connect Meta sync when ready).')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="border-primary/30"
                onClick={() => setShowInspiration((v) => !v)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('adLauncher.findInspiration', 'Find inspiration')}
              </Button>
              <Button size="sm" type="button" className="gap-1" onClick={() => setShowAdSets(true)}>
                {t('adLauncher.selectAdSets', 'Select existing ad sets')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </section>

      {showInspiration && (
        <Alert variant="info" className="border-primary/25 bg-primary/5 text-text-primary">
          <p className="font-medium">{al('inspirationTitle', 'Suggested picks')}</p>
          <p className="mt-1 text-sm text-text-secondary">{al('inspirationBody', 'Tap to add sample ads to your selection.')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => handleInspiration(0)}>
              {al('suggest1', 'Top video prospecting')}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => handleInspiration(1)}>
              {al('suggest2', 'Carousel retargeting')}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => handleInspiration(2)}>
              {al('suggest3', 'Lead form winner')}
            </Button>
          </div>
        </Alert>
      )}

      {feedback && (
        <Alert variant={feedback.variant === 'warning' ? 'warning' : feedback.variant}>
          <div className="flex items-start justify-between gap-3">
            <span>{feedback.text}</span>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
              aria-label="Close"
              onClick={() => setFeedback(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      )}

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <Alert variant="info" className="py-2 text-sm">
            {al('demoBanner', 'Preview mode: sample rows below. Connect Meta to load live ads.')}
          </Alert>

          <div className="flex gap-1 overflow-x-auto border-b border-border">
            {TABS.map(({ id, labelKey, fallback, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  tab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary',
                )}
              >
                <Icon className="h-4 w-4 opacity-80" />
                {t(labelKey, fallback)}
              </button>
            ))}
          </div>

          {tab !== 'insights' && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                className="min-w-[160px] rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs dark:bg-surface"
              >
                <option value="edited_desc">{t('adLauncher.sortBy', 'Sort by: Last edited')}</option>
                <option value="spend_desc">Sort by: Spend (high → low)</option>
                <option value="spend_asc">Sort by: Spend (low → high)</option>
              </select>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1.5 dark:bg-surface">
                <span className="text-[10px] text-text-tertiary">{t('adLauncher.metric', 'Metric')}</span>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as 'cpl' | 'spend')}
                  className="min-w-[120px] bg-transparent text-xs font-medium outline-none"
                >
                  <option value="cpl">{t('adLauncher.cpl', 'Cost per lead (All)')}</option>
                  <option value="spend">Spend</option>
                </select>
              </div>
              <label className="flex items-center gap-1 text-xs text-text-secondary">
                <span className="text-text-tertiary">{t('adLauncher.minSpend', 'Min. spend')}</span>
                <span className="text-text-tertiary">$</span>
                <input
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="w-16 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs tabular-nums dark:bg-surface"
                />
              </label>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={al('searchPlaceholder', 'Search by name or ID…')}
                className="min-w-[160px] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-primary md:max-w-xs dark:bg-surface"
              />
              <button
                type="button"
                onClick={() => {
                  searchRef.current?.focus()
                  setFeedback({
                    variant: 'info',
                    text: t('adLauncher.filterFocusHint', 'Use the search field above to filter the list.'),
                  })
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
              >
                <Search className="h-3.5 w-3.5" />
                {t('adLauncher.filterData', 'Filter data')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSmartOn((v) => !v)
                  setFeedback({
                    variant: 'info',
                    text: !smartOn
                      ? t('adLauncher.smartOn', 'Smart filter on (spend ≥ $200)')
                      : t('adLauncher.smartOff', 'Smart filter off'),
                  })
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                  smartOn
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-text-secondary hover:bg-surface-2',
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                {t('adLauncher.smartFilter', 'Smart filter')}
              </button>
            </div>
          )}

          <div className="min-h-[280px]">
            {tab === 'insights' ? (
              renderInsights()
            ) : (
              <>
                {tab === 'new' && (
                  <p className="mb-2 text-sm font-medium text-text-primary">{al('newAdsTitle', 'Draft new ads')}</p>
                )}
                {tab === 'clusters' && (
                  <p className="mb-2 text-sm font-medium text-text-primary">{al('clustersTitle', 'Creative clusters')}</p>
                )}
                {renderTable()}
              </>
            )}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:w-80">
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2.5 dark:bg-surface-elevated">
            <span className="text-xs font-semibold text-text-primary">
              {t('adLauncher.previewTitle', 'Ad selection preview')} ({previewCount})
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t('adLauncher.creativeSet', 'Creative set')}
              </label>
              <select
                value={creativePreset}
                onChange={(e) => setCreativePreset(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs dark:bg-surface"
              >
                <option value="new">{t('adLauncher.newPreset', 'New preset')}</option>
                <option value="evergreen">Evergreen pack</option>
                <option value="promo">Promo burst</option>
              </select>
              <Button type="button" size="sm" variant="primary" disabled={previewCount === 0} onClick={handleSave} className="w-full">
                {t('adLauncher.saveSelection', 'Save creative selection')}
              </Button>
            </div>
            <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
              <p className="text-xs font-medium text-text-primary">{t('adLauncher.manualAdd', 'Manually add by')}</p>
              <select className="w-full rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs dark:bg-surface">
                <option>Ad ID</option>
              </select>
              <input
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={t('adLauncher.adIdPlaceholder', 'Enter an ad ID to add')}
                className="w-full rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs dark:bg-surface"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualApply()
                }}
              />
              <Button type="button" size="sm" variant="secondary" className="w-full" onClick={handleManualApply}>
                {t('common.apply', 'Apply')}
              </Button>
            </div>
            {previewCount > 0 && (
              <div className="max-h-56 space-y-2 overflow-y-auto border-t border-border pt-3">
                {Object.values(selected).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs dark:bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{row.name}</p>
                      <p className="text-text-tertiary">{row.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelected(row.id)}
                      className="shrink-0 rounded p-1 text-text-tertiary hover:bg-surface hover:text-text-primary"
                      aria-label={al('remove', 'Remove')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={showAdSets} onClose={() => setShowAdSets(false)} title={al('adSetsModalTitle', 'Existing ad sets')}>
        <p className="mb-4 text-sm text-text-secondary">{al('adSetsHint', 'Select ad sets. Their ads are added to your tray.')}</p>
        <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto">
          {AD_SETS.map((s) => (
            <li key={s.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={Boolean(pickedSets[s.id])}
                  onChange={() => setPickedSets((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  className="mt-0.5 rounded border-border text-primary"
                />
                <span>
                  <span className="font-medium text-text-primary">{s.label}</span>
                  <span className="mt-0.5 block text-xs text-text-tertiary">{s.memberIds.length} ads</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowAdSets(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="button" onClick={handleAdSetsConfirm}>
            {al('addToTray', 'Add to tray')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
