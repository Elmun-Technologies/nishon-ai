'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const FUNNEL = [
  { label: 'Visited', count: 124_500, width: 100 },
  { label: 'Engaged', count: 38_200, width: 64 },
  { label: 'Added to cart', count: 11_800, width: 38 },
  { label: 'Purchased', count: 4_240, width: 18 },
]

function format(n: number) {
  return n.toLocaleString('en-US')
}

export function AudienceBuilderAnim() {
  return (
    <MockFrame
      label="audience builder"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          LAL 1%
        </span>
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Funnel snapshot · last 30 days
      </p>

      <div className="mt-4 space-y-2.5">
        {FUNNEL.map((row, i) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-text-primary">{row.label}</span>
              <span className="tabular-nums text-text-secondary">{format(row.count)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef3e3]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3f6212] via-[#65a30d] to-[#a3e635]"
                style={{
                  width: `${row.width}%`,
                  animation: `mockBarGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.15}s both`,
                  transformOrigin: 'left',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-2"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.8s both' }}
      >
        {[
          { k: 'Source', v: 'AmoCRM' },
          { k: 'Sync', v: '10 min' },
          { k: 'Overlap', v: '12%' },
        ].map((m) => (
          <div key={m.k} className="rounded-lg bg-[#fafdf5] px-2.5 py-2 ring-1 ring-inset ring-[#eef3e3]">
            <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">{m.k}</p>
            <p className="mt-0.5 text-xs font-semibold text-text-primary">{m.v}</p>
          </div>
        ))}
      </div>

      <style>{`
        ${SHARED_ANIM_STYLES}
        @keyframes mockBarGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="mockBarGrow"] { animation: none !important; transform: none !important; }
        }
      `}</style>
    </MockFrame>
  )
}
