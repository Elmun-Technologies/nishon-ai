'use client'

import { Crown, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const ADS = [
  { rank: 1, name: 'Spring promo · v3', roas: '5.8×', trend: 'up', delta: '+2', channel: 'Meta' },
  { rank: 2, name: 'UGC reaction', roas: '5.1×', trend: 'up', delta: '+1', channel: 'TT' },
  { rank: 3, name: 'Brand search · headline 4', roas: '4.6×', trend: 'down', delta: '-1', channel: 'Google' },
  { rank: 4, name: 'Reels demo', roas: '4.2×', trend: 'flat', delta: '0', channel: 'Meta' },
  { rank: 5, name: 'Carousel · A/B', roas: '3.9×', trend: 'up', delta: '+3', channel: 'Meta' },
]

const TREND_ICON = { up: ArrowUp, down: ArrowDown, flat: Minus }
const TREND_COLOR: Record<string, string> = {
  up: 'text-[#3f6212] bg-[#ecfccb]',
  down: 'text-[#b91c1c] bg-[#fef2f2]',
  flat: 'text-text-tertiary bg-[#eef3e3]',
}

export function TopAdsAnim() {
  return (
    <MockFrame
      label="top performers"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          by ROAS
        </span>
      }
      glow="amber"
    >
      <ul className="space-y-2">
        {ADS.map((ad, i) => {
          const Trend = TREND_ICON[ad.trend as keyof typeof TREND_ICON]
          return (
            <li
              key={ad.name}
              className={`relative flex items-center gap-3 rounded-xl p-3 ${
                ad.rank === 1
                  ? 'bg-[#1b2e06] text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)]'
                  : 'bg-[#fafdf5] ring-1 ring-inset ring-[#eef3e3]'
              }`}
              style={{ animation: `mockSlideRight 0.5s ease-out ${i * 0.12}s both` }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                {ad.rank === 1 ? (
                  <Crown className="h-4 w-4 text-[#facc15]" aria-hidden="true" />
                ) : (
                  <span
                    className={`text-base font-semibold tabular-nums ${
                      ad.rank === 2 ? 'text-text-secondary' : 'text-text-tertiary'
                    }`}
                  >
                    {ad.rank}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-medium ${ad.rank === 1 ? 'text-white' : 'text-text-primary'}`}>
                  {ad.name}
                </p>
                <p className={`text-[10px] ${ad.rank === 1 ? 'text-white/60' : 'text-text-tertiary'}`}>
                  {ad.channel}
                </p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${ad.rank === 1 ? 'text-[#d9f99d]' : 'text-text-primary'}`}>
                {ad.roas}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  ad.rank === 1 ? 'bg-[#a3e635]/15 text-[#d9f99d]' : TREND_COLOR[ad.trend]
                }`}
              >
                <Trend className="h-2.5 w-2.5" aria-hidden="true" />
                {ad.delta}
              </span>
            </li>
          )
        })}
      </ul>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
