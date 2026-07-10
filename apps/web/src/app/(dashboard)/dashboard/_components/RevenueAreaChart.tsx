'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type RevenuePoint = { label: string; spend: number; revenue: number }

/**
 * Spend-vs-revenue area chart for the dashboard home. Split into its own
 * module so recharts (~90 kB gzip) code-splits out of the main dashboard
 * bundle and only loads when the chart actually renders (via next/dynamic).
 */
export default function RevenueAreaChart({
  data,
  revenueLabel,
  spendLabel,
  tooltipStyle,
  formatValue,
}: {
  data: RevenuePoint[]
  revenueLabel: string
  spendLabel: string
  tooltipStyle: React.CSSProperties
  formatValue: (v: number) => string
}) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5c8239" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5c8239" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93c75b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#93c75b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,90,0.14)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8a9a7a' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#8a9a7a' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [formatValue(v), name]} />
          <Area
            type="monotone"
            dataKey="spend"
            name={spendLabel}
            stroke="#5c8239"
            strokeWidth={2}
            fill="url(#gradSpend)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name={revenueLabel}
            stroke="#93c75b"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
