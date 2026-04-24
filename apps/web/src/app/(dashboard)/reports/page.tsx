'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronDown, FileDown, Info, Link2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { MetricLibrary } from '@/components/reports/MetricLibrary'
import { GridCanvas } from '@/components/reports/GridCanvas'
import {
  DEFAULT_DASHBOARD_WIDGET_IDS,
  MAX_REPORT_WIDGETS,
  reportTemplates,
  type ReportPersona,
  type ReportTemplateKey,
} from '@/lib/reports/metrics'
import type { ReportFiltersState } from '@/components/reports/types'
import { cn } from '@/lib/utils'

const storageKey = (workspaceId: string) => `adspectr:report-builder:${workspaceId}`

const PERSONA_CONFIG: Array<{
  key: ReportPersona
  icon: string
  title: string
  need: string
  bullets: string[]
  template: ReportTemplateKey
}> = [
  {
    key: 'owner',
    icon: '👔',
    title: 'Biznes egasi',
    need: 'Pulim qaytayaptimi?',
    bullets: ['Bugun sotuv', 'ROAS', 'Eng yaxshi kreativ'],
    template: 'business_owner',
  },
  {
    key: 'targetolog',
    icon: '🎯',
    title: 'Targetolog',
    need: 'Qayerni optimizatsiya qilay?',
    bullets: ['Kampaniya CTR, CPM, CPC', 'Audience saturation', 'Creative fatigue'],
    template: 'targetolog',
  },
  {
    key: 'specialist',
    icon: '⚙️',
    title: 'Mutaxassis',
    need: 'Hamma data',
    bullets: ['Custom metrics', 'SQL', 'Export'],
    template: 'specialist',
  },
]

const TEMPLATE_WIDGETS: Record<ReportTemplateKey, string[]> = {
  business_owner: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
  targetolog:     ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'],
  creative_audit: ['#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#a78bfa'],
  specialist:     ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#6366f1', '#78716c'],
}

