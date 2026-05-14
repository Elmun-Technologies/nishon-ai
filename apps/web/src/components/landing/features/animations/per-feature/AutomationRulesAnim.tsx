'use client'

import { GitBranch, Pause, TrendingUp, Bell } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

export function AutomationRulesAnim() {
  return (
    <MockFrame
      label="rules engine"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          3 active
        </span>
      }
    >
      <div className="space-y-3">
        {[
          {
            condition: 'CPA > $2.00',
            timeframe: 'rolling 24h',
            actions: [
              { icon: Pause, label: 'Pause campaign', color: 'bg-[#fef3c7] text-[#a16207]' },
              { icon: Bell, label: 'Telegram alert', color: 'bg-[#dbeafe] text-[#1d4ed8]' },
            ],
          },
          {
            condition: 'ROAS > 4.0×',
            timeframe: 'rolling 7d',
            actions: [
              { icon: TrendingUp, label: 'Scale budget +20%', color: 'bg-[#ecfccb] text-[#3f6212]' },
            ],
          },
        ].map((rule, ri) => (
          <div
            key={ri}
            className="overflow-hidden rounded-xl bg-[#fafdf5] ring-1 ring-inset ring-[#eef3e3]"
            style={{ animation: `mockFadeIn 0.5s ease-out ${ri * 0.2}s both` }}
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-stretch gap-0">
              <div className="flex flex-col justify-center bg-white px-3.5 py-3 ring-1 ring-inset ring-[#eef3e3]">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">IF</p>
                <p className="mt-0.5 text-xs font-semibold tabular-nums text-text-primary">{rule.condition}</p>
                <p className="text-[10px] text-text-tertiary">{rule.timeframe}</p>
              </div>

              <div className="flex items-center justify-center px-2">
                <GitBranch className="h-3.5 w-3.5 text-[#3f6212] rotate-90" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-1.5 bg-white px-3.5 py-3 ring-1 ring-inset ring-[#eef3e3]">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">THEN</p>
                {rule.actions.map((a, ai) => {
                  const Icon = a.icon
                  return (
                    <div
                      key={ai}
                      className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium ${a.color}`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {a.label}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#cfe8c0] px-3.5 py-2 text-[11px] text-text-tertiary"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.6s both' }}
      >
        <span>+ Add rule from 12 templates</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#3f6212]">no-code</span>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
