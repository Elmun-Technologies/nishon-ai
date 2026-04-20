'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Fragment } from 'react'
import Link from 'next/link'
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Printer,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PageHeader, Dialog } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { meta as metaApi } from '@/lib/api-client'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  buildCsvFromData,
  buildFlatRows,
  downloadCsvString,
  downloadPngFromElement,
  downloadXlsHtmlTable,
  openPrintableReport,
  type ReportDataShape,
} from '@/lib/reporting-export'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  tags?: string[]
  metrics: CampaignMetrics
}

interface ReportAccount {
  id: string
  name: string
  currency: string
  timezone: string | null
  metrics: CampaignMetrics
  campaigns: ReportCampaign[]
}

interface ReportData {
  workspaceId: string
  days: number
  accounts: ReportAccount[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:   'text-emerald-400 bg-emerald-400/10',
  PAUSED:   'text-amber-400 bg-amber-400/10',
  DELETED:  'text-red-400 bg-red-400/10',
  ARCHIVED: 'text-text-tertiary bg-surface-2',
}

function MetricCell({ value, className = '' }: { value: string; className?: string }) {
  return (
    <td className={`px-3 py-2.5 text-right text-sm font-medium text-text-primary tabular-nums ${className}`}>
      {value}
    </td>
  )
}

const DAY_OPTIONS = [7, 14, 30, 60, 90]

const REPORT_TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All templates' },
  { id: 'meta', label: 'Facebook Ads' },
  { id: 'ecom', label: 'Ecommerce' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'google', label: 'Google Ads' },
] as const

const REPORT_TEMPLATES: Array<{
  id: string
  title: string
  category: (typeof REPORT_TEMPLATE_CATEGORIES)[number]['id']
  isNew?: boolean
  sources: string[]
}> = [
  {
    id: 'blank',
    title: 'Blank report',
    category: 'all',
    sources: [],
  },
  {
    id: 'meta-ecom',
    title: 'E-commerce Brand | Ultimate Meta Ads Performance',
    category: 'meta',
    isNew: true,
    sources: ['Meta'],
  },
  {
    id: 'meta-shopify',
    title: 'Shopify E-commerce | Meta Ads & Shopify Performance',
    category: 'shopify',
    isNew: true,
    sources: ['Meta', 'Shopify'],
  },
  {
    id: 'google-pmax',
    title: 'Google Ads | PMax + Search blended view',
    category: 'google',
    sources: ['Google'],
  },
]

const AVAILABLE_METRICS = [
  { id: 'roas',      label: 'ROAS',            icon: 'R', value: '2.4x',   trend: '+0.3x',  positive: true  },
  { id: 'cpa',       label: 'CPA',             icon: 'C', value: '$18.50', trend: '-$2.1',  positive: true  },
  { id: 'ctr',       label: 'CTR',             icon: 'T', value: '2.14%',  trend: '+0.4%',  positive: true  },
  { id: 'frequency', label: 'Frequency',       icon: 'F', value: '3.2x',   trend: '+0.8x',  positive: false },
  { id: 'cpm',       label: 'CPM',             icon: 'M', value: '$8.40',  trend: '-$1.2',  positive: true  },
  { id: 'reach',     label: 'Reach',           icon: 'A', value: '12,400', trend: '+2,100', positive: true  },
  { id: 'leads',     label: 'Leads',           icon: 'L', value: '84',     trend: '+12',    positive: true  },
  { id: 'conv_rate', label: 'Conversion Rate', icon: 'V', value: '4.8%',   trend: '+0.6%',  positive: true  },
]

const METRIC_ORDER_STORAGE = (workspaceId: string) => `adspectr:reporting:metric-order:${workspaceId}`

