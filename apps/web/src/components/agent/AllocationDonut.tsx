'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'

/**
 * Interactive donut chart of a budget split. Generic over any set of colored
 * segments (funnel stages, channels, …). Split into its own module so recharts
 * (~90 kB gzip) code-splits out and only loads when the allocation preview
 * actually renders (via next/dynamic).
 */

export interface DonutSegment {
  key: string
  label: string
  amount: number
  /** Percent of the total (0-100). */
  pct: number
  colorHex: string
}

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 5}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  )
}

export default function AllocationDonut({
  segments,
  totalLabel,
  total,
}: {
  segments: DonutSegment[]
  totalLabel: string
  total: number
}) {
  const [active, setActive] = useState<number | null>(null)
  const shown = segments.filter((d) => d.amount > 0)
  const focus = active != null ? shown[active] : null

  return (
    <div className="relative h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={shown}
            dataKey="amount"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
            activeIndex={active ?? undefined}
            activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActive(i)}
            onMouseLeave={() => setActive(null)}
            isAnimationActive
          >
            {shown.map((d) => (
              <Cell key={d.key} fill={d.colorHex} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label — reacts to hover focus */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {focus ? (
          <>
            <span className="text-[11px] font-medium text-text-tertiary">{focus.label}</span>
            <span className="text-lg font-bold text-text-primary">{usd(focus.amount)}</span>
            <span className="text-[11px] text-text-tertiary">{focus.pct}%</span>
          </>
        ) : (
          <>
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {totalLabel}
            </span>
            <span className="text-xl font-bold text-text-primary">{usd(total)}</span>
          </>
        )}
      </div>
    </div>
  )
}
