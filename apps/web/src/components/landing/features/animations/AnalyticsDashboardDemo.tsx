'use client'

import { ArrowUpRight, BarChart3 } from 'lucide-react'

export interface AnalyticsDashboardDemoProps {
  primaryLabel?: string
  primaryValue?: string
  primaryDelta?: string
  secondaryMetrics?: Array<{ k: string; v: string }>
  series?: number[]
}

const DEFAULT_SERIES = [12, 18, 14, 22, 28, 24, 34, 30, 42, 48, 44, 56, 62, 70]
const BAR_SERIES = [38, 52, 41, 64, 49, 71, 58, 66, 82, 73]

function buildPath(points: number[], width: number, height: number, padding: number) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(1, max - min)
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const step = innerW / (points.length - 1)
  return points
    .map((p, i) => {
      const x = padding + i * step
      const y = padding + innerH - ((p - min) / range) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function buildArea(points: number[], width: number, height: number, padding: number) {
  const innerW = width - padding * 2
  const lastX = padding + innerW
  return `${buildPath(points, width, height, padding)} L ${lastX.toFixed(1)} ${(height - padding).toFixed(1)} L ${padding} ${(height - padding).toFixed(1)} Z`
}

export function AnalyticsDashboardDemo({
  primaryLabel = 'ROAS · last 14 days',
  primaryValue = '3.42×',
  primaryDelta = '+0.6×',
  secondaryMetrics = [
    { k: 'CTR', v: '4.2%' },
    { k: 'CPA', v: '$1.7' },
    { k: 'Spend', v: '$12K' },
  ],
  series = DEFAULT_SERIES,
}: AnalyticsDashboardDemoProps) {
  const width = 480
  const height = 180
  const padding = 14
  const linePath = buildPath(series, width, height, padding)
  const areaPath = buildArea(series, width, height, padding)

  return (
    <div
      role="img"
      aria-label="Analytics dashboard demonstration"
      className="relative isolate overflow-hidden rounded-3xl bg-white ring-1 ring-[#e6efd9] shadow-[0_30px_60px_-30px_rgba(27,46,6,0.32),0_8px_24px_-16px_rgba(27,46,6,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,#f4f9ea_0%,transparent_55%)]" />

      <div className="flex items-center justify-between border-b border-[#eef3e3] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#f4f9ea] text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <p className="text-[11px] font-medium text-text-tertiary">analytics · all channels</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          {primaryDelta}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{primaryLabel}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-text-primary">{primaryValue}</p>
        </div>

        <div className="rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]">
          <svg viewBox={`0 0 ${width} ${height}`} className="block h-28 w-full" role="presentation" aria-hidden="true">
            <defs>
              <linearGradient id="analytics-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="analytics-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#65a30d" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#analytics-fill)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#analytics-stroke)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: 'analyticsLineDraw 2.2s ease-out both' }}
            />
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {secondaryMetrics.map((m) => (
            <div key={m.k} className="rounded-lg bg-white ring-1 ring-inset ring-[#eef3e3] px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">{m.k}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">{m.v}</p>
            </div>
          ))}
        </div>

        <div className="flex h-16 items-end justify-between gap-1.5 rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]">
          {BAR_SERIES.map((v, i) => (
            <span
              key={i}
              className="block w-full rounded-sm bg-gradient-to-t from-[#65a30d] to-[#a3e635] [animation:analyticsBarGrow_0.7s_ease-out_both]"
              style={{ height: `${v}%`, animationDelay: `${0.2 + i * 0.05}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes analyticsLineDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes analyticsBarGrow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="analyticsLineDraw"], [style*="analyticsBarGrow"] { animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