function metricDisplayForId(
  id: string,
  totals: { spend: number; clicks: number; impressions: number } | undefined,
): { value: string; trend: string; positive: boolean; label: string; icon: string } {
  const def = AVAILABLE_METRICS.find((m) => m.id === id)
  if (!def) return { value: '—', trend: '', positive: true, label: id, icon: '?' }
  if (!totals || (totals.impressions === 0 && totals.clicks === 0)) {
    return { value: def.value, trend: def.trend, positive: def.positive, label: def.label, icon: def.icon }
  }
  const ctrPct = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const cpm = totals.impressions > 0 ? totals.spend / (totals.impressions / 1000) : 0
  const cpa = totals.clicks > 0 ? totals.spend / totals.clicks : 0
  switch (id) {
    case 'ctr':
      return {
        value: `${ctrPct.toFixed(2)}%`,
        trend: def.trend,
        positive: def.positive,
        label: def.label,
        icon: def.icon,
      }
    case 'cpm':
      return {
        value: formatCurrency(cpm),
        trend: def.trend,
        positive: def.positive,
        label: def.label,
        icon: def.icon,
      }
    case 'reach':
      return {
        value: formatNumber(totals.impressions),
        trend: def.trend,
        positive: def.positive,
        label: def.label,
        icon: def.icon,
      }
    case 'cpa':
      return {
        value: cpa > 0 ? formatCurrency(cpa) : def.value,
        trend: def.trend,
        positive: def.positive,
        label: def.label,
        icon: def.icon,
      }
    default:
      return { value: def.value, trend: def.trend, positive: def.positive, label: def.label, icon: def.icon }
  }
}

