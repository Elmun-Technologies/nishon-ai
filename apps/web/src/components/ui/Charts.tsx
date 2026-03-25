'use client'

// ─── LineChart ────────────────────────────────────────────────────────────────
interface LineChartProps {
  data: Record<string, any>[]
  xKey: string
  yKeys: string[]
  colors?: string[]
  height?: number
}

export function LineChart({ data, xKey, yKeys, colors = ['#7C3AED', '#4285F4', '#FFCC00'], height = 200 }: LineChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-[#6B7280] text-sm" style={{ height }}>(No data)</div>
  }

  const W = 600
  const H = height
  const pad = { top: 16, right: 16, bottom: 32, left: 48 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  const allValues = yKeys.flatMap(k => data.map(d => Number(d[k]) || 0))
  const maxVal = Math.max(...allValues, 1)
  const minVal = Math.min(...allValues, 0)
  const range = maxVal - minVal || 1

  const toX = (i: number) => (i / (data.length - 1)) * chartW
  const toY = (v: number) => chartH - ((v - minVal) / range) * chartH

  const ticks = 4
  const yTickVals = Array.from({ length: ticks + 1 }, (_, i) => minVal + (range / ticks) * i)

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid lines */}
          {yTickVals.map((v, i) => (
            <g key={i}>
              <line x1={0} x2={chartW} y1={toY(v)} y2={toY(v)} stroke="#2A2A3A" strokeDasharray="4 4" />
              <text x={-6} y={toY(v) + 4} textAnchor="end" fill="#6B7280" fontSize={10}>
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
              </text>
            </g>
          ))}

          {/* X labels */}
          {data.map((d, i) => (
            i % Math.max(1, Math.floor(data.length / 5)) === 0 && (
              <text key={i} x={toX(i)} y={chartH + 18} textAnchor="middle" fill="#6B7280" fontSize={10}>
                {String(d[xKey]).slice(5)}
              </text>
            )
          ))}

          {/* Lines */}
          {yKeys.map((k, ki) => {
            const pts = data.map((d, i) => `${toX(i)},${toY(Number(d[k]) || 0)}`).join(' ')
            return (
              <polyline key={k} points={pts} fill="none" stroke={colors[ki] ?? '#7C3AED'} strokeWidth={2} strokeLinejoin="round" />
            )
          })}

          {/* Dots */}
          {yKeys.map((k, ki) =>
            data.map((d, i) => (
              <circle key={`${k}${i}`} cx={toX(i)} cy={toY(Number(d[k]) || 0)} r={3} fill={colors[ki] ?? '#7C3AED'} />
            ))
          )}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2 flex-wrap">
        {yKeys.map((k, ki) => (
          <div key={k} className="flex items-center gap-1 text-xs text-[#9CA3AF]">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: colors[ki] ?? '#7C3AED' }} />
            {k}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BarChart ────────────────────────────────────────────────────────────────
interface BarChartProps {
  data: Record<string, any>[]
  xKey: string
  yKey: string
  color?: string
  height?: number
}

export function BarChart({ data, xKey, yKey, color = '#7C3AED', height = 200 }: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-[#6B7280] text-sm" style={{ height }}>(No data)</div>
  }

  const W = 600
  const H = height
  const pad = { top: 16, right: 16, bottom: 32, left: 48 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  const values = data.map(d => Number(d[yKey]) || 0)
  const maxVal = Math.max(...values, 1)

  const barW = (chartW / data.length) * 0.7
  const gap = chartW / data.length

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <g key={i}>
              <line x1={0} x2={chartW} y1={chartH * (1 - t)} y2={chartH * (1 - t)} stroke="#2A2A3A" strokeDasharray="4 4" />
              <text x={-6} y={chartH * (1 - t) + 4} textAnchor="end" fill="#6B7280" fontSize={10}>
                {Math.round(maxVal * t)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const v = Number(d[yKey]) || 0
            const bh = (v / maxVal) * chartH
            const x = i * gap + (gap - barW) / 2
            return (
              <g key={i}>
                <rect x={x} y={chartH - bh} width={barW} height={bh} rx={3} fill={color} opacity={0.85} />
                <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fill="#6B7280" fontSize={9}>
                  {String(d[xKey]).slice(-5)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// ─── PieChart ────────────────────────────────────────────────────────────────
interface PieChartProps {
  data: { label: string; value: number; color?: string }[]
  size?: number
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center text-[#6B7280] text-sm" style={{ width: size, height: size }}>(No data)</div>
  }

  const DEFAULT_COLORS = ['#7C3AED', '#4285F4', '#FFCC00', '#2CA5E0', '#10B981', '#F59E0B']
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const innerR = r * 0.55

  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const theta = (d.value / total) * 2 * Math.PI
    const start = angle
    angle += theta
    return { ...d, start, end: angle, color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }
  })

  const arc = (startA: number, endA: number, outerR: number, innerRad: number) => {
    const x1 = cx + outerR * Math.cos(startA)
    const y1 = cy + outerR * Math.sin(startA)
    const x2 = cx + outerR * Math.cos(endA)
    const y2 = cy + outerR * Math.sin(endA)
    const x3 = cx + innerRad * Math.cos(endA)
    const y3 = cy + innerRad * Math.sin(endA)
    const x4 = cx + innerRad * Math.cos(startA)
    const y4 = cy + innerRad * Math.sin(startA)
    const large = endA - startA > Math.PI ? 1 : 0
    return `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${innerRad},${innerRad} 0 ${large} 0 ${x4},${y4} Z`
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size}>
        {slices.map((s, i) => (
          <path key={i} d={arc(s.start, s.end, r, innerR)} fill={s.color} stroke="#0B0B0F" strokeWidth={2} />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={14} fontWeight="bold">
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
        </text>
      </svg>
      <div className="space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[#9CA3AF]">{s.label}</span>
            <span className="text-white font-medium">{((s.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