export default function ReportsBuilderPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const ws = currentWorkspace?.id ?? 'demo'

  const [persona, setPersona] = useState<ReportPersona>('owner')
  const [widgetIds, setWidgetIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [filters, setFilters] = useState<ReportFiltersState>({
    range: '7d',
    platform: 'all',
    campaignId: 'all',
    compare: false,
  })
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [copyOk, setCopyOk] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(ws))
      if (raw) {
        const parsed = JSON.parse(raw) as { widgets?: string[] }
        if (Array.isArray(parsed.widgets) && parsed.widgets.length) {
          setWidgetIds(parsed.widgets.slice(0, MAX_REPORT_WIDGETS))
        } else {
          setWidgetIds([...DEFAULT_DASHBOARD_WIDGET_IDS])
        }
      } else {
        setWidgetIds([...DEFAULT_DASHBOARD_WIDGET_IDS])
      }
    } catch {
      setWidgetIds([...DEFAULT_DASHBOARD_WIDGET_IDS])
    }
    setHydrated(true)
  }, [ws])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(storageKey(ws), JSON.stringify({ widgets: widgetIds }))
  }, [widgetIds, ws, hydrated])

  const atLimit = widgetIds.length >= MAX_REPORT_WIDGETS

  const addWidget = useCallback((id: string) => {
    setWidgetIds((prev) => {
      if (prev.includes(id)) return prev
      if (prev.length >= MAX_REPORT_WIDGETS) return prev
      return [...prev, id]
    })
  }, [])

  const removeWidget = useCallback((id: string) => {
    setWidgetIds((prev) => prev.filter((w) => w !== id))
  }, [])

  const loadTemplate = useCallback((key: ReportTemplateKey) => {
    setWidgetIds([...reportTemplates[key]].slice(0, MAX_REPORT_WIDGETS))
  }, [])

  function handlePersonaClick(p: ReportPersona) {
    const cfg = PERSONA_CONFIG.find((c) => c.key === p)!
    setPersona(p)
    loadTemplate(cfg.template)
  }

  const campaignOptions = useMemo(() => [
    { id: 'all' as const, label: '📊 Barcha kampaniyalar' },
    { id: 'c1', label: 'Summer / Meta' },
    { id: 'c2', label: 'Retargeting 30d' },
  ], [])

  async function handleShareLink() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      setCopyOk(false)
    }
  }

  const widgetProgress = (widgetIds.length / MAX_REPORT_WIDGETS) * 100

  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-text-tertiary text-sm">
        {t('common.loading', 'Loading…')}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-10">
      <PageHeader
        title={t('navigation.reportBuilder', 'Report builder')}
        subtitle={t(
          'reports.builderSubtitle',
          "Avval nima ko'rish kerak — keyin drag-and-drop. Layout workspace bo'yicha saqlanadi.",
        )}
      />

      {/* ── Persona segmented control ── */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-1.5 flex gap-1">
        {PERSONA_CONFIG.map((cfg) => {
          const active = persona === cfg.key
          return (
            <button
              key={cfg.key}
              type="button"
              onClick={() => handlePersonaClick(cfg.key)}
              className={cn(
                'flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-left transition-all duration-200 group/persona relative',
                active
                  ? 'text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
              )}
              style={active ? { backgroundColor: '#10b981' } : {}}
            >
              <span className="text-xl select-none shrink-0">{cfg.icon}</span>
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold leading-tight', active ? 'text-white' : 'text-text-primary')}>
                  {cfg.title}
                </p>
                <p className={cn('text-[11px] truncate', active ? 'text-white/80' : 'text-text-tertiary')}>
                  {cfg.need}
                </p>
              </div>
              {/* Hover tooltip with bullets */}
              <div className="absolute left-0 top-full mt-1.5 z-30 w-52 bg-white rounded-xl shadow-xl border border-border p-3 hidden group-hover/persona:block pointer-events-none">
                <ul className="space-y-1">
                  {cfg.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl shadow-sm border border-border px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Date */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase tracking-wide text-text-tertiary font-medium">Sana</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none">📅</span>
            <select
              className="text-sm rounded-lg border border-border bg-surface-2 pl-7 pr-7 py-1.5 text-text-primary appearance-none focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 cursor-pointer"
              value={filters.range}
              onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as ReportFiltersState['range'] }))}
            >
              <option value="today">Bugun</option>
              <option value="yesterday">Kecha</option>
              <option value="7d">7 kun</option>
              <option value="30d">30 kun</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>
        </div>

        {/* Platform */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase tracking-wide text-text-tertiary font-medium">Platforma</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none">🌐</span>
            <select
              className="text-sm rounded-lg border border-border bg-surface-2 pl-7 pr-7 py-1.5 text-text-primary appearance-none focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 cursor-pointer"
              value={filters.platform}
              onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value as ReportFiltersState['platform'] }))}
            >
              <option value="all">Hammasi</option>
              <option value="meta">Meta</option>
              <option value="yandex">Yandex</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>
        </div>

        {/* Campaign */}
        <div className="flex flex-col gap-0.5 min-w-[200px]">
          <label className="text-[10px] uppercase tracking-wide text-text-tertiary font-medium">Kampaniya</label>
          <div className="relative">
            <select
              className="w-full text-sm rounded-lg border border-border bg-surface-2 px-2.5 pr-7 py-1.5 text-text-primary appearance-none focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 cursor-pointer"
              value={filters.campaignId}
              onChange={(e) => setFilters((f) => ({ ...f, campaignId: e.target.value }))}
            >
              {campaignOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>
        </div>

        {/* Compare checkbox */}
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer pb-px mt-3.5 select-none">
          <input
            type="checkbox"
            checked={filters.compare}
            onChange={(e) => setFilters((f) => ({ ...f, compare: e.target.checked }))}
            className="rounded border-border accent-emerald-500"
          />
          O'tgan davr bilan solishtirish
        </label>

        {/* Widget count badge — right side */}
        <div className="sm:ml-auto flex flex-col gap-1 mt-3.5 sm:mt-0 min-w-[100px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary font-medium">Widgetlar</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#10b98120', color: '#10b981' }}
            >
              {widgetIds.length}/{MAX_REPORT_WIDGETS}
            </span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${widgetProgress}%`, backgroundColor: widgetProgress >= 90 ? '#f59e0b' : '#10b981' }}
            />
          </div>
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Metric Library */}
        <MetricLibrary onAdd={addWidget} atLimit={atLimit} />

        {/* Canvas */}
        <GridCanvas
          widgetIds={widgetIds}
          filters={filters}
          onDropMetric={addWidget}
          onRemoveWidget={removeWidget}
          atLimit={atLimit}
        />

        {/* Right panel */}
        <div className="w-full lg:w-56 shrink-0 space-y-3">
          {/* Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-text-primary">Shablonlar</p>
            <p className="text-[10px] text-text-tertiary">Bir bosishda yuklanadi</p>
            <div className="flex flex-col gap-1">
              {(Object.entries(TEMPLATE_WIDGETS) as [ReportTemplateKey, string[]][]).map(([key, colors]) => {
                const labels: Record<ReportTemplateKey, string> = {
                  business_owner: 'Biznes egasi',
                  targetolog: 'Targetolog',
                  creative_audit: 'Creative audit',
                  specialist: 'Mutaxassis',
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => loadTemplate(key)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-surface-2 hover:border-emerald-300 hover:bg-white transition-all text-left group/tmpl"
                  >
                    <div className="flex gap-0.5 flex-wrap w-10 shrink-0">
                      {colors.slice(0, 4).map((c, i) => (
                        <div
                          key={i}
                          className="w-4 h-3 rounded-[2px]"
                          style={{ backgroundColor: c, opacity: 0.7 }}
                        />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-text-primary truncate">{labels[key]}</p>
                      <p className="text-[9px] text-text-tertiary">{colors.length} widget</p>
                    </div>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setWidgetIds([...DEFAULT_DASHBOARD_WIDGET_IDS])}
                className="w-full text-left px-2.5 py-1.5 text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
              >
                → Standart dashboard
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-text-primary">Actions</p>
            <div className="flex flex-col gap-1.5">
              <Link
                href="/reporting"
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all',
                  'bg-surface-2 hover:bg-white border border-border hover:border-emerald-300 text-text-primary w-full',
                )}
              >
                <FileDown className="w-3.5 h-3.5 text-text-tertiary" />
                📤 Export
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="justify-start gap-2 w-full"
                onClick={() => setScheduleOpen(true)}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                📧 Schedule email
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="justify-start gap-2 w-full"
                onClick={() => void handleShareLink()}
              >
                <Link2 className="w-3.5 h-3.5" />
                🔗 Share link
              </Button>
            </div>
            {copyOk && (
              <p className="text-[10px] text-emerald-600 font-medium">✓ Havola nusxalandi</p>
            )}
          </div>

          {/* Collapsible hint */}
          <div className="px-1">
            <button
              type="button"
              onClick={() => setHintOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Info className="w-3 h-3 shrink-0" />
              <span>Qoidalar va ma'lumot</span>
            </button>
            {hintOpen && (
              <p className="mt-2 text-[10px] text-text-tertiary leading-relaxed px-1 border-l-2 border-border pl-2">
                Default 4 ta karta; maks. 12 widget; AI tavsiya persona bo'yicha.
                Ma'lumotlar hozircha namuna — keyin Meta / Signal.
              </p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule email">
        <p className="text-sm text-text-secondary mb-3">
          Har dushanba 09:00 — PDF yoki Excel biriktirish (reja). Hozircha faqat UI.
        </p>
        <Button type="button" onClick={() => setScheduleOpen(false)}>
          Yopish
        </Button>
      </Dialog>
    </div>
  )
}
