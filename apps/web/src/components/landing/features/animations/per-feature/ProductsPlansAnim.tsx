'use client'

import { Check } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const PLANS = [
  { name: 'Starter', price: '$29', features: ['3 accounts', '50K events'], current: false, featured: false },
  { name: 'Growth', price: '$99', features: ['12 accounts', '500K events', 'AI auto-opt'], current: true, featured: true },
  { name: 'Pro', price: '$249', features: ['Unlimited', 'SSO', 'API'], current: false, featured: false },
]

export function ProductsPlansAnim() {
  return (
    <MockFrame
      label="plans & usage"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          Growth · active
        </span>
      }
      glow="violet"
    >
      <div className="grid grid-cols-3 gap-2">
        {PLANS.map((p, i) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-xl p-3 ${
              p.featured
                ? 'bg-[#1b2e06] text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)] ring-1 ring-[#243a12]'
                : 'bg-[#fafdf5] ring-1 ring-inset ring-[#eef3e3]'
            }`}
            style={{ animation: `mockFadeIn 0.5s ease-out ${i * 0.15}s both` }}
          >
            {p.current && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#a3e635] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#1a2e05]">
                You
              </span>
            )}
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${p.featured ? 'text-[#a3e635]/85' : 'text-text-tertiary'}`}>
              {p.name}
            </p>
            <p className={`mt-1.5 text-xl font-semibold tabular-nums tracking-tight ${p.featured ? 'text-[#d9f99d]' : 'text-text-primary'}`}>
              {p.price}
            </p>
            <ul className={`mt-3 flex-1 space-y-1.5 text-[10px] ${p.featured ? 'text-white/80' : 'text-text-secondary'}`}>
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-1">
                  <Check className={`mt-0.5 h-2.5 w-2.5 shrink-0 ${p.featured ? 'text-[#a3e635]' : 'text-[#65a30d]'}`} aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="mt-4 space-y-2"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.6s both' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">This month · usage</p>
        {[
          { k: 'Ad accounts', used: 8, max: 12, color: 'bg-[#65a30d]' },
          { k: 'AI actions', used: 1240, max: 5000, color: 'bg-[#84cc16]' },
        ].map((u) => (
          <div key={u.k}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-text-secondary">{u.k}</span>
              <span className="tabular-nums text-text-tertiary">
                {u.used.toLocaleString()} / {u.max.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef3e3]">
              <div className={`h-full rounded-full ${u.color}`} style={{ width: `${(u.used / u.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
