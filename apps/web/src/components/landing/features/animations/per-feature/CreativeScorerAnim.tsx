'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const CRITERIA = [
  { label: 'Hook strength', score: 88 },
  { label: 'Readability', score: 76 },
  { label: 'Brand fit', score: 94 },
  { label: 'CTA clarity', score: 82 },
]

const OVERALL = 92

export function CreativeScorerAnim() {
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (OVERALL / 100) * circumference

  return (
    <MockFrame
      label="creative scorecard"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          analyzed
        </span>
      }
      glow="violet"
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-5">
        <div className="relative inline-flex h-32 w-32 items-center justify-center">
          <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90" aria-hidden="true">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef3e3" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#65a30d"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                animation: `scorerSpin 1.4s cubic-bezier(0.22, 1, 0.36, 1) both`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tabular-nums text-text-primary">{OVERALL}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">score</span>
          </div>
        </div>

        <ul className="space-y-2">
          {CRITERIA.map((c, i) => (
            <li
              key={c.label}
              className="space-y-1"
              style={{ animation: `mockFadeIn 0.4s ease-out ${0.3 + i * 0.1}s both` }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-text-secondary">{c.label}</span>
                <span className="font-semibold tabular-nums text-text-primary">{c.score}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eef3e3]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#65a30d] to-[#a3e635]"
                  style={{
                    width: `${c.score}%`,
                    animation: `scorerBarGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${0.4 + i * 0.1}s both`,
                    transformOrigin: 'left',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="mt-4 flex items-center justify-between rounded-xl bg-[#1b2e06] px-3.5 py-2.5 text-xs text-white"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.9s both' }}
      >
        <span>Suggestion: tighten CTA, ~3 words.</span>
        <span className="rounded-full bg-[#a3e635]/15 px-2 py-0.5 text-[10px] font-semibold text-[#d9f99d]">+6 pts</span>
      </div>

      <style>{`
        ${SHARED_ANIM_STYLES}
        @keyframes scorerSpin {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${offset}; }
        }
        @keyframes scorerBarGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="scorerSpin"], [style*="scorerBarGrow"] { animation: none !important; }
        }
      `}</style>
    </MockFrame>
  )
}
