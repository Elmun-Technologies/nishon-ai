'use client'

import { useMemo } from 'react'

/**
 * Tiny inline SVG sparkline — no charting lib needed, ~30 LOC, perfectly
 * adequate for table cells. Accepts an oldest→newest series of numbers.
 */
export function Sparkline({
  values,
  width = 96,
  height = 24,
  stroke = 'currentColor',
}: {
  values: number[]
  width?: number
  height?: number
  stroke?: string
}) {
  const path = useMemo(() => {
    if (!values || values.length < 2) return null
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const step = width / (values.length - 1)
    return values
      .map((v, i) => {
        const x = i * step
        const y = height - ((v - min) / range) * height
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }, [values, width, height])

  if (!path) {
    return (
      <span className="inline-block text-[10px] text-text-tertiary">—</span>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Spend trend"
      className="overflow-visible"
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
