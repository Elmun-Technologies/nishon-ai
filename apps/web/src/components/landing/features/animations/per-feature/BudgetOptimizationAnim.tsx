'use client'

import { ArrowRight } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const BEFORE = [
  { ch: 'Meta', pct: 50, color: 'bg-[#dbeafe]' },
  { ch: 'Google', pct: 30, color: 'bg-[#fef3c7]' },
  { ch: 'TikTok', pct: 20, color: 'bg-[#fce7f3]' },
]
const AFTER = [
  { ch: 'Meta', pct: 68, color: 'bg-[#3f6212]', text: 'text-white' },
  { ch: 'Google', pct: 18, color: 'bg-[#65a30d]', text: 'text-white' },
  { ch: 'TikTok', pct: 14, color: 'bg-[#a3e635]', text: 'text-[#1a2e05]' },
]

export function BudgetOptimizationAnim() {
  return (
    <MockFrame
      label="budget allocation"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          $12,000 / day
        </span>
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Before</p>
      <div className="mt-2 flex h-9 w-full overflow-hidden rounded-xl ring-1 ring-inset ring-[#eef3e3]">
        {BEFORE.map((b) => (
          <div
            key={b.ch}
            className={`flex h-full items-center justify-center text-[11px] font-semibold text-text-secondary ${b.color}`}
            style={{ width: `${b.pct}%` }}
          >
            {b.ch} · {b.pct}%
          </div>
        ))}
      </div>

      <div
        className="my-3 flex items-center justify-center gap-2 text-[11px] font-medium text-[#3f6212]"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.4s both' }}
      >
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        AI rebalanced for max ROAS
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3f6212]">After</p>
      <div className="mt-2 flex h-9 w-full overflow-hidden rounded-xl shadow-[0_8px_24px_-12px_rgba(27,46,6,0.32)]">
        {AFTER.map((a, i) => (
          <div
            key={a.ch}
            className={`flex h-full items-center justify-center text-[11px] font-semibold ${a.color} ${a.text}`}
            style={{
              width: `${a.pct}%`,
              animation: `budgetGrow 1s cubic-bezier(0.22, 1, 0.36, 1) ${0.7 + i * 0.12}s both`,
              transformOrigin: 'left',
            }}
          >
            {a.ch} · {a.pct}%
          </div>
        ))}
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-2"
        style={{ animation: 'mockFadeIn 0.5s ease-out 1.1s both' }}
      >
        {[
          { k: 'Δ ROAS', v: '+0.6×' },
          { k: 'Δ CPA', v: '-12%' },
          { k: 'Confidence', v: '94%' },
        ].map((m) => (
          <div key={m.k} className="rounded-lg bg-[#fafdf5] p-2.5 ring-1 ring-inset ring-[#eef3e3]">
            <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">{m.k}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#3f6212]">{m.v}</p>
          </div>
        ))}
      </div>

      <style>{`
        ${SHARED_ANIM_STYLES}
        @keyframes budgetGrow {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="budgetGrow"] { animation: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </MockFrame>
  )
}
