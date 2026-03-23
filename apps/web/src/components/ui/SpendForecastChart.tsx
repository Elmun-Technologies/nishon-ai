'use client'

/**
 * Smartly.io-style monthly spend chart.
 * Shows actual spend (solid line) + predicted spend (dashed line).
 * Pure SVG — no external dependency.
 */

interface DayPoint {
  date: string
  spend: number
  isPredicted: boolean
}

interface Props {
  daily: DayPoint[]
  spendToDate: number
  predictedTotal: number
  currency?: string
  height?: number
}

function formatK(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function SpendForecastChart({
  daily,
  spendToDate,
  predictedTotal,
  height = 160,
}: Props) {
  if (!daily || daily.length === 0) return null

  const W = 560
  const H = height
  const PAD_LEFT = 44
  const PAD_RIGHT = 12
  const PAD_TOP = 12
  const PAD_BOT = 24
  const chartW = W - PAD_LEFT - PAD_RIGHT
  const chartH = H - PAD_TOP - PAD_BOT

  const maxSpend = Math.max(...daily.map((d) => d.spend), 1)
  const n = daily.length

  // Y-axis nice max
  const yMax = Math.ceil(maxSpend / 100) * 100 || 100

  function x(i: number): number {
    return PAD_LEFT + (i / (n - 1)) * chartW
  }
  function y(v: number): number {
    return PAD_TOP + chartH - (v / yMax) * chartH
  }

  // Split into actual vs predicted segments
  const actualPoints = daily.filter((d) => !d.isPredicted)
  const predictedPoints = daily.filter((d) => d.isPredicted)

  // Find split index
  const splitIdx = daily.findIndex((d) => d.isPredicted)
  const lastActualIdx = splitIdx > 0 ? splitIdx - 1 : daily.length - 1

  // Build path strings
  function toPath(points: DayPoint[], startIdx: number): string {
    return points.map((d, i) => {
      const xi = x(startIdx + i)
      const yi = y(d.spend)
      return `${i === 0 ? 'M' : 'L'}${xi.toFixed(1)},${yi.toFixed(1)}`
    }).join(' ')
  }

  function toFillPath(points: DayPoint[], startIdx: number): string {
    if (points.length === 0) return ''
    const line = toPath(points, startIdx)
    const lastX = x(startIdx + points.length - 1)
    const firstX = x(startIdx)
    return `${line} L${lastX.toFixed(1)},${(PAD_TOP + chartH).toFixed(1)} L${firstX.toFixed(1)},${(PAD_TOP + chartH).toFixed(1)} Z`
  }

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    v: yMax * t,
    y: y(yMax * t),
  }))

  // Today marker x
  const todayX = splitIdx > 0 ? x(splitIdx - 1) : x(n - 1)

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="predictFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t) => (
          <g key={t.v}>
            <line
              x1={PAD_LEFT} y1={t.y} x2={W - PAD_RIGHT} y2={t.y}
              stroke="#2A2A3A" strokeWidth="1"
            />
            <text
              x={PAD_LEFT - 6} y={t.y + 4}
              textAnchor="end" fontSize="9" fill="#4B5563"
            >
              {formatK(t.v)}
            </text>
          </g>
        ))}

        {/* Today vertical marker */}
        {splitIdx > 0 && (
          <g>
            <line
              x1={todayX} y1={PAD_TOP}
              x2={todayX} y2={PAD_TOP + chartH}
              stroke="#7C3AED" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"
            />
            <text x={todayX + 4} y={PAD_TOP + 10} fontSize="9" fill="#7C3AED">
              Bugun
            </text>
          </g>
        )}

        {/* Actual fill */}
        {actualPoints.length > 0 && (
          <path d={toFillPath(actualPoints, 0)} fill="url(#actualFill)" />
        )}

        {/* Predicted fill */}
        {predictedPoints.length > 0 && splitIdx > 0 && (
          <path
            d={toFillPath(
              [daily[lastActualIdx], ...predictedPoints],
              lastActualIdx,
            )}
            fill="url(#predictFill)"
          />
        )}

        {/* Actual line */}
        {actualPoints.length > 0 && (
          <path
            d={toPath(actualPoints, 0)}
            stroke="#7C3AED" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          />
        )}

        {/* Predicted line (dashed) */}
        {predictedPoints.length > 0 && splitIdx > 0 && (
          <path
            d={toPath(
              [daily[lastActualIdx], ...predictedPoints],
              lastActualIdx,
            )}
            stroke="#A78BFA" strokeWidth="1.5"
            strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round"
            opacity="0.7"
          />
        )}

        {/* X-axis date labels (first + middle + last) */}
        {[0, Math.floor(n / 2), n - 1].map((i) => {
          if (!daily[i]) return null
          const d = new Date(daily[i].date)
          return (
            <text
              key={i}
              x={x(i)}
              y={PAD_TOP + chartH + 16}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              fontSize="9" fill="#4B5563"
            >
              {d.getDate()}/{d.getMonth() + 1}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-[#7C3AED] rounded-full inline-block" />
          <span className="text-xs text-[#6B7280]">
            Haqiqiy xarajat — {formatK(spendToDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-px border-t-2 border-dashed border-[#A78BFA] inline-block" />
          <span className="text-xs text-[#6B7280]">
            Bashorat — {formatK(predictedTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
