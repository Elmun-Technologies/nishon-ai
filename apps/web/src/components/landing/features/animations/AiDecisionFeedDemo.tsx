'use client'

import { Brain, Sparkles, Wallet, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

interface DecisionDef {
  icon: ReactNode
  label: string
  action: string
  delta: string
}

export interface AiDecisionFeedDemoProps {
  decisions?: DecisionDef[]
  headerLabel?: string
}

const DEFAULT_DECISIONS: DecisionDef[] = [
  { icon: <Wallet className="h-3.5 w-3.5" aria-hidden="true" />, label: 'Budget', action: 'Shifted 22% → Meta Ads', delta: '+18% ROAS' },
  { icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />, label: 'Creative', action: 'Paused 2 low-score ads', delta: 'CTR 2.1 → 3.4%' },
  { icon: <Zap className="h-3.5 w-3.5" aria-hidden="true" />, label: 'Bid', action: 'Cap raised on TT cluster', delta: '-12% CPA' },
]

export function AiDecisionFeedDemo({
  decisions = DEFAULT_DECISIONS,
  headerLabel = 'AI agent · auto-optimize',
}: AiDecisionFeedDemoProps) {
  return (
    <div
      role="img"
      aria-label="AI decision feed demonstration"
      className="relative isolate overflow-hidden rounded-3xl bg-white ring-1 ring-[#e6efd9] shadow-[0_30px_60px_-30px_rgba(27,46,6,0.32),0_8px_24px_-16px_rgba(27,46,6,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_100%_0%,#f4f9ea_0%,transparent_55%)]" />

      <div className="flex items-center justify-between border-b border-[#eef3e3] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#1b2e06] text-[#d9f99d]">
            <Brain className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <p className="text-[11px] font-medium text-text-tertiary">{headerLabel}</p>
        </div>
        <span className="relative flex items-center gap-1.5 text-[10px] font-semibold text-[#3f6212]">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84cc16] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#65a30d]" />
          </span>
          LIVE
        </span>
      </div>

      <ul className="space-y-2.5 p-5">
        {decisions.map((d, i) => (
          <li
            key={d.label}
            className="flex items-start gap-3 rounded-xl bg-[#fafdf5] p-3.5 ring-1 ring-inset ring-[#eef3e3] [animation:aiSlideUp_0.5s_ease-out_both]"
            style={{ animationDelay: `${0.15 + i * 0.22}s` }}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1b2e06] text-[#d9f99d]">
              {d.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3f6212]">{d.label}</p>
                <span className="text-[10px] text-text-tertiary">just now</span>
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-text-primary">{d.action}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-full bg-[#ecfccb] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#3f6212]">
              {d.delta}
            </span>
          </li>
        ))}

        <li
          className="flex items-center gap-3 rounded-xl border border-dashed border-[#cfe8c0] p-3.5 text-text-tertiary [animation:aiPulse_2.4s_ease-in-out_infinite]"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center">
            <span className="block h-1.5 w-1.5 rounded-full bg-[#65a30d] [animation:aiDot_1.2s_ease-in-out_infinite]" />
            <span className="ml-1 block h-1.5 w-1.5 rounded-full bg-[#65a30d] [animation:aiDot_1.2s_ease-in-out_infinite_0.2s]" />
            <span className="ml-1 block h-1.5 w-1.5 rounded-full bg-[#65a30d] [animation:aiDot_1.2s_ease-in-out_infinite_0.4s]" />
          </span>
          <p className="text-xs">analyzing next signal…</p>
        </li>
      </ul>

      <style>{`
        @keyframes aiSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes aiDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="aiSlideUp"], [class*="aiPulse"], [class*="aiDot"] { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
