'use client'

import { useMemo } from 'react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { AnimatedCounter } from '@/components/landing/ui/AnimatedCounter'

export interface MetricItem {
  value: string
  label: string
  context: string
}

function parseStatValue(raw: string): {
  value: number
  prefix: string
  suffix: string
  decimals: number
} {
  if (!raw) return { value: 0, prefix: '', suffix: '', decimals: 0 }
  const match = raw.match(/^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return { value: 0, prefix: '', suffix: raw, decimals: 0 }
  const [, prefix, num, suffix] = match
  const normalized = num.replace(',', '.')
  const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0
  return { value: Number(normalized), prefix: prefix ?? '', suffix: suffix ?? '', decimals }
}

export function MetricsShowcase({
  title,
  description,
  metrics,
}: {
  title: string
  description?: string
  metrics: MetricItem[]
}) {
  const parsed = useMemo(() => metrics.map((m) => ({ ...m, parsed: parseStatValue(m.value) })), [metrics])

  return (
    <section aria-labelledby="ms-heading" className="bg-white py-20 md:py-24">
      <PublicContainer>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65a30d]">
            Результаты
          </p>
          <h2
            id="ms-heading"
            className="mt-3 text-balance text-3xl font-medium tracking-tight text-text-primary md:text-[40px] md:leading-[1.05]"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-pretty text-lg text-text-secondary">{description}</p>
          ) : null}
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl bg-[#1b2e06] p-6 ring-1 ring-inset ring-[#243a12] md:p-10">
          <div
            className={`grid gap-px overflow-hidden rounded-2xl bg-[#243a12]/60 ${
              metrics.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
            }`}
          >
            {parsed.map((m) => (
              <div key={m.label} className="bg-[#1b2e06] p-6 md:p-8">
                <p className="text-3xl font-medium tabular-nums tracking-tight text-[#d9f99d] md:text-5xl">
                  <AnimatedCounter
                    value={m.parsed.value}
                    prefix={m.parsed.prefix}
                    suffix={m.parsed.suffix}
                    decimals={m.parsed.decimals}
                    duration={1600}
                    ariaLabel={m.value}
                  />
                </p>
                <p className="mt-3 text-sm font-medium text-white">{m.label}</p>
                <p className="mt-1 text-xs text-white/55">{m.context}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicContainer>
    </section>
  )
}
