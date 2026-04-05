'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface DataPoint {
  label?: string
  value?: number
  [key: string]: unknown
}

// ── Bar Chart ──────────────────────────────────────────────
export interface BarChartProps {
  data: DataPoint[]
  className?: string
  color?: string
}

export function BarChart({ data, className, color = '#7C3AED' }: BarChartProps) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1)
  return (
    <div className={cn('flex items-end gap-1 h-32', className)}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm transition-all duration-300"
            style={{ height: `${(Number(d.value || 0) / max) * 100}%`, backgroundColor: color, minHeight: 2 }}
          />
          {d.label && <span className="text-[10px] text-text-tertiary truncate w-full text-center">{d.label}</span>}
        </div>
      ))}
    </div>
  )
}

// ── Line Chart ─────────────────────────────────────────────
export interface LineChartProps {
  data: DataPoint[]
  /** If provided, use this key for X labels; otherwise use index */
  xKey?: string
  /** If provided, render multiple lines with these keys; otherwise use 'value' */
  yKeys?: string[]
  colors?: string[]
  className?: string
  color?: string
}

export function LineChart({ data, xKey, yKeys, colors, className, color = '#7C3AED' }: LineChartProps) {
  const W = 300
  const H = 80
  if (data.length < 2) return null

  const keys = yKeys ?? ['value']
  const lineColors = colors ?? [color]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn('w-full', className)}>
      {keys.map((key, ki) => {
        const vals = data.map((d) => Number(d[key]) || 0)
        const max = Math.max(...vals, 1)
        const pts = vals.map((v, i) => ({
          x: (i / (data.length - 1)) * W,
          y: H - (v / max) * H,
        }))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        return (
          <path
            key={key}
            d={path}
            fill="none"
            stroke={lineColors[ki] ?? '#7C3AED'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
      {/* X labels */}
      {xKey && data.map((d, i) => (
        <text
          key={i}
          x={(i / (data.length - 1)) * W}
          y={H}
          textAnchor="middle"
          fontSize="8"
          fill="#6B7280"
        >
          {String(d[xKey] ?? '')}
        </text>
      ))}
    </svg>
  )
}

// ── Pie Chart (simple SVG donut) ───────────────────────────
export interface PieChartProps {
  data: { label: string; value: number; color?: string }[]
  className?: string
}

export function PieChart({ data, className }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const defaultColors = ['#7C3AED', '#4285F4', '#FFCC00', '#34D399', '#F87171']
  let cumAngle = 0
  const R = 40
  const cx = 50
  const cy = 50

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI
    const x1 = cx + R * Math.sin(cumAngle)
    const y1 = cy - R * Math.cos(cumAngle)
    cumAngle += angle
    const x2 = cx + R * Math.sin(cumAngle)
    const y2 = cy - R * Math.cos(cumAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const color = d.color ?? defaultColors[i % defaultColors.length]
    return { x1, y1, x2, y2, largeArc, color, label: d.label, value: d.value }
  })

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${R} ${R} 0 ${s.largeArc} 1 ${s.x2} ${s.y2} Z`}
            fill={s.color}
            opacity={0.85}
          />
        ))}
        <circle cx={cx} cy={cy} r={R * 0.55} fill="#0D0D15" />
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color ?? defaultColors[i % defaultColors.length] }} />
            <span className="text-text-tertiary">{d.label}</span>
            <span className="text-white font-medium ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
