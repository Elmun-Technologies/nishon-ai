'use client'

import { Activity, ArrowUpRight, Pause, Play } from 'lucide-react'
import { MockFrame, LiveDot, SHARED_ANIM_STYLES } from '../MockFrame'

const STREAM = [
  { kind: 'scale', label: 'Scale winner', detail: 'Spring · LAL 1%', delta: '+25% budget', icon: Play },
  { kind: 'pause', label: 'Pause loss', detail: 'Display · low-int', delta: 'ROAS 0.9×', icon: Pause },
  { kind: 'shift', label: 'Reallocate', detail: 'TikTok → Meta', delta: '$420 shifted', icon: Activity },
  { kind: 'scale', label: 'Scale winner', detail: 'Retarget · 7d', delta: '+15% budget', icon: Play },
]

const ICON_BG: Record<string, string> = {
  scale: 'bg-[#ecfccb] text-[#3f6212]',
  pause: 'bg-[#fef3c7] text-[#a16207]',
  shift: 'bg-[#e0f2fe] text-[#1d4ed8]',
}

export function AutoOptimizationAnim() {
  return (
    <MockFrame
      label="auto-optimize stream"
      badge={<LiveDot label="AUTO" />}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Last 30 min</p>
        <span className="text-[10px] tabular-nums text-text-tertiary">4 actions</span>
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#cfe8c0] to-transparent"
        />
        <ul className="space-y-2.5">
          {STREAM.map((s, i) => {
            const Icon = s.icon
            return (
              <li
                key={i}
                className="relative flex items-start gap-3"
                style={{ animation: `mockSlideRight 0.5s ease-out ${i * 0.15}s both` }}
              >
                <span
                  className={`relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${ICON_BG[s.kind]}`}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl bg-[#fafdf5] px-3 py-2 ring-1 ring-inset ring-[#eef3e3]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-text-primary">
                      <span className="font-semibold">{s.label}</span> · {s.detail}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
                      <ArrowUpRight className="h-2.5 w-2.5" aria-hidden="true" />
                      {s.delta}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
