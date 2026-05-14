'use client'

import { useMemo } from 'react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { AnimatedCounter } from '../ui/AnimatedCounter'

function parseStatValue(raw: string): { value: number; prefix: string; suffix: string; decimals: number } {
  if (!raw) return { value: 0, prefix: '', suffix: '', decimals: 0 }
  const match = raw.match(/^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/)
  if (!match) return { value: 0, prefix: '', suffix: raw, decimals: 0 }
  const [, prefix, num, suffix] = match
  const normalized = num.replace(',', '.')
  const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0
  return { value: Number(normalized), prefix: prefix ?? '', suffix: suffix ?? '', decimals }
}

export function RoiSection() {
  const { t } = useI18n()
  const stats = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        raw: t(`publicSite.home.roi.${i}.value`, ''),
        label: t(`publicSite.home.roi.${i}.label`, ''),
      })),
    [t],
  )

  return (
    <section aria-labelledby="roi-heading" className="bg-white py-20 md:py-28">
      <PublicContainer>
        <SectionHeader
          titleId="roi-heading"
          eyebrow={t('publicSite.home.roi.eyebrow', '')}
          title={t('publicSite.home.roi.title', '')}
          description={t('publicSite.home.roi.subtitle', '')}
        />

        <div className="mt-12 overflow-hidden rounded-3xl bg-[#1b2e06] p-6 ring-1 ring-inset ring-[#243a12] md:p-10">
          <div className="grid gap-px overflow-hidden rounded-2xl bg-[#243a12]/60 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const parsed = parseStatValue(item.raw)
              return (
                <div key={item.label} className="bg-[#1b2e06] p-6 md:p-8">
                  <p className="text-3xl font-medium tabular-nums tracking-tight text-[#d9f99d] md:text-5xl">
                    <AnimatedCounter
                      value={parsed.value}
                      prefix={parsed.prefix}
                      suffix={parsed.suffix}
                      decimals={parsed.decimals}
                      duration={1600}
                      ariaLabel={item.raw}
                    />
                  </p>
                  <p className="mt-3 text-sm text-white/70">{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </PublicContainer>
    </section>
  )
}
