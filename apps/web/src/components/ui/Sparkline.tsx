'use client'

/**
 * Pure SVG sparkline — no external dependency.
 * Renders a smooth line chart from an array of numbers.
 */
export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = '#7C3AED',
  positive,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  positive?: boolean | null
}) {
  if (!data || data.length < 2) return null

  const lineColor =
    positive === true  ? '#34D399' :
    positive === false ? '#F87171' :
    color

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pointsStr = pts.join(' ')

  // Build fill polygon: line points + bottom-right + bottom-left
  const fillPoints = [
    ...pts,
    `${width},${height}`,
    `0,${height}`,
  ].join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id={`sg-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#sg-${lineColor.replace('#', '')})`}
      />
      <polyline
        points={pointsStr}
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
