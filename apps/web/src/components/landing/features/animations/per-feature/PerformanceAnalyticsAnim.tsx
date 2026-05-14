'use client'

import { ArrowUpRight } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const SERIES = [12, 18, 14, 22, 28, 24, 34, 30, 42, 48, 44, 56, 62, 70]
const BARS = [38, 52, 41, 64, 49, 71, 58, 66, 82, 73]

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

export function PerformanceAnalyticsAnim() {
  const width = 480
  const height = 120
  const padding = 12
  const linePath = buildPath(SERIES, width, height, padding)
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const lastX = padding + innerW
  const areaPath = `${linePath} L ${lastX.toFixed(1)} ${(height - padding).toFixed(1)} L ${padding} ${(height - padding).toFixed(1)} Z`

  return (
    <MockFrame
      label="performance · all channels"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          +0.6×
        </span>
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">ROAS · 14d</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-text-primary">3.42×</p>

      <div className="mt-3 rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-24 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="perf-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#65a30d" />
              <stop offset="100%" stopColor="#84cc16" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#perf-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#perf-stroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: 'perfDraw 2s ease-out both' }}
          />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { k: 'CTR', v: '4.2%' },
          { k: 'CPA', v: '$1.7' },
          { k: 'Spend', v: '$12K' },
        ].map((m) => (
          <div key={m.k} className="rounded-lg bg-white ring-1 ring-inset ring-[#eef3e3] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">{m.k}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">{m.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex h-12 items-end justify-between gap-1 rounded-xl bg-[#fafdf5] p-2.5 ring-1 ring-inset ring-[#eef3e3]">
        {BARS.map((v, i) => (
          <span
            key={i}
            className="block w-full rounded-sm bg-gradient-to-t from-[#65a30d] to-[#a3e635]"
            style={{
              height: `${v}%`,
              animation: `perfBarGrow 0.6s ease-out ${0.2 + i * 0.04}s both`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>

      <style>{`
        ${SHARED_ANIM_STYLES}
        @keyframes perfDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes perfBarGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="perfDraw"], [style*="perfBarGrow"] { animation: none !important; transform: none !important; }
        }
      `}</style>
    </MockFrame>
  )
}
