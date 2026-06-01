'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const SCENARIOS = [
  { label: 'Keep current', roas: '3.1×', spend: '$12K', kind: 'base' },
  { label: '+20% Meta', roas: '3.6×', spend: '$14K', kind: 'good' },
  { label: '+30% TT, -10% Google', roas: '4.2×', spend: '$13K', kind: 'best' },
  { label: 'Cap CPA $1.5', roas: '2.8×', spend: '$10K', kind: 'risky' },
]

const KIND: Record<string, string> = {
  base: 'ring-[#eef3e3] bg-white',
  good: 'ring-[#dfeacb] bg-[#fafdf5]',
  best: 'ring-[#84cc16] bg-[#ecfccb]',
  risky: 'ring-[#fde68a] bg-[#fffbeb]',
}

export function SimulationAnim() {
  return (
    <MockFrame
      label="scenario simulator"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          14-day model
        </span>
      }
      glow="sky"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">What-if outcomes</p>

      <svg viewBox="0 0 360 30" className="mt-3 block h-7 w-full" aria-hidden="true">
        <path
          d="M 20 15 L 80 15 M 80 15 L 160 5 M 80 15 L 160 15 M 80 15 L 160 25 M 80 15 L 160 38"
          fill="none"
          stroke="#cfe8c0"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: 'simDraw 0.9s ease-out 0.2s both' }}
        />
        <circle cx="20" cy="15" r="5" fill="#1b2e06" />
      </svg>

      <ul className="mt-2 space-y-2">
        {SCENARIOS.map((s, i) => (
          <li
            key={s.label}
            className={`flex items-center justify-between rounded-xl p-3 ring-1 ring-inset ${KIND[s.kind]}`}
            style={{ animation: `mockSlideRight 0.5s ease-out ${0.3 + i * 0.12}s both` }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                  s.kind === 'best'
                    ? 'bg-[#1b2e06] text-[#d9f99d]'
                    : s.kind === 'risky'
                      ? 'bg-[#fef3c7] text-[#a16207]'
                      : 'bg-white text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-xs font-medium text-text-primary">{s.label}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] tabular-nums">
              <span className="font-semibold text-text-primary">{s.roas}</span>
              <span className="text-text-tertiary">{s.spend}</span>
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        ${SHARED_ANIM_STYLES}
        @keyframes simDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="simDraw"] { animation: none !important; }
        }
      `}</style>
    </MockFrame>
  )
}
