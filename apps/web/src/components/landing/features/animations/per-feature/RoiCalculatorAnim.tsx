'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const INPUTS = [
  { label: 'Ad spend', value: '$12,400', accent: false },
  { label: 'CRM revenue', value: '$48,900', accent: false },
  { label: 'Recurring (LTV)', value: '$18,300', accent: false },
  { label: 'Attribution window', value: '30 days', accent: false },
]

export function RoiCalculatorAnim() {
  return (
    <MockFrame
      label="ROI calculator"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          Last-click
        </span>
      }
    >
      <ul className="space-y-2">
        {INPUTS.map((row, i) => (
          <li
            key={row.label}
            className="flex items-center justify-between rounded-xl bg-[#fafdf5] px-3.5 py-2.5 ring-1 ring-inset ring-[#eef3e3]"
            style={{ animation: `mockFadeIn 0.4s ease-out ${i * 0.1}s both` }}
          >
            <span className="text-xs font-medium text-text-secondary">{row.label}</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{row.value}</span>
          </li>
        ))}
      </ul>

      <div
        className="mt-4 overflow-hidden rounded-2xl bg-[#1b2e06] p-5 text-white"
        style={{ animation: 'mockFadeIn 0.6s ease-out 0.6s both' }}
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a3e635]/85">Total ROI</p>
          <span className="text-[10px] text-white/60">vs prev period · +24%</span>
        </div>
        <p className="mt-2 text-4xl font-semibold tabular-nums text-[#d9f99d]">427%</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <div className="rounded-lg bg-[#243a12]/80 px-2 py-1.5">
            <p className="font-medium uppercase tracking-wider text-white/55">Direct</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">$48.9K</p>
          </div>
          <div className="rounded-lg bg-[#243a12]/80 px-2 py-1.5">
            <p className="font-medium uppercase tracking-wider text-white/55">Repeat</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">$18.3K</p>
          </div>
          <div className="rounded-lg bg-[#243a12]/80 px-2 py-1.5">
            <p className="font-medium uppercase tracking-wider text-white/55">Spend</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">$12.4K</p>
          </div>
        </div>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
