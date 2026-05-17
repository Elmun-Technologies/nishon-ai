'use client'

import { ArrowUpRight } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

interface Row {
  name: string
  channel: 'Meta' | 'Google' | 'TT'
  roas: string
  spend: string
  delta: string
  status: 'live' | 'paused'
}

const ROWS: Row[] = [
  { name: 'Spring · LAL 1%', channel: 'Meta', roas: '4.2×', spend: '$3.1K', delta: '+18%', status: 'live' },
  { name: 'Brand search', channel: 'Google', roas: '3.6×', spend: '$2.4K', delta: '+8%', status: 'live' },
  { name: 'Retarget · 7d', channel: 'TT', roas: '5.1×', spend: '$1.9K', delta: '+22%', status: 'live' },
  { name: 'Display · low-int', channel: 'Google', roas: '0.9×', spend: '$0.6K', delta: '-12%', status: 'paused' },
  { name: 'UGC stories', channel: 'Meta', roas: '3.4×', spend: '$2.0K', delta: '+5%', status: 'live' },
]

const CHANNEL_COLOR: Record<Row['channel'], string> = {
  Meta: 'bg-[#dbeafe] text-[#1d4ed8]',
  Google: 'bg-[#fef3c7] text-[#a16207]',
  TT: 'bg-[#fce7f3] text-[#9d174d]',
}

export function CampaignManagerAnim() {
  return (
    <MockFrame
      label="campaigns"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          5 selected
        </span>
      }
    >
      <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-[#eef3e3]">
        <div className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.6fr_0.4fr] gap-2 border-b border-[#eef3e3] bg-[#fafdf5] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          <span>Campaign</span>
          <span>Ch</span>
          <span className="text-right">ROAS</span>
          <span className="text-right">Spend</span>
          <span className="text-right">Δ</span>
        </div>
        {ROWS.map((r, i) => (
          <div
            key={r.name}
            className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.6fr_0.4fr] items-center gap-2 border-b border-[#eef3e3] px-3 py-2 last:border-0 hover:bg-[#fafdf5]"
            style={{ animation: `mockFadeIn 0.4s ease-out ${i * 0.1}s both` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  r.status === 'live' ? 'bg-[#65a30d]' : 'bg-text-tertiary/50'
                }`}
              />
              <span className="truncate text-xs font-medium text-text-primary">{r.name}</span>
            </div>
            <span className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${CHANNEL_COLOR[r.channel]}`}>
              {r.channel}
            </span>
            <span className="text-right text-xs font-semibold tabular-nums text-text-primary">{r.roas}</span>
            <span className="text-right text-xs tabular-nums text-text-secondary">{r.spend}</span>
            <span
              className={`text-right text-[11px] font-semibold tabular-nums ${
                r.delta.startsWith('-') ? 'text-[#b91c1c]' : 'text-[#3f6212]'
              }`}
            >
              {r.delta}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mt-3 flex items-center justify-between rounded-xl bg-[#1b2e06] px-3.5 py-2.5 text-xs text-white"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.6s both' }}
      >
        <span className="font-medium">Bulk action: increase budget +15%</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#a3e635]/15 px-2 py-0.5 text-[10px] font-semibold text-[#d9f99d]">
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          Apply
        </span>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
