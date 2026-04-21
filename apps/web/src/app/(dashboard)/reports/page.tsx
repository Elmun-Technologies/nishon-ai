'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, FileDown, LayoutTemplate, Link2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MetricLibrary } from '@/components/reports/MetricLibrary'
import { GridCanvas } from '@/components/reports/GridCanvas'
import {
  DEFAULT_DASHBOARD_WIDGET_IDS,
  MAX_REPORT_WIDGETS,
  PERSONA_HINTS,
  reportTemplates,
  suggestRoasWidget,
  type ReportPersona,
  type ReportTemplateKey,
} from '@/lib/reports/metrics'
import type { ReportFiltersState } from '@/components/reports/types'
import { cn } from '@/lib/utils'

const storageKey = (workspaceId: string) => `adspectr:report-builder:${workspaceId}`

export default function ReportsBuilderPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const ws = currentWorkspace?.id ?? 'demo'

  const [persona, setPersona] = useState<ReportPersona>('owner')
  const [widgetIds, setWidgetIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)
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

  const addWidget = useCallback(
    (id: string) => {
      setWidgetIds((prev) => {
        if (prev.includes(id)) return prev
        if (prev.length >= MAX_REPORT_WIDGETS) return prev
        return [...prev, id]
      })
    },
    [],
  )

  const removeWidget = useCallback((id: string) => {
    setWidgetIds((prev) => prev.filter((w) => w !== id))
  }, [])

  const loadTemplate = useCallback((key: ReportTemplateKey) => {
    const next = [...reportTemplates[key]]
    setWidgetIds(next.slice(0, MAX_REPORT_WIDGETS))
  }, [])

  const aiHint = useMemo(() => suggestRoasWidget(persona, widgetIds), [persona, widgetIds])

  const campaignOptions = useMemo(
    () => [
      { id: 'all' as const, label: 'Barcha kampaniyalar' },
      { id: 'c1', label: 'Summer / Meta' },
      { id: 'c2', label: 'Retargeting 30d' },
    ],
    [],
  )

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

  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-text-tertiary text-sm">
        {t('common.loading', 'Loading…')}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      <PageHeader
        title={t('navigation.reportBuilder', 'Report builder')}
        subtitle={t(
          'reports.builderSubtitle',
          'Avval nima ko‘rish kerak — keyin drag-and-drop. Layout workspace bo‘yicha saqlanadi.',
        )}
      />

      {/* 3 foydalanuvchi — 3 ko‘rinish (ma’no + tez shablon) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(PERSONA_HINTS) as ReportPersona[]).map((p) => {
          const h = PERSONA_HINTS[p]
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPersona(p)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                persona === p
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-border bg-surface hover:border-border'
              }`}
            >
              <p className="text-sm font-semibold text-text-primary">{h.title}</p>
              <p className="text-xs text-violet-300/90 mt-1">{h.need}</p>
              <ul className="mt-2 text-[11px] text-text-tertiary list-disc pl-4 space-y-0.5">
                {h.metrics.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* Blok 3 — Filters */}
      <Card className="p-4 flex flex-wrap items-end gap-3 border border-border">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-text-tertiary">Sana</label>
          <select
            className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
            value={filters.range}
            onChange={(e) =>
              setFilters((f) => ({ ...f, range: e.target.value as ReportFiltersState['range'] }))
            }
          >
            <option value="today">Bugun</option>
            <option value="yesterday">Kecha</option>
            <option value="7d">7 kun</option>
            <option value="30d">30 kun</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-text-tertiary">Platforma</label>
          <select
            className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary"
            value={filters.platform}
            onChange={(e) =>
              setFilters((f) => ({ ...f, platform: e.target.value as ReportFiltersState['platform'] }))
            }
          >
            <option value="all">Hammasi</option>
            <option value="meta">Meta</option>
            <option value="yandex">Yandex</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-[10px] uppercase text-text-tertiary">Kampaniya</label>
          <select
            className="text-sm rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary w-full"
            value={filters.campaignId}
            onChange={(e) => setFilters((f) => ({ ...f, campaignId: e.target.value }))}
          >
            {campaignOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer pb-0.5">
          <input
            type="checkbox"
            checked={filters.compare}
            onChange={(e) => setFilters((f) => ({ ...f, compare: e.target.checked }))}
            className="rounded border-border"
          />
          O‘tgan davr bilan solishtirish
        </label>
        <p className="text-[11px] text-text-tertiary w-full sm:w-auto sm:ml-auto">
          Widgetlar: {widgetIds.length}/{MAX_REPORT_WIDGETS}
        </p>
      </Card>

      {aiHint && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/95">
          <span className="font-medium">AI tavsiya: </span>
          {aiHint}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Blok 1 — Metric Library */}
        <MetricLibrary onAdd={addWidget} atLimit={atLimit} />

        {/* Blok 2 — Canvas */}
        <GridCanvas
          widgetIds={widgetIds}
          filters={filters}
          onDropMetric={addWidget}
          onRemoveWidget={removeWidget}
          atLimit={atLimit}
        />

        {/* Blok 4 + 5 — Templates & Actions */}
        <div className="w-full lg:w-56 shrink-0 space-y-4">
          <Card className="p-3 border border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <LayoutTemplate className="w-4 h-4 text-text-tertiary" />
              Shablonlar
            </div>
            <p className="text-[10px] text-text-tertiary">Bir bosishda yuklanadi</p>
            <div className="flex flex-col gap-1.5">
              <Button type="button" variant="secondary" size="sm" className="justify-start" onClick={() => loadTemplate('business_owner')}>
                Biznes egasi (4)
              </Button>
              <Button type="button" variant="secondary" size="sm" className="justify-start" onClick={() => loadTemplate('targetolog')}>
                Targetolog (8)
              </Button>
              <Button type="button" variant="secondary" size="sm" className="justify-start" onClick={() => loadTemplate('creative_audit')}>
                Creative audit
              </Button>
              <Button type="button" variant="secondary" size="sm" className="justify-start" onClick={() => loadTemplate('specialist')}>
                Mutaxassis (12)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-text-tertiary"
                onClick={() => setWidgetIds([...DEFAULT_DASHBOARD_WIDGET_IDS])}
              >
                Standart dashboard
              </Button>
            </div>
          </Card>

          <Card className="p-3 border border-border space-y-2">
            <p className="text-xs font-semibold text-text-primary">Actions</p>
            <div className="flex flex-col gap-1.5">
              <Link
                href="/reporting"
                className={cn(
                  'inline-flex items-center justify-center rounded-xl font-medium transition-all gap-1.5',
                  'bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-text-primary border border-border',
                  'px-3 py-1.5 text-xs w-full justify-start',
                )}
              >
                <FileDown className="w-3.5 h-3.5" />
                Export (detailed /reporting)
              </Link>
              <Button type="button" variant="secondary" size="sm" className="justify-start gap-2" onClick={() => setScheduleOpen(true)}>
                <CalendarClock className="w-3.5 h-3.5" />
                Schedule email
              </Button>
              <Button type="button" variant="secondary" size="sm" className="justify-start gap-2" onClick={() => void handleShareLink()}>
                <Link2 className="w-3.5 h-3.5" />
                Share link
              </Button>
            </div>
            {copyOk && <p className="text-[10px] text-emerald-400">Havola nusxalandi</p>}
          </Card>

          <p className="text-[10px] text-text-tertiary leading-relaxed px-1">
            Qoida: default 4 ta karta; maks. 12 widget; AI tavsiya persona bo‘yicha. Ma’lumotlar hozircha namuna — keyin Meta / Signal.
          </p>
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
