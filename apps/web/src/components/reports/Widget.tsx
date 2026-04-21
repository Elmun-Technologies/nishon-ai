'use client'

import { X } from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { getMetricById } from '@/lib/reports/metrics'
import type { ReportFiltersState } from '@/components/reports/types'

const MOCK_NUMBERS: Record<string, { value: string; delta: string; up: boolean }> = {
  revenue: { value: '24 300 000', delta: '+8%', up: true },
  purchases: { value: '186', delta: '+3%', up: true },
  aov: { value: '130 645', delta: '−1%', up: false },
  roas: { value: '3.1', delta: '−4%', up: false },
  impressions: { value: '1.2M', delta: '+12%', up: true },
  clicks: { value: '18 400', delta: '+5%', up: true },
  ctr: { value: '1.52%', delta: '−0.2pp', up: false },
  cpc: { value: '$0.41', delta: '+2%', up: false },
  spend: { value: '7 840 000', delta: '+6%', up: false },
  cpm: { value: '$6.52', delta: '+9%', up: false },
  cpa: { value: '42 150', delta: '−3%', up: true },
  top_creative: { value: 'ROAS 4.2', delta: 'Video — demo', up: true },
  fatigue_score: { value: '62 / 100', delta: 'ogohlantirish', up: false },
  frequency: { value: '2.8', delta: '+0.4', up: false },
}

function chartData() {
  return Array.from({ length: 7 }, (_, i) => ({
    d: `D${i + 1}`,
    spend: 120 + i * 14 + (i % 3) * 8,
    ctr: 1.2 + i * 0.05,
  }))
}

function barData() {
  return [
    { name: 'Retarg', v: 2.8 },
    { name: 'Lookalike', v: 2.1 },
    { name: 'Interest', v: 1.4 },
  ]
}

function tableRows() {
  return [
    { name: 'Video — demo', roas: '4.2', spend: '1.2M' },
    { name: 'Static — sale', roas: '2.9', spend: '890k' },
    { name: 'Carousel', roas: '2.4', spend: '640k' },
    { name: 'UGC', roas: '2.1', spend: '520k' },
    { name: 'Story', roas: '1.8', spend: '410k' },
  ]
}

export interface ReportWidgetProps {
  metricId: string
  filters: ReportFiltersState
  onRemove: () => void
}

export function ReportWidget({ metricId, filters, onRemove }: ReportWidgetProps) {
  const def = getMetricById(metricId)
  const sub = `${filters.range} · ${filters.platform}`

  if (!def) {
    return (
      <div className="h-full rounded-xl border border-border bg-surface p-3 text-xs text-text-tertiary">
        Noma’lum widget: {metricId}
      </div>
    )
  }

  const header = (
    <div className="flex items-start justify-between gap-2 mb-2">
      <div>
        <p className="text-xs font-medium text-text-primary">{def.label}</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">{sub}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onRemove} aria-label="Olib tashlash">
        <X className="w-4 h-4" />
      </Button>
    </div>
  )

  if (def.type === 'number') {
    const m = MOCK_NUMBERS[metricId]
    return (
      <div className="h-full min-h-[88px] rounded-xl border border-border bg-surface p-3 flex flex-col">
        {header}
        {m ? (
          <>
            <p className="text-2xl font-semibold tabular-nums text-text-primary">{m.value}</p>
            <p className={`text-xs mt-auto ${m.up ? 'text-emerald-400' : 'text-amber-400'}`}>{m.delta}</p>
          </>
        ) : (
          <p className="text-sm text-text-tertiary">—</p>
        )}
        {def.formula && <p className="text-[9px] text-text-tertiary mt-2 font-mono truncate" title={def.formula}>{def.formula}</p>}
      </div>
    )
  }

  if (def.type === 'line') {
    const data = chartData()
    return (
      <div className="h-full min-h-[160px] rounded-xl border border-border bg-surface p-3 flex flex-col">
        {header}
        <div className="flex-1 min-h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} width={32} />
              <Tooltip contentStyle={{ fontSize: 11, background: '#1a1a24', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="spend" stroke="#a78bfa" strokeWidth={2} dot={false} name="Spend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (def.type === 'bar') {
    return (
      <div className="h-full min-h-[160px] rounded-xl border border-border bg-surface p-3 flex flex-col">
        {header}
        <div className="flex-1 min-h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData()}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} width={28} />
              <Tooltip contentStyle={{ fontSize: 11, background: '#1a1a24', border: '1px solid #333' }} />
              <Bar dataKey="v" fill="#38bdf8" radius={[4, 4, 0, 0]} name="ROAS" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (def.type === 'table') {
    return (
      <div className="h-full min-h-[140px] rounded-xl border border-border bg-surface p-3 flex flex-col">
        {header}
        <div className="overflow-auto text-[11px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-text-tertiary border-b border-border">
                <th className="py-1 pr-2 font-medium">Kreativ</th>
                <th className="py-1 pr-2 font-medium text-right">ROAS</th>
                <th className="py-1 font-medium text-right">Spend</th>
              </tr>
            </thead>
            <tbody>
              {tableRows().map((row) => (
                <tr key={row.name} className="border-b border-border/60 text-text-primary">
                  <td className="py-1.5 pr-2">{row.name}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{row.roas}</td>
                  <td className="py-1.5 text-right tabular-nums">{row.spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // insight
  const bodies: Record<string, string> = {
    ai_roas_trend: 'ROAS oxirgi 3 kunda sekin tushmoqda. Kreativ rotatsiyasi yoki byudjetni qayta taqsimlashni ko‘rib chiqing.',
    ai_audience_full: 'Asosiy 18–24 Toshkent segmentida reach to‘yinmoqda. Kengaytirilgan interest yoki LAL 2–3% sinovi.',
    audience_saturation: 'Tanlangan auditoriyaning ~78% i ko‘rilgan. Yangi kreativ yoki kengaytirilgan targeting tavsiya.',
    creative_fatigue: 'Chastota 2.8+, CTR tushish trendi. Yangi hook yoki format A/B.',
    custom_metrics: 'Keyingi bosqich: warehouse dan custom formula (masalan, blended ROAS, margin).',
    sql_export: 'SELECT … FROM adspectr.facts_daily WHERE workspace_id = ? — eksport CSV/Parquet (reja).',
  }

  return (
    <div className="h-full min-h-[88px] rounded-xl border border-violet-500/25 bg-violet-500/5 p-3 flex flex-col">
      {header}
      <p className="text-xs text-text-secondary leading-relaxed">{bodies[metricId] ?? 'AI tahlil bu yerda ko‘rinadi.'}</p>
    </div>
  )
}
