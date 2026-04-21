'use client'

import type { AudienceJourneyStep } from '@/lib/audience-story/types'
import { cn } from '@/lib/utils'

export function JourneyFunnel({ steps }: { steps: AudienceJourneyStep[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1)
  return (
    <section className="rounded-2xl border border-border/80 bg-surface shadow-sm p-5 md:p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Journey Story</h3>
      <p className="text-xs text-text-tertiary mb-5">Har bosqichda “nega tushdi” — AI tahlil (mock).</p>
      <div className="space-y-4">
        {steps.map((step, i) => {
          const wPct = Math.round((step.count / max) * 100)
          return (
            <div key={step.id} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {i + 1}. {step.label}
                </span>
                <span className="text-xs tabular-nums text-text-tertiary">
                  {step.count.toLocaleString('uz-UZ')} · {step.stageRatePct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    i === 0 ? 'bg-violet-500/80' : 'bg-gradient-to-r from-violet-500/70 to-blue-500/70',
                  )}
                  style={{ width: `${wPct}%` }}
                />
              </div>
              {step.dropoffInsight && (
                <p className="text-[11px] leading-relaxed text-text-secondary border-l-2 border-violet-500/40 pl-2">
                  {step.dropoffInsight}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
