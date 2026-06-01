'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const COMPETITORS = [
  { name: 'Brand A', x: 80, y: 35, ads: 12 },
  { name: 'Brand B', x: 145, y: 100, ads: 8 },
  { name: 'Brand C', x: 220, y: 50, ads: 22 },
  { name: 'You', x: 165, y: 70, ads: 9, self: true },
]

export function CompetitorIntelAnim() {
  return (
    <MockFrame
      label="competitor radar"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          12 brands
        </span>
      }
      glow="violet"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Active creatives · last 7 days
      </p>

      <div className="relative mt-3 h-44 overflow-hidden rounded-xl bg-[#fafdf5] ring-1 ring-inset ring-[#eef3e3]">
        <svg viewBox="0 0 300 180" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {[40, 70, 100, 130].map((r) => (
            <circle key={r} cx="150" cy="90" r={r} fill="none" stroke="#cfe8c0" strokeWidth="0.7" strokeDasharray="2 3" />
          ))}
          <line x1="20" y1="90" x2="280" y2="90" stroke="#cfe8c0" strokeWidth="0.7" />
          <line x1="150" y1="10" x2="150" y2="170" stroke="#cfe8c0" strokeWidth="0.7" />
          <text x="20" y="86" fontSize="8" fill="#5c7248">low spend</text>
          <text x="240" y="86" fontSize="8" fill="#5c7248">high spend</text>
        </svg>

        {COMPETITORS.map((c, i) => (
          <div
            key={c.name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(c.x / 300) * 100}%`,
              top: `${(c.y / 180) * 100}%`,
              animation: `mockFadeIn 0.5s ease-out ${0.2 + i * 0.15}s both`,
            }}
          >
            {c.self ? (
              <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1b2e06] text-[9px] font-bold text-[#d9f99d] ring-4 ring-white">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84cc16] opacity-40" />
                You
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[8px] font-semibold text-[#3f6212] ring-1 ring-[#cfe8c0]">
                  {c.name.charAt(c.name.length - 1)}
                </span>
                <span className="mt-1 rounded bg-white px-1 py-0.5 text-[8px] tabular-nums text-text-tertiary ring-1 ring-inset ring-[#eef3e3]">
                  {c.ads}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {[
          { type: 'NEW', text: 'Brand C launched 4 reels (24h)' },
          { type: 'PAUSED', text: 'Brand A paused promo set' },
        ].map((alert, i) => (
          <li
            key={alert.text}
            className="flex items-center gap-2 rounded-lg bg-[#fafdf5] px-3 py-2 text-xs ring-1 ring-inset ring-[#eef3e3]"
            style={{ animation: `mockFadeIn 0.4s ease-out ${0.8 + i * 0.12}s both` }}
          >
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                alert.type === 'NEW' ? 'bg-[#ecfccb] text-[#3f6212]' : 'bg-[#fef3c7] text-[#a16207]'
              }`}
            >
              {alert.type}
            </span>
            <span className="text-text-secondary">{alert.text}</span>
          </li>
        ))}
      </ul>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
