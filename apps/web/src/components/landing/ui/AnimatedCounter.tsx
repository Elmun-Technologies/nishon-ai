'use client'

import { useEffect, useRef, useState } from 'react'

export interface AnimatedCounterProps {
  /** Final numeric value to count up to. */
  value: number
  /** Text rendered before the number (e.g. "+", "$"). */
  prefix?: string
  /** Text rendered after the number (e.g. "%", "×", "K"). */
  suffix?: string
  /** Animation duration in milliseconds. */
  duration?: number
  /** Decimal places to render (default 0). */
  decimals?: number
  className?: string
  /** Aria-label override for screen readers. Defaults to the final string. */
  ariaLabel?: string
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1400,
  decimals = 0,
  className,
  ariaLabel,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const nodeRef = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplay(value)
      return
    }

    const run = () => {
      if (startedRef.current) return
      startedRef.current = true

      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(value * eased)
        if (t < 1) requestAnimationFrame(tick)
        else setDisplay(value)
      }
      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run()
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [value, duration])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={nodeRef} className={className} aria-label={ariaLabel ?? `${prefix}${value}${suffix}`}>
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
    </span>
  )
}
