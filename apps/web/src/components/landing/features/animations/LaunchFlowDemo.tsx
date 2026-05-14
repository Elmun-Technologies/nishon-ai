'use client'

import { Check, Rocket, Sparkles, Target, Users } from 'lucide-react'
import type { ReactNode } from 'react'

interface StepDef {
  icon: ReactNode
  title: string
  detail: string
}

export interface LaunchFlowDemoProps {
  steps?: StepDef[]
  metric?: { label: string; value: string; delta?: string }
}

const DEFAULT_STEPS: StepDef[] = [
  { icon: <Target className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Goal', detail: 'Sales · ROAS 3.5×' },
  { icon: <Users className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Audience', detail: 'LAL 1% · TT 25–34' },
  { icon: <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Creative', detail: '6 variants · scored' },
  { icon: <Rocket className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Launch', detail: 'Live in 2 min' },
]

export function LaunchFlowDemo({
  steps = DEFAULT_STEPS,
  metric = { label: 'Projected ROAS', value: '3.5×', delta: '+0.6×' },
}: LaunchFlowDemoProps) {
  return (
    <div
      role="img"
      aria-label="Campaign launch flow demonstration"
      className="relative isolate overflow-hidden rounded-3xl bg-white ring-1 ring-[#e6efd9] shadow-[0_30px_60px_-30px_rgba(27,46,6,0.32),0_8px_24px_-16px_rgba(27,46,6,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_0%_0%,#f4f9ea_0%,transparent_55%)]" />

      <div className="flex items-center justify-between border-b border-[#eef3e3] px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]/70" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]/80" aria-hidden="true" />
        </div>
        <p className="text-[11px] font-medium text-text-tertiary">launch wizard</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          step 4 / 4
        </span>
      </div>

      <div className="space-y-3 p-5">
        <ol className="relative space-y-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#cfe8c0] to-transparent"
          />
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex items-center gap-3 [animation:launchSlideIn_0.5s_ease-out_both]"
              style={{ animationDelay: `${i * 0.18}s` }}
            >
              <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b2e06] text-[#d9f99d] ring-4 ring-white">
                {step.icon}
              </span>
              <div className="flex-1 rounded-xl bg-[#fafdf5] px-3.5 py-2.5 ring-1 ring-inset ring-[#eef3e3]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#3f6212]">{step.title}</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums text-text-primary">{step.detail}</p>
              </div>
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecfccb] text-[#3f6212] opacity-0 [animation:launchTick_0.4s_ease-out_both]"
                style={{ animationDelay: `${0.5 + i * 0.18}s` }}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            </li>
          ))}
        </ol>

        <div className="rounded-xl bg-[#1b2e06] p-4 text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)] [animation:launchSlideIn_0.5s_ease-out_both]" style={{ animationDelay: '0.9s' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#a3e635]/85">{metric.label}</p>
            {metric.delta ? (
              <span className="rounded-full bg-[#a3e635]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#d9f99d]">
                {metric.delta}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#d9f99d]">{metric.value}</p>
        </div>
      </div>

      <style>{`
        @keyframes launchSlideIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes launchTick {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="launchSlideIn"], [style*="launchTick"] { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
