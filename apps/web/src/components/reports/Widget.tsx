'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Edit2, MoreHorizontal, Trash2 } from 'lucide-react'
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
import { getMetricById } from '@/lib/reports/metrics'
import type { ReportFiltersState } from '@/components/reports/types'

const MOCK: Record<string, { value: string; delta: string; up: boolean }> = {
  revenue:      { value: "24.3M so'm", delta: '+8%',    up: true  },
  purchases:    { value: '186',         delta: '+3%',    up: true  },
  aov:          { value: '130 645',     delta: '−1%',    up: false },
  roas:         { value: '3.1×',        delta: '−4%',    up: false },
  impressions:  { value: '1.2M',        delta: '+12%',   up: true  },
  clicks:       { value: '18 400',      delta: '+5%',    up: true  },
  ctr:          { value: '1.52%',       delta: '−0.2pp', up: false },
  cpc:          { value: '$0.41',       delta: '+2%',    up: false },
  spend:        { value: "7.84M so'm",  delta: '+6%',    up: false },
  cpm:          { value: '$6.52',       delta: '+9%',    up: false },
  cpa:          { value: '42 150',      delta: '−3%',    up: true  },
  top_creative: { value: 'ROAS 4.2',   delta: '+12%',   up: true  },
  fatigue_score:{ value: '62 / 100',   delta: 'Ogohlantirish', up: false },
  frequency:    { value: '2.8',         delta: '+0.4',   up: false },
}

const INSIGHT_BODY: Record<string, string> = {
  ai_roas_trend:    "ROAS oxirgi 3 kunda sekin tushmoqda. Kreativ rotatsiyasi yoki byudjetni qayta taqsimlashni ko'rib chiqing.",
  ai_audience_full: "Asosiy 18–24 Toshkent segmentida reach to'yinmoqda. Kengaytirilgan interest yoki LAL 2–3% sinovi.",
  audience_saturation: "Tanlangan auditoriyaning ~78% i ko'rilgan. Yangi kreativ yoki kengaytirilgan targeting tavsiya.",
  creative_fatigue: 'Chastota 2.8+, CTR tushish trendi. Yangi hook yoki format A/B.',
  custom_metrics:   'Keyingi bosqich: warehouse dan custom formula (masalan, blended ROAS, margin).',
  sql_export:       'SELECT … FROM adspectr.facts_daily WHERE workspace_id = ? — eksport CSV/Parquet (reja).',
}

function sparkData() {
  return [62, 71, 68, 80, 76, 85, 90].map((v, i) => ({ i, v }))
}

function lineData() {
  return ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d, i) => ({
    d,
    spend: 120 + i * 14 + (i % 3) * 8,
  }))
}

function barData() {
  return [
    { name: 'Retarg',    v: 2.8 },
    { name: 'Lookalike', v: 2.1 },
    { name: 'Interest',  v: 1.4 },
  ]
}

function tableRows() {
  return [
    { name: 'Video — demo', roas: '4.2', spend: '1.2M' },
    { name: 'Static — sale', roas: '2.9', spend: '890k' },
    { name: 'Carousel',      roas: '2.4', spend: '640k' },
    { name: 'UGC',            roas: '2.1', spend: '520k' },
    { name: 'Story',          roas: '1.8', spend: '410k' },
  ]
}

