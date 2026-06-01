'use client'

import { Brain, Sparkles, Wallet, Zap } from 'lucide-react'
import { MockFrame, LiveDot, SHARED_ANIM_STYLES } from '../MockFrame'

const DECISIONS = [
  { icon: Wallet, label: 'Budget', action: 'Shifted 22% → Meta Ads', delta: '+18% ROAS', time: '2 min ago' },
  { icon: Sparkles, label: 'Creative', action: 'Paused 2 low-score ads', delta: 'CTR 2.1 → 3.4%', time: '5 min ago' },
  { icon: Zap, label: 'Bid', action: 'Cap raised on TT cluster', delta: '-12% CPA', time: '8 min ago' },
]

export function AiDecisionsAnim() {
  return (
    <MockFrame
      label="AI decision log"
      badge={<LiveDot />}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#1b2e06] text-[#d9f99d]">
          <Brain className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-xs font-medium text-text-secondary">3 explainable actions today</p>
      </div>

      <ul className="space-y-2.5">
        {DECISIONS.map((d, i) => {
          const Icon = d.icon
          return (
            <li
              key={d.label}
              className="flex items-start gap-3 rounded-xl bg-[#fafdf5] p-3.5 ring-1 ring-inset ring-[#eef3e3]"
              style={{ animation: `mockFadeIn 0.5s ease-out ${0.15 + i * 0.2}s both` }}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1b2e06] text-[#d9f99d]">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3f6212]">{d.label}</p>
                  <span className="text-[10px] text-text-tertiary">{d.time}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-text-primary">{d.action}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-full bg-[#ecfccb] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#3f6212]">
                {d.delta}
              </span>
            </li>
          )
        })}
      </ul>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
