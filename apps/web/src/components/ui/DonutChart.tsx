'use client'

interface Segment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: Segment[]
  total: number
  centerLabel?: string
  size?: number
  strokeWidth?: number
}

export function DonutChart({
  segments,
  total,
  centerLabel,
  size = 120,
  strokeWidth = 14,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  // Build arc segments
  let offset = 0
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0
    const dash = fraction * circumference
    const gap = circumference - dash
    const arc = { ...seg, dash, gap, offset }
    offset += dash
    return arc
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#1E1E2E"
        strokeWidth={strokeWidth}
      />
      {/* Segments */}
      {arcs.map((arc, i) => (
        arc.value > 0 && (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        )
      ))}
      {/* Center text — rotate back upright */}
      {centerLabel !== undefined && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="rotate-90"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
          fill="white"
          fontSize={size * 0.18}
          fontWeight="700"
        >
          {centerLabel}
        </text>
      )}
    </svg>
  )
}