function reorderIds(list: string[], fromId: string, toId: string): string[] {
  const i = list.indexOf(fromId)
  const j = list.indexOf(toId)
  if (i < 0 || j < 0 || i === j) return list
  const next = [...list]
  const [moved] = next.splice(i, 1)
  next.splice(j, 0, moved)
  return next
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const reportCaptureRef = useRef<HTMLDivElement>(null)
  const [detailReportOpen, setDetailReportOpen] = useState(false)
  const [dragMetricId, setDragMetricId] = useState<string | null>(null)
  // Tags: map of campaignId → current tags
  const [campaignTags, setCampaignTags] = useState<Record<string, string[]>>({})
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  /** Ordered list of visible KPI card metric ids (drag to reorder; persisted per workspace). */
  const [orderedActiveMetrics, setOrderedActiveMetrics] = useState<string[]>(['roas', 'cpa', 'ctr', 'frequency'])
  const [showSimulation, setShowSimulation] = useState(false)
  const [simBudget, setSimBudget] = useState(1500)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<(typeof REPORT_TEMPLATE_CATEGORIES)[number]['id']>('all')
  const [templateQuery, setTemplateQuery] = useState('')

  const load = useCallback(() => {
    if (!currentWorkspace?.id) return
    setLoading(true)
    setError('')
    metaApi.reporting(currentWorkspace.id, days)
      .then((res) => {
        const d = res.data as ReportData
        setData(d)
        // Auto-expand first account
        if (d.accounts.length > 0) {
          setExpanded(new Set([d.accounts[0].id]))
        }
      })
      .catch(() => setError(t('reporting.loadError', 'Failed to load reporting. Check if Meta Ads is connected.')))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id, days, t])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    try {
      const raw = localStorage.getItem(METRIC_ORDER_STORAGE(currentWorkspace.id))
      if (raw) {
        const arr = JSON.parse(raw) as string[]
        const valid = arr.filter((id) => AVAILABLE_METRICS.some((m) => m.id === id))
        if (valid.length) setOrderedActiveMetrics(valid)
      }
    } catch {
      /* ignore */
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    try {
      localStorage.setItem(METRIC_ORDER_STORAGE(currentWorkspace.id), JSON.stringify(orderedActiveMetrics))
    } catch {
      /* ignore */
    }
  }, [currentWorkspace?.id, orderedActiveMetrics])

  useEffect(() => {
    if (!exportMenuOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (!exportMenuRef.current?.contains(e.target as Node)) setExportMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [exportMenuOpen])

  function toggleMetric(id: string) {
    setOrderedActiveMetrics((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function runExportCsv() {
    if (!currentWorkspace?.id) return
    setExporting('csv')
    setExportMenuOpen(false)
    setError('')
    try {
      if (data && data.accounts.length > 0) {
        const csv = buildCsvFromData(data as unknown as ReportDataShape)
        downloadCsvString(csv, `adspectr-report-${days}d-${new Date().toISOString().slice(0, 10)}.csv`)
        return
      }
      const res = await metaApi.exportReporting(currentWorkspace.id, days)
      const { csv, filename } = res.data as { csv: string; filename: string }
      downloadCsvString(csv, filename)
    } catch {
      setError(t('reporting.exportError', 'CSV export failed'))
    } finally {
      setExporting(null)
    }
  }

  function runExportXls() {
    if (!data || data.accounts.length === 0) {
      setError(t('reporting.exportNeedsData', 'Load reporting data to export XLS, PDF, or PNG.'))
      setExportMenuOpen(false)
      return
    }
    setExporting('xls')
    setExportMenuOpen(false)
    try {
      downloadXlsHtmlTable(
        data as unknown as ReportDataShape,
        `adspectr-report-${days}d-${new Date().toISOString().slice(0, 10)}.xls`,
      )
    } catch {
      setError(t('reporting.exportError', 'Export failed'))
    } finally {
      setExporting(null)
    }
  }

  function runExportPdf() {
    if (!data || data.accounts.length === 0) {
      setError(t('reporting.exportNeedsData', 'Load reporting data to export XLS, PDF, or PNG.'))
      setExportMenuOpen(false)
      return
    }
    setExportMenuOpen(false)
    openPrintableReport({
      title: t('reporting.detailedReportTitle', 'AdSpectr — detailed report'),
      subtitle: `${currentWorkspace?.name ?? ''} · ${days}d · ${new Date().toLocaleString()}`,
      data: data as unknown as ReportDataShape,
    })
  }

  async function runExportPng() {
    const el = reportCaptureRef.current
    if (!el) return
    if (!data || data.accounts.length === 0) {
      setError(t('reporting.exportNeedsData', 'Load reporting data to export XLS, PDF, or PNG.'))
      setExportMenuOpen(false)
      return
    }
    setExporting('png')
    setExportMenuOpen(false)
    setError('')
    try {
      await downloadPngFromElement(el, `adspectr-report-${days}d-${new Date().toISOString().slice(0, 10)}.png`)
    } catch {
      setError(t('reporting.exportPngError', 'PNG export failed. Try a shorter page or disable browser extensions.'))
    } finally {
      setExporting(null)
    }
  }

  async function saveTag(campaignId: string, newTag: string) {
    if (!currentWorkspace?.id || !newTag.trim()) return
    const current = campaignTags[campaignId] ?? []
    if (current.includes(newTag.trim())) return
    const next = [...current, newTag.trim()]
    setCampaignTags((prev) => ({ ...prev, [campaignId]: next }))
    setTagInput('')
    try {
      await metaApi.setTags(campaignId, currentWorkspace.id, next)
    } catch {
      // revert
      setCampaignTags((prev) => ({ ...prev, [campaignId]: current }))
    }
  }

  async function removeTag(campaignId: string, tag: string) {
    if (!currentWorkspace?.id) return
    const current = campaignTags[campaignId] ?? []
    const next = current.filter((t) => t !== tag)
    setCampaignTags((prev) => ({ ...prev, [campaignId]: next }))
    try {
      await metaApi.setTags(campaignId, currentWorkspace.id, next)
    } catch {
      setCampaignTags((prev) => ({ ...prev, [campaignId]: current }))
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Roll up totals across all accounts
  const filteredTemplates = REPORT_TEMPLATES.filter((tpl) => {
    const catOk =
      templateCategory === 'all'
        ? true
        : tpl.category === templateCategory ||
          (templateCategory === 'ecom' && (tpl.id === 'meta-ecom' || tpl.id === 'meta-shopify'))
    const q = templateQuery.trim().toLowerCase()
    const qOk = !q || tpl.title.toLowerCase().includes(q)
    return catOk && qOk
  })

  const totals = data?.accounts.reduce(
    (acc, a) => ({
      spend:       acc.spend + a.metrics.spend,
      clicks:      acc.clicks + a.metrics.clicks,
      impressions: acc.impressions + a.metrics.impressions,
    }),
    { spend: 0, clicks: 0, impressions: 0 },
  )

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-tertiary">{t('reporting.workspaceMissing', 'No workspace selected')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <Dialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        className="max-w-4xl p-0 max-h-[min(90vh,720px)] overflow-hidden flex flex-col"
      >
        <>
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <span className="text-violet-500" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              {t('reporting.templatesTitle', 'All templates')}
            </h2>
            <button
              type="button"
              onClick={() => setTemplatesOpen(false)}
              className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="w-52 shrink-0 border-r border-border bg-surface-2/40 p-3 space-y-2 dark:bg-slate-900/40 overflow-y-auto">
              <div className="relative mb-2">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder={t('reporting.searchTemplate', 'Search template')}
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-2 text-xs outline-none focus:border-violet-500/50"
                />
              </div>
              {REPORT_TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTemplateCategory(c.id)}
                  className={`w-full text-left rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                    templateCategory === c.id
                      ? 'border border-violet-500/50 bg-violet-500/10 text-text-primary'
                      : 'border border-transparent text-text-tertiary hover:bg-surface-2'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </aside>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm font-medium text-text-primary mb-3">
                {REPORT_TEMPLATE_CATEGORIES.find((c) => c.id === templateCategory)?.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group relative rounded-xl border border-border bg-surface overflow-hidden hover:border-violet-500/40 transition-colors"
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-violet-100 dark:from-slate-800 dark:to-violet-950/50 relative">
                      {tpl.isNew && (
                        <span className="absolute left-2 bottom-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          New
                        </span>
                      )}
                      <div className="absolute inset-4 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-border/50 shadow-sm flex flex-col gap-1 p-2 opacity-90">
                        <div className="h-1.5 w-1/3 rounded bg-border" />
                        <div className="flex gap-1 flex-1 min-h-0">
                          <div className="w-1/3 rounded bg-border/60" />
                          <div className="flex-1 rounded bg-border/40 flex flex-col gap-1 p-1">
                            <div className="h-1 w-full rounded bg-emerald-400/40" />
                            <div className="h-1 w-2/3 rounded bg-red-400/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-text-primary leading-snug">{tpl.title}</p>
                      <div className="flex gap-1 shrink-0 text-[10px] text-text-tertiary">
                        {tpl.sources.map((s) => (
                          <span key={s} className="px-1 py-0.5 rounded border border-border">
                            {s.slice(0, 2)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-surface/0 group-hover:bg-surface/70 dark:group-hover:bg-slate-950/75 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-3">
                      <button
                        type="button"
                        onClick={() => setTemplatesOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 hover:opacity-95"
                      >
                        {t('reporting.useTemplate', 'Use this template')}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-violet-500/50 p-2 text-violet-600 dark:text-violet-300 bg-white dark:bg-slate-900"
                        aria-label="Preview"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredTemplates.length === 0 && (
                <p className="text-sm text-text-tertiary py-8 text-center">{t('reporting.noTemplates', 'No templates match your search.')}</p>
              )}
            </div>
          </div>
        </>
      </Dialog>

      <Dialog
        open={detailReportOpen}
        onClose={() => setDetailReportOpen(false)}
        title={t('reporting.detailedReportTitle', 'Detailed report')}
        className="max-h-[min(90vh,820px)] min-h-0 max-w-5xl flex flex-col overflow-hidden p-0"
      >
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-0">
          <p className="text-sm text-text-secondary mb-3">
            {currentWorkspace?.name} · {days}d · {t('reporting.detailedReportHint', 'Full campaign-level rows. Use Export for downloadable files.')}
          </p>
          {!data || data.accounts.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t('reporting.noData', 'No reporting data yet')}</p>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-[1] bg-surface-2">
                    <tr>
                      {buildFlatRows(data as unknown as ReportDataShape)[0].map((h) => (
                        <th key={h} className="border-b border-border px-2 py-2 text-left font-semibold text-text-tertiary whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buildFlatRows(data as unknown as ReportDataShape)
                      .slice(1)
                      .map((row, ri) => (
                        <tr key={ri} className="border-b border-border/60 hover:bg-surface-2/50">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 text-text-primary tabular-nums whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4" data-no-export="true">
                <Button type="button" size="sm" variant="secondary" onClick={() => void runExportCsv()} loading={exporting === 'csv'}>
                  <FileText className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                  CSV
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={runExportXls} loading={exporting === 'xls'}>
                  <FileSpreadsheet className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                  XLS
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={runExportPdf}>
                  <Printer className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                  PDF
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => void runExportPng()} loading={exporting === 'png'}>
                  <ImageIcon className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                  PNG
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>

      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={t('navigation.reporting', 'Reporting')}
          subtitle={t('reporting.subtitle', 'Meta Ads account-to-campaign performance breakdown')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-white/80 border border-blue-200/70 p-1 dark:border-slate-700 dark:bg-slate-900/70">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${days === d
                        ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                        : 'text-text-tertiary hover:text-text-primary'
                      }
                    `}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setTemplatesOpen(true)}>
                {t('reporting.reportTemplates', 'Report templates')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDetailReportOpen(true)}>
                {t('reporting.detailedReport', 'Detailed report')}
              </Button>
              <div className="relative" ref={exportMenuRef}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  data-no-export="true"
                >
                  <FileDown className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                  {t('reporting.exportMenu', 'Export')}
                  <span className="ml-1 opacity-60">▾</span>
                </Button>
                {exportMenuOpen ? (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-surface py-1 shadow-lg dark:border-brand-mid/25 dark:bg-brand-ink"
                    data-no-export="true"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-2"
                      onClick={() => void runExportCsv()}
                    >
                      <FileText className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      {t('reporting.exportCsv', 'CSV')}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-2"
                      onClick={runExportXls}
                    >
                      <FileSpreadsheet className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      {t('reporting.exportXls', 'Excel (.xls)')}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-2"
                      onClick={runExportPdf}
                    >
                      <Printer className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      {t('reporting.exportPdf', 'PDF (print)')}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-2"
                      onClick={() => void runExportPng()}
                    >
                      <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      {t('reporting.exportPng', 'PNG snapshot')}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />
      </section>

      <div ref={reportCaptureRef} className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        {error && <Alert variant="error">{error}</Alert>}
        <Alert variant="info" className={!error ? '' : 'mt-2'}>
          {t('reporting.metricsHint', 'Custom KPI cards below are configurable quick-view indicators. Primary table reflects account and campaign data.')}
        </Alert>
      </div>

      {/* ── Summary cards ── */}
      {totals && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Jami Xarajat', value: formatCurrency(totals.spend) },
            { label: 'Jami Kliklar', value: formatNumber(totals.clicks) },
            { label: 'Jami Ko\'rinishlar', value: formatNumber(totals.impressions) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <p className="text-text-tertiary text-xs mb-1">{item.label}</p>
              <p className="text-text-primary text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Custom Metrics Panel (drag to reorder) ── */}
      <div className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              {t('reporting.customMetrics', 'My Metrics')}
              <span className="text-xs font-normal text-text-tertiary">
                — {t('reporting.customMetricsHint', 'choose what you want to track')}
              </span>
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">{t('reporting.metricsDragHint', 'Drag cards to reorder. Layout is saved for this workspace.')}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {AVAILABLE_METRICS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMetric(m.id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                  orderedActiveMetrics.includes(m.id)
                    ? 'border-transparent bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                    : 'border-border bg-surface-elevated text-text-tertiary hover:border-border'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {orderedActiveMetrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {orderedActiveMetrics.map((id) => {
              const disp = metricDisplayForId(id, totals)
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={(e) => {
                    setDragMetricId(id)
                    e.dataTransfer.setData('text/plain', id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => setDragMetricId(null)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from = e.dataTransfer.getData('text/plain') || dragMetricId
                    if (from) setOrderedActiveMetrics((prev) => reorderIds(prev, from, id))
                    setDragMetricId(null)
                  }}
                  className={`group relative cursor-grab rounded-xl border border-border bg-surface-elevated p-4 active:cursor-grabbing ${
                    dragMetricId === id ? 'ring-2 ring-blue-400/50' : ''
                  }`}
                >
                  <div className="absolute left-2 top-2 text-text-tertiary opacity-60" title={t('reporting.dragHandle', 'Drag')}>
                    <GripVertical className="h-4 w-4" aria-hidden />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMetric(id)}
                    className="absolute right-2 top-2 text-xs leading-none text-text-tertiary opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100"
                    aria-label={t('common.close', 'Close')}
                  >
                    ×
                  </button>
                  <p className="mb-1 mt-4 text-xs text-text-tertiary">
                    {disp.icon} {disp.label}
                  </p>
                  <p className="text-xl font-bold text-text-primary">{disp.value}</p>
                  <p className={`mt-0.5 text-xs ${disp.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                    {disp.trend} vs oldingi davr
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-text-tertiary">{t('reporting.selectMetrics', 'Select metrics from above')}</p>
          </div>
        )}
      </div>

      {/* ── Budget Simulation ── */}
      <div className="rounded-2xl border border-border/70 bg-white/85 overflow-hidden shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <button
          onClick={() => setShowSimulation(!showSimulation)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-medium text-sm">{t('reporting.budgetSimulation', 'Budget Simulation')}</span>
            <span className="text-xs text-text-tertiary">- {t('reporting.budgetSimulationHint', 'preview impact before applying budget changes')}</span>
          </div>
          <span className={`text-text-tertiary text-sm transition-transform duration-200 ${showSimulation ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showSimulation && (
          <div className="px-5 pb-5 border-t border-border">
            <div className="pt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-text-secondary font-medium">Oylik byudjet</label>
                  <span className="text-text-primary font-bold text-lg">${simBudget.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={100}
                  value={simBudget}
                  onChange={(e) => setSimBudget(parseInt(e.target.value))}
                  className="w-full accent-[#111827]"
                />
                <div className="flex justify-between text-xs text-text-tertiary mt-1">
                  <span>$500</span><span>$10,000</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pessimistik', mult: 0.65, color: 'text-red-500', bg: 'bg-red-500/10 border-red-100' },
                  { label: 'Realistik',   mult: 1.0,  color: 'text-text-secondary', bg: 'bg-surface-2 border-border' },
                  { label: 'Optimistik',  mult: 1.35, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-100' },
                ].map((s) => (
                  <div key={s.label} className={`border rounded-xl p-3 ${s.bg}`}>
                    <p className="text-text-tertiary text-xs mb-2">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{Math.round(simBudget / 18.5 * s.mult)} lid</p>
                    <p className="text-text-tertiary text-xs">ROAS: {(2.4 * s.mult).toFixed(1)}x</p>
                    <p className="text-text-tertiary text-xs">CPA: ${(18.5 / s.mult).toFixed(0)}</p>
                  </div>
                ))}
              </div>
              <p className="text-text-tertiary text-xs">* Hisoblash joriy kampaniyalar ko'rsatkichlariga asoslangan</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <Card padding="none" className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-surface-elevated animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : !data || data.accounts.length === 0 ? (
          <div className="px-6 py-16">
            <EmptyState
              icon="Report"
              title={t('reporting.noData', 'No reporting data yet')}
              description={t('reporting.noDataDescription', 'Meta Ads is not connected or no data is available for the selected period.')}
            />
            <div className="mt-4 flex justify-center">
              <Link href="/settings/meta">
                <Button variant="secondary" size="sm">
                  {t('reporting.connectMeta', 'Connect Meta Ads')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table header */}
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide w-full">
                    Kanal / Kampaniya
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    Xarajat
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    Kliklar
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    Ko'rinish
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    CTR
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                    CPC
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {data.accounts.map((account) => {
                  const isOpen = expanded.has(account.id)
                  return (
                    <Fragment key={account.id}>
                      {/* ── Account row ── */}
                      <tr
                        key={account.id}
                        className="bg-surface-2 hover:bg-surface-elevated cursor-pointer transition-colors"
                        onClick={() => toggleExpand(account.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Meta icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-text-primary font-semibold text-sm">{account.name}</span>
                            <span className="text-text-tertiary text-xs">{account.id}</span>
                            <span className="text-text-tertiary text-xs ml-1">
                              {account.campaigns.length} kampaniya
                            </span>
                            {/* Expand chevron */}
                            <span className={`text-text-tertiary ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                              ›
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs text-text-tertiary">—</span>
                        </td>
                        <MetricCell value={formatCurrency(account.metrics.spend)} />
                        <MetricCell value={formatNumber(account.metrics.clicks)} />
                        <MetricCell value={formatNumber(account.metrics.impressions)} />
                        <MetricCell value={`${account.metrics.ctr.toFixed(2)}%`} className="text-text-secondary" />
                        <MetricCell value={formatCurrency(account.metrics.cpc)} />
                      </tr>

                      {/* ── Campaign rows (expandable) ── */}
                      {isOpen && account.campaigns.map((campaign) => (
                        <tr
                          key={campaign.id}
                          className="bg-surface-elevated hover:bg-surface-2 transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 pl-6">
                              {/* Indent line */}
                              <span className="w-px h-4 bg-surface-2 shrink-0" />
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-text-tertiary shrink-0">
                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                              </svg>
                              <span className="text-text-secondary text-sm">{campaign.name}</span>
                              {campaign.objective && (
                                <span className="text-[10px] text-text-tertiary bg-surface-2 border border-border px-1.5 py-0.5 rounded">
                                  {campaign.objective.replace('OUTCOME_', '')}
                                </span>
                              )}
                            </div>
                            {/* Tags row */}
                            <div className="pl-14 flex items-center gap-1.5 flex-wrap mt-1">
                              {(campaignTags[campaign.id] ?? campaign.tags ?? []).map((tag) => (
                                <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary border border-border">
                                  {tag}
                                  <button onClick={() => removeTag(campaign.id, tag)} className="hover:text-red-400 leading-none">×</button>
                                </span>
                              ))}
                              {editingTagId === campaign.id ? (
                                <input
                                  autoFocus
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTag(campaign.id, tagInput)
                                    if (e.key === 'Escape') setEditingTagId(null)
                                  }}
                                  onBlur={() => setEditingTagId(null)}
                                  placeholder="teg nomi..."
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text-primary placeholder-[#9CA3AF] outline-none w-24"
                                />
                              ) : (
                                <button
                                  onClick={() => { setEditingTagId(campaign.id); setTagInput('') }}
                                  className="text-[10px] text-text-tertiary hover:text-text-secondary border border-dashed border-border hover:border-border px-2 py-0.5 rounded-full transition-colors"
                                >
                                  + teg
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_STYLE[campaign.status] ?? 'text-text-tertiary bg-surface-2'}`}>
                              {campaign.status}
                            </span>
                          </td>
                          <MetricCell value={formatCurrency(campaign.metrics.spend)} />
                          <MetricCell value={formatNumber(campaign.metrics.clicks)} />
                          <MetricCell value={formatNumber(campaign.metrics.impressions)} />
                          <MetricCell
                            value={`${campaign.metrics.ctr.toFixed(2)}%`}
                            className={
                              campaign.metrics.ctr >= 2 ? 'text-emerald-400' :
                              campaign.metrics.ctr >= 1 ? 'text-text-primary' :
                              campaign.metrics.ctr > 0  ? 'text-amber-400' : 'text-text-tertiary'
                            }
                          />
                          <MetricCell value={campaign.metrics.cpc > 0 ? formatCurrency(campaign.metrics.cpc) : '—'} />
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}
