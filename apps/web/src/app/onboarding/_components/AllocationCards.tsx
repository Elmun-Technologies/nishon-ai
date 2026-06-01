import { Info, Sparkles } from 'lucide-react'
import type { ChannelKey } from '@/lib/pre-auth-onboarding'
import { CHANNEL_COLORS } from '@/lib/pre-auth-onboarding'
import {
  CHANNEL_RATIONALE,
  formatCompactInt,
  formatUzsFull,
} from '../_lib/budget-allocator'
import type { AllocationResult } from '../_lib/budget-allocator'
import type { CjmStage } from '../_lib/types'
import { CHANNEL_LABELS } from '../_lib/types'

const SORT_ORDER: ChannelKey[] = [
  'metaAds',
  'google',
  'instagram',
  'telegram',
  'yandex',
  'uzum',
  'olx',
]

export function AllocationOverview({ result }: { result: AllocationResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Kanal taqsimoti
        </p>
        <p className="text-xs text-text-tertiary">
          Jami reach: <span className="font-semibold text-text-primary">~{formatCompactInt(result.totalReach)} kishi</span>
        </p>
      </div>
      {/* Stacked horizontal bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#eef3e3]">
        {SORT_ORDER.map((k) => {
          const pct = result.percent[k] ?? 0
          if (pct <= 0) return null
          return (
            <span
              key={k}
              className="block h-full"
              style={{
                width: `${pct}%`,
                background: CHANNEL_COLORS[k],
              }}
              title={`${CHANNEL_LABELS[k].title}: ${pct}%`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {SORT_ORDER.filter((k) => (result.percent[k] ?? 0) > 0).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: CHANNEL_COLORS[k] }}
            />
            {CHANNEL_LABELS[k].title} — {result.percent[k]}%
          </span>
        ))}
      </div>
    </div>
  )
}

export function AllocationCards({
  result,
  cjm,
  onAdjust,
}: {
  result: AllocationResult
  cjm: CjmStage
  onAdjust?: (channel: ChannelKey, percent: number) => void
}) {
  const channels = SORT_ORDER.filter((k) => (result.percent[k] ?? 0) > 0)

  return (
    <div className="space-y-2.5">
      {channels.map((k) => {
        const pct = result.percent[k]
        const uzs = result.uzs[k]
        const reach = result.reach[k]
        const rationale = CHANNEL_RATIONALE[cjm][k]
        const label = CHANNEL_LABELS[k]
        const color = CHANNEL_COLORS[k]

        return (
          <div
            key={k}
            className="group rounded-2xl bg-white p-4 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04)] transition-all hover:ring-[#cfe8c0]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                  style={{ background: `${color}1f`, color }}
                >
                  {label.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{label.title}</p>
                  <p className="text-[11px] text-text-tertiary">{label.tag}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tabular-nums tracking-tight text-text-primary">
                  {pct}%
                </p>
                <p className="text-[11px] text-text-tertiary tabular-nums">
                  {formatUzsFull(uzs)}
                </p>
              </div>
            </div>

            {rationale && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-[#fafdf5] p-2.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#65a30d]" aria-hidden />
                <p className="text-[12px] leading-relaxed text-text-secondary">{rationale}</p>
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-tertiary">
              <span>~{formatCompactInt(reach)} kishi</span>
              {onAdjust && (
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={pct}
                  onChange={(e) => onAdjust(k, Number(e.target.value))}
                  className="ml-3 max-w-[140px] flex-1 accent-[#65a30d]"
                  aria-label={`${label.title} taqsim`}
                />
              )}
            </div>
          </div>
        )
      })}

      <div className="flex items-start gap-2 rounded-xl bg-[#f4f9ea] p-3 ring-1 ring-inset ring-[#dde9c3]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3f6212]" aria-hidden />
        <p className="text-[12px] leading-relaxed text-text-secondary">
          Bu boshlang'ich taqsim. Dashboard'da kampaniyalar ishlay boshlagach,
          AI o'zi yaxshi ishlayotgan kanallarga ko'proq byudjet o'tkazib turadi.
        </p>
      </div>
    </div>
  )
}
