'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PerformancePoint } from '@/lib/marketplace/types'

type Props = {
  data: PerformancePoint[]
  height?: number
  /** Mini sparkline — o‘qlar yashirin */
  compact?: boolean
}

export function PerformanceChart({ data, height = 200, compact = false }: Props) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: compact ? 4 : 12, left: compact ? -16 : 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" opacity={0.6} />
          {!compact && <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />}
          {compact && <XAxis dataKey="date" hide />}
          <YAxis
            yAxisId="roas"
            orientation="left"
            width={compact ? 28 : 36}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="spend"
            orientation="right"
            width={compact ? 28 : 40}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--border, #e2e8f0)',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'roas') return [`${value.toFixed(2)}×`, 'ROAS']
              if (name === 'spend') return [`$${value.toFixed(0)}`, 'Spend']
              return [value, name]
            }}
            labelFormatter={(label) => `Sana: ${label}`}
          />
          <Line
            yAxisId="roas"
            type="monotone"
            dataKey="roas"
            name="roas"
            stroke="#10b981"
            strokeWidth={compact ? 1.5 : 2}
            dot={false}
            isAnimationActive={!compact}
          />
          <Line
            yAxisId="spend"
            type="monotone"
            dataKey="spend"
            name="spend"
            stroke="#3b82f6"
            strokeWidth={compact ? 1 : 1.5}
            dot={false}
            isAnimationActive={!compact}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
