'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Sparkles } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'

const CHART_POINTS = [12, 18, 14, 22, 28, 24, 34, 30, 42, 48, 44, 56, 62, 70]

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
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(1, max - min)
  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const step = innerW / (points.length - 1)
  const line = points
    .map((p, i) => {
      const x = padding + i * step
      const y = padding + innerH - ((p - min) / range) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const lastX = padding + (points.length - 1) * step
  return `${line} L ${lastX.toFixed(1)} ${(height - padding).toFixed(1)} L ${padding} ${(height - padding).toFixed(1)} Z`
}

const ROTATING_LABELS = ['Meta Ads', 'Google Ads', 'TikTok Ads'] as const

export function HeroLiveDemo() {
  const [rotIdx, setRotIdx] = useState(0)
  const reducedMotion = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion.current) return
    const id = window.setInterval(() => setRotIdx((i) => (i + 1) % ROTATING_LABELS.length), 2200)
    return () => window.clearInterval(id)
  }, [])

  const width = 480
  const height = 200
  const padding = 14
  const linePath = buildPath(CHART_POINTS, width, height, padding)
  const areaPath = buildArea(CHART_POINTS, width, height, padding)

  return (
    <div
      role="img"
      aria-label="Live dashboard demonstration"
      className="relative isolate overflow-hidden rounded-3xl bg-white ring-1 ring-[#e6efd9] shadow-[0_30px_60px_-30px_rgba(27,46,6,0.32),0_8px_24px_-16px_rgba(27,46,6,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_0%_0%,#f4f9ea_0%,transparent_55%)]" />

      <div className="flex items-center justify-between border-b border-[#eef3e3] px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]/80" aria-hidden="true" />
        </div>
        <p className="text-[11px] font-medium text-text-tertiary">app.adspectr.com / campaigns</p>
        <Sparkles className="h-3.5 w-3.5 text-[#65a30d]" aria-hidden="true" />
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-[1.35fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Performance
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[11px] font-semibold text-[#3f6212]">
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              ROAS +
              <AnimatedCounter value={34} suffix="%" duration={1600} />
            </span>
          </div>

          <div className="rounded-xl bg-[#fafdf5] ring-1 ring-inset ring-[#eef3e3] p-3">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="block h-32 w-full"
              role="presentation"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84cc16" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="hero-chart-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#65a30d" />
                  <stop offset="100%" stopColor="#84cc16" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#hero-chart-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#hero-chart-stroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: 0,
                  animation: 'heroLineDraw 2.2s ease-out both',
                }}
              />
              {CHART_POINTS.map((p, i) => {
                const innerW = width - padding * 2
                const innerH = height - padding * 2
                const step = innerW / (CHART_POINTS.length - 1)
                const max = Math.max(...CHART_POINTS)
                const min = Math.min(...CHART_POINTS)
                const range = Math.max(1, max - min)
                const cx = padding + i * step
                const cy = padding + innerH - ((p - min) / range) * innerH
                if (i !== CHART_POINTS.length - 1) return null
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="9" fill="#84cc16" opacity="0.18">
                      <animate
                        attributeName="r"
                        values="6;14;6"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.28;0;0.28"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx={cx} cy={cy} r="4" fill="#65a30d" />
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { k: 'CTR', v: 4.2, suffix: '%' },
              { k: 'CPA', v: 1.7, suffix: '$', prefix: '' },
              { k: 'Spend', v: 12, suffix: 'K $' },
            ].map((m) => (
              <div key={m.k} className="rounded-lg bg-white ring-1 ring-inset ring-[#eef3e3] px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">{m.k}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">
                  <AnimatedCounter
                    value={m.v}
                    decimals={m.v % 1 !== 0 ? 1 : 0}
                    prefix={m.prefix ?? ''}
                    suffix={m.suffix}
                    duration={1500}
                  />
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            AI agent
          </p>

          <div className="rounded-xl bg-[#1b2e06] p-4 text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#a3e635]/80">
              Auto-optimization
            </p>
            <p className="mt-1.5 text-sm leading-snug">
              Shifted 22% budget to{' '}
              <span
                key={rotIdx}
                className="inline-block rounded bg-[#a3e635]/15 px-1.5 py-0.5 font-medium text-[#d9f99d] [animation:heroFade_0.5s_ease-out]"
              >
                {ROTATING_LABELS[rotIdx]}
              </span>
            </p>
            <p className="mt-1 text-xs text-white/60">expected lift +18% ROAS · 2 min ago</p>
          </div>

          <ul className="space-y-2">
            {['Creative scored 92/100', 'Audience cluster updated', 'Bid pacing on track'].map((line, i) => (
              <li
                key={line}
                className="flex items-center gap-2 rounded-lg bg-[#fafdf5] ring-1 ring-inset ring-[#eef3e3] px-3 py-2 text-xs text-text-secondary [animation:heroSlideIn_0.6s_ease-out_both]"
                style={{ animationDelay: `${0.3 + i * 0.18}s` }}
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ecfccb] text-[#3f6212]">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes heroLineDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="heroLineDraw"], [style*="heroFade"], [style*="heroSlideIn"] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
