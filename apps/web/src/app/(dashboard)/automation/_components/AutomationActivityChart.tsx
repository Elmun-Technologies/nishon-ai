'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-900 border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-text-secondary">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
          <span>{p.name}:</span>
          <span className="font-medium text-text-primary ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export interface AutomationActivityChartProps {
  data: Array<Record<string, string | number>>
}

/**
 * Stacked daily-activity bar chart for the Automation page. Extracted into its
 * own module so recharts (~90 kB gzip) code-splits out of the automation route
 * bundle and only loads when the chart actually renders.
 */
export default function AutomationActivityChart({ data }: AutomationActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #94a3b8)' }}
          tickLine={false}
          axisLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #94a3b8)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="Старт"            stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Пауза"            stackId="a" fill="#f59e0b" />
        <Bar dataKey="Рост бюджета"     stackId="a" fill="#3b82f6" />
        <Bar dataKey="Снижение бюджета" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
