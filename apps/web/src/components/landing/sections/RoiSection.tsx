'use client'

import { useMemo } from 'react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

export function RoiSection() {
  const { t } = useI18n()
  const roiStats = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        v: t(`publicSite.home.roi.${i}.value`, ''),
        l: t(`publicSite.home.roi.${i}.label`, ''),
      })),
    [t],
  )

  return (
    <section aria-labelledby="roi-heading" className="bg-surface py-16">
      <PublicContainer>
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.roi.eyebrow', '')}</p>
          <h2 id="roi-heading" className="mt-1 text-3xl font-semibold md:text-4xl">
            {t('publicSite.home.roi.title', '')}
          </h2>
          <p className="mt-2 text-text-secondary">{t('publicSite.home.roi.subtitle', '')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roiStats.map((item) => (
            <article key={item.l} className="rounded-2xl border border-border bg-[#1f2b0f] p-6 text-white">
              <p className="text-4xl font-semibold text-[#d9f99d]">{item.v}</p>
              <p className="mt-2 text-sm text-slate-300">{item.l}</p>
            </article>
          ))}
        </div>
      </PublicContainer>
    </section>
  )
}
