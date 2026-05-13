'use client'

import { ArrowDown, ArrowUp, Bot, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'

const BRAND_COLORS = {
  meta: '#1877F2',
  google: '#4285F4',
  tiktok: '#000000',
  amocrm: '#0094FF',
  telegram: '#26A5E4',
  payme: '#00C2A8',
  sheets: '#0F9D58',
  click: '#F24E1E',
} as const

const INTEGRATION_INITIALS: Record<string, string> = {
  'Meta Ads': 'M',
  'Google Ads': 'G',
  'TikTok Ads': 'T',
  AmoCRM: 'A',
  Telegram: 'T',
  Payme: 'P',
  'Google Sheets': 'S',
  Click: 'C',
}

const INTEGRATION_COLOR: Record<string, string> = {
  'Meta Ads': BRAND_COLORS.meta,
  'Google Ads': BRAND_COLORS.google,
  'TikTok Ads': BRAND_COLORS.tiktok,
  AmoCRM: BRAND_COLORS.amocrm,
  Telegram: BRAND_COLORS.telegram,
  Payme: BRAND_COLORS.payme,
  'Google Sheets': BRAND_COLORS.sheets,
  Click: BRAND_COLORS.click,
}

/** Soft animated gradient blob — decorative background element. */
export function DecorativeBlob({
  className = '',
  color = '#84cc16',
  size = 280,
}: {
  className?: string
  color?: string
  size?: number
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-0 rounded-full opacity-30 blur-3xl lp-blob ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  )
}

/** Animated dashboard mock for the hero. SVG-only, no external assets. */
export function HeroDashboardMock() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#d9f99d] bg-gradient-to-br from-[#ecfccb] to-[#dcfce7] p-4 shadow-lg">
      <DecorativeBlob className="-right-10 -top-10" color="#84cc16" size={200} />
      <DecorativeBlob className="-bottom-10 -left-10" color="#34d399" size={180} />

      <div className="relative grid h-full grid-cols-[1.5fr_1fr] gap-3">
        {/* Left: chart card */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#d9f99d] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">ROAS · 30 days</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#1f2b0f]">4.82×</span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-semibold text-[#15803d]">
                  <ArrowUp className="h-2.5 w-2.5" /> 34%
                </span>
              </div>
            </div>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#84cc16] lp-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#65a30d]" />
            </span>
          </div>

          {/* Mini line chart */}
          <svg viewBox="0 0 240 90" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lp-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,70 L30,60 L60,65 L90,50 L120,55 L150,38 L180,42 L210,22 L240,18 L240,90 L0,90 Z"
              fill="url(#lp-chart-fill)"
            />
            <path
              d="M0,70 L30,60 L60,65 L90,50 L120,55 L150,38 L180,42 L210,22 L240,18"
              stroke="#65a30d"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lp-draw-line"
            />
            <circle cx="240" cy="18" r="3.5" fill="#65a30d" />
            <circle cx="240" cy="18" r="3.5" fill="#65a30d" opacity="0.4" className="lp-pulse-ring" />
          </svg>

          {/* Mini bar chart */}
          <div className="flex h-10 items-end gap-1.5">
            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-[#84cc16] to-[#bef264] lp-grow-bar"
                style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Right: KPI tiles */}
        <div className="flex flex-col gap-2.5">
          <KpiTile label="Spend" value="$12.4k" delta="−18%" deltaColor="green" delay={0} />
          <KpiTile label="CPA" value="$8.20" delta="−28%" deltaColor="green" delay={100} />
          <KpiTile label="CTR" value="3.4%" delta="+12%" deltaColor="green" delay={200} />
          <div className="lp-fade-up flex items-center gap-2 rounded-xl border border-[#bef264] bg-[#f0fdf4] p-2.5" style={{ animationDelay: '300ms' }}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#84cc16]">
              <Bot className="h-3.5 w-3.5 text-[#1a2e05]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-[#1a2e05]">AI suggestion</p>
              <p className="truncate text-[9px] text-[#3f6212]">Scale winning ad by 25%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiTile({
  label,
  value,
  delta,
  deltaColor,
  delay = 0,
}: {
  label: string
  value: string
  delta: string
  deltaColor: 'green' | 'red'
  delay?: number
}) {
  const up = delta.startsWith('+')
  return (
    <div
      className="lp-fade-up rounded-xl border border-[#d9f99d] bg-white p-2.5 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-0.5 flex items-baseline justify-between gap-1">
        <span className="text-sm font-bold text-[#1f2b0f]">{value}</span>
        <span
          className={`inline-flex items-center gap-0.5 rounded text-[9px] font-semibold ${
            deltaColor === 'green' ? 'text-[#15803d]' : 'text-[#b91c1c]'
          }`}
        >
          {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
          {delta.replace(/^[+−-]/, '')}
        </span>
      </div>
    </div>
  )
}

/** Brand-colored circular badge for integration name. */
export function IntegrationChip({ name }: { name: string }) {
  const color = INTEGRATION_COLOR[name] ?? '#84cc16'
  const initial = INTEGRATION_INITIALS[name] ?? name.charAt(0).toUpperCase()
  return (
    <div className="lp-card-hover flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 shadow-sm">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
        style={{ background: color }}
      >
        {initial}
      </span>
      <span className="text-sm font-medium text-text-secondary">{name}</span>
    </div>
  )
}

/** Animated arrow used in pricing badge / problem-solution transitions. */
export function AnimatedArrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 12h14M13 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Decorative ROI section visual — animated upward line chart. */
export function ROIChart() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d9f99d] bg-gradient-to-br from-[#1f2b0f] to-[#365314] p-6 text-white">
      <DecorativeBlob className="-right-16 -top-16" color="#84cc16" size={240} />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 px-2.5 py-1 text-xs font-medium text-[#d9f99d]">
            <Sparkles className="h-3 w-3" />
            Live performance
          </p>
          <p className="mt-3 text-3xl font-bold">+34% ROAS</p>
          <p className="text-sm text-slate-300">avg. across customers · 90 days</p>
        </div>
        <TrendingUp className="h-8 w-8 text-[#84cc16]" />
      </div>

      <svg viewBox="0 0 400 100" className="mt-4 h-24 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lp-roi-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#84cc16" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,85 L50,75 L100,80 L150,60 L200,65 L250,40 L300,45 L350,20 L400,15 L400,100 L0,100 Z" fill="url(#lp-roi-fill)" />
        <path
          d="M0,85 L50,75 L100,80 L150,60 L200,65 L250,40 L300,45 L350,20 L400,15"
          stroke="#d9f99d"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          className="lp-draw-line"
        />
        <circle cx="400" cy="15" r="5" fill="#d9f99d" />
        <circle cx="400" cy="15" r="5" fill="#d9f99d" opacity="0.4" className="lp-pulse-ring" />
      </svg>
    </div>
  )
}

/** Small "live" pulsing dot indicator. */
export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#84cc16] lp-pulse-ring" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#65a30d]" />
    </span>
  )
}

/** Animated check used in solution callouts. */
export function AnimatedCheck() {
  return <CheckCircle2 className="h-5 w-5 text-[#65a30d] lp-float" />
}