function ResizeHandle() {
  return (
    <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize pointer-events-none">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M9 3L3 9M9 6L6 9M9 9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function DeltaPill({ delta, up }: { delta: string; up: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
        up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'
      }`}
    >
      {up ? '▲' : '▼'} {delta}
    </span>
  )
}

function WidgetMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="w-6 h-6 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-36 bg-white rounded-xl shadow-lg border border-border py-1 text-xs">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-2 text-text-secondary"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-2 text-text-secondary"
          >
            <Copy className="w-3 h-3" /> Duplicate
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => { onRemove(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-500"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export interface ReportWidgetProps {
  metricId: string
  filters: ReportFiltersState
  onRemove: () => void
}

export function ReportWidget({ metricId, filters: _filters, onRemove }: ReportWidgetProps) {
  const [dragging, setDragging] = useState(false)
  const def = getMetricById(metricId)

  if (!def) {
    return (
      <div className="h-full rounded-xl border border-border bg-surface p-3 text-xs text-text-tertiary">
        Noma'lum widget: {metricId}
      </div>
    )
  }

  const base = `h-full rounded-xl border border-border bg-white shadow-sm flex flex-col group relative overflow-hidden
    transition-all duration-200 hover:shadow-md hover:border-[#cfe8c0]
    ${dragging ? 'shadow-2xl scale-[1.02] rotate-1 border-emerald-300 z-10' : ''}`

  /* ── NUMBER ── */
  if (def.type === 'number') {
    const m = MOCK[metricId]

    /* Top Creative — special card */
    if (metricId === 'top_creative') {
      return (
        <div
          className={base}
          draggable
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
        >
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{def.label}</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <WidgetMenu onRemove={onRemove} />
            </div>
          </div>
          {/* Thumbnail placeholder */}
          <div className="mx-3 mb-2 rounded-lg bg-gradient-to-br from-surface-2 to-[#cfe8c0]/30 h-[52px] flex items-center justify-center border border-border/50">
            <span className="text-2xl select-none">🎬</span>
          </div>
          <div className="px-3 pb-3">
            <p className="text-sm font-semibold text-text-primary">Video — demo</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">ROAS 4.2</span>
              {m && <DeltaPill delta={m.delta} up={m.up} />}
            </div>
          </div>
          <ResizeHandle />
        </div>
      )
    }

    return (
      <div
        className={base}
        draggable
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        <div className="flex items-start justify-between gap-1 px-3 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider leading-tight">{def.label}</p>
          <div className="flex items-center gap-1 shrink-0">
            {m && <DeltaPill delta={m.delta} up={m.up} />}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <WidgetMenu onRemove={onRemove} />
            </div>
          </div>
        </div>
        <div className="px-3 flex-1">
          {m ? (
            <p className="text-[22px] font-bold tabular-nums text-text-primary leading-none mt-1">{m.value}</p>
          ) : (
            <p className="text-xl text-text-tertiary">—</p>
          )}
          {def.formula && (
            <p className="text-[9px] text-text-tertiary font-mono mt-1.5 truncate" title={def.formula}>
              {def.formula}
            </p>
          )}
        </div>
        {/* Mini sparkline */}
        <div className="h-9 px-0 pb-0.5 mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData()} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={m?.up ? '#10b981' : '#f87171'}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ResizeHandle />
      </div>
    )
  }

  /* ── LINE CHART ── */
  if (def.type === 'line') {
    return (
      <div
        className={base}
        draggable
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{def.label}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <WidgetMenu onRemove={onRemove} />
          </div>
        </div>
        <div className="flex-1 min-h-[100px] px-2 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData()}>
              <XAxis dataKey="d" tick={{ fontSize: 9, fill: '#5c7248' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#5c7248' }} width={28} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: '#fff',
                  border: '1px solid #cfe8c0',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(27,46,6,0.08)',
                }}
              />
              <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} dot={false} name="Spend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ResizeHandle />
      </div>
    )
  }

  /* ── BAR CHART ── */
  if (def.type === 'bar') {
    return (
      <div
        className={base}
        draggable
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{def.label}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <WidgetMenu onRemove={onRemove} />
          </div>
        </div>
        <div className="flex-1 min-h-[100px] px-2 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData()}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#5c7248' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#5c7248' }} width={24} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: '#fff',
                  border: '1px solid #cfe8c0',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(27,46,6,0.08)',
                }}
              />
              <Bar dataKey="v" fill="#93c75b" radius={[4, 4, 0, 0]} name="ROAS" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ResizeHandle />
      </div>
    )
  }

  /* ── TABLE ── */
  if (def.type === 'table') {
    return (
      <div
        className={base}
        draggable
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{def.label}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <WidgetMenu onRemove={onRemove} />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3">
          <table className="w-full text-left">
            <thead>
              <tr className="text-text-tertiary border-b border-border">
                <th className="py-1 pr-2 text-[10px] font-medium">Kreativ</th>
                <th className="py-1 pr-2 text-[10px] font-medium text-right">ROAS</th>
                <th className="py-1 text-[10px] font-medium text-right">Spend</th>
              </tr>
            </thead>
            <tbody>
              {tableRows().map((row, i) => (
                <tr
                  key={row.name}
                  className={`border-b border-border/40 ${i === 0 ? 'text-text-primary' : 'text-text-secondary'}`}
                >
                  <td className="py-1.5 pr-2 text-[11px]">{row.name}</td>
                  <td className="py-1.5 pr-2 text-[11px] text-right tabular-nums font-semibold">{row.roas}</td>
                  <td className="py-1.5 text-[11px] text-right tabular-nums text-text-tertiary">{row.spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ResizeHandle />
      </div>
    )
  }

  /* ── INSIGHT ── */
  return (
    <div
      className={`h-full rounded-xl border border-[#cfe8c0] bg-gradient-to-br from-[#f4faf0] to-white shadow-sm flex flex-col group relative overflow-hidden
        transition-all duration-200 hover:shadow-md
        ${dragging ? 'shadow-2xl scale-[1.02] rotate-1 z-10' : ''}`}
      draggable
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm select-none">🤖</span>
          <p className="text-[10px] font-semibold text-[#3d5626] uppercase tracking-wider">{def.label}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <WidgetMenu onRemove={onRemove} />
        </div>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed px-3 pb-3 flex-1">
        {INSIGHT_BODY[metricId] ?? "AI tahlil bu yerda ko'rinadi."}
      </p>
      <ResizeHandle />
    </div>
  )
}
