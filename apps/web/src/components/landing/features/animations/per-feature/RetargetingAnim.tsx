'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const TOUCHPOINTS = [
  { label: 'Visit', day: 'd0' },
  { label: 'AddToCart', day: 'd1' },
  { label: 'Discount', day: 'd3' },
  { label: 'Reminder', day: 'd5' },
  { label: 'Urgency', day: 'd7' },
  { label: 'Purchase', day: 'd9' },
]

export function RetargetingAnim() {
  return (
    <MockFrame
      label="retargeting funnel"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          7d window
        </span>
      }
      glow="amber"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Auto-sequence · cross-channel
      </p>

      <svg viewBox="0 0 360 80" className="mt-4 block h-20 w-full" aria-hidden="true">
        <defs>
          <linearGradient id="retarget-track" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#cfe8c0" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        <line x1="20" y1="40" x2="340" y2="40" stroke="url(#retarget-track)" strokeWidth="2" strokeLinecap="round" />
        {TOUCHPOINTS.map((p, i) => {
          const x = 20 + (320 / (TOUCHPOINTS.length - 1)) * i
          return (
            <g key={p.label} style={{ animation: `mockFadeIn 0.4s ease-out ${i * 0.12}s both` }}>
              <circle cx={x} cy={40} r="6" fill="#1b2e06" />
              <circle cx={x} cy={40} r="3.5" fill="#a3e635" />
              <text x={x} y={20} textAnchor="middle" fontSize="9" fontWeight="600" fill="#3f6212">
                {p.day}
              </text>
              <text x={x} y={62} textAnchor="middle" fontSize="9" fill="#5c7248">
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { ch: 'Meta', freq: '2.4', state: 'OK' },
          { ch: 'Google', freq: '1.8', state: 'OK' },
          { ch: 'TikTok', freq: '3.6', state: 'Cap' },
        ].map((c, i) => (
          <div
            key={c.ch}
            className="rounded-lg bg-[#fafdf5] p-2.5 ring-1 ring-inset ring-[#eef3e3]"
            style={{ animation: `mockFadeIn 0.4s ease-out ${0.6 + i * 0.1}s both` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">{c.ch}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm font-semibold tabular-nums text-text-primary">{c.freq}/d</p>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                  c.state === 'Cap' ? 'bg-[#fef3c7] text-[#a16207]' : 'bg-[#ecfccb] text-[#3f6212]'
                }`}
              >
                {c.state}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
