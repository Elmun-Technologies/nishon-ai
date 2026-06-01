'use client'

import { Check, Rocket, Sparkles, Target, Users } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const STEPS = [
  { icon: Target, title: 'Goal', detail: 'Sales · ROAS 3.5×' },
  { icon: Users, title: 'Audience', detail: 'LAL 1% · TT 25–34' },
  { icon: Sparkles, title: 'Creative', detail: '6 variants · scored' },
  { icon: Rocket, title: 'Launch', detail: 'Live in 2 min' },
]

export function LaunchWizardAnim() {
  return (
    <MockFrame
      label="launch wizard"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          step 4 / 4
        </span>
      }
    >
      <ol className="relative space-y-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#cfe8c0] to-transparent"
        />
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <li
              key={s.title}
              className="relative flex items-center gap-3"
              style={{ animation: `mockSlideRight 0.5s ease-out ${i * 0.18}s both` }}
            >
              <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b2e06] text-[#d9f99d] ring-4 ring-white">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="flex-1 rounded-xl bg-[#fafdf5] px-3.5 py-2.5 ring-1 ring-inset ring-[#eef3e3]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#3f6212]">{s.title}</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums text-text-primary">{s.detail}</p>
              </div>
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecfccb] text-[#3f6212]"
                style={{ animation: `mockFadeIn 0.4s ease-out ${0.5 + i * 0.18}s both` }}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            </li>
          )
        })}
      </ol>

      <div
        className="mt-4 rounded-xl bg-[#1b2e06] p-4 text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)]"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.9s both' }}
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#a3e635]/85">Projected ROAS</p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#d9f99d]">3.5×</p>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
