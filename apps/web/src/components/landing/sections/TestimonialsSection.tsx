'use client'

import { Star } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { SectionHeader } from '../ui/SectionHeader'
import { LandingCard } from '../ui/LandingCard'
import { TESTIMONIAL_KEYS } from '../constants'

export function TestimonialsSection() {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-28"
    >
      <PublicContainer>
        <SectionHeader
          titleId="testimonials-heading"
          eyebrow={t('publicSite.home.testimonials.eyebrow', '')}
          title={t('publicSite.home.testimonials.title', '')}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIAL_KEYS.map((i) => {
            const name = t(`publicSite.home.testimonials.${i}.name`, '')
            const initial = name.trim().charAt(0).toUpperCase() || '·'
            return (
              <LandingCard key={i} tone="elevated" as="figure" className="flex flex-col">
                <div className="flex gap-0.5 text-[#65a30d]" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-text-secondary">
                  “{t(`publicSite.home.testimonials.${i}.quote`, '')}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b2e06] text-sm font-semibold text-[#d9f99d]"
                  >
                    {initial}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{name}</p>
                    <p className="text-xs text-text-tertiary">
                      {t(`publicSite.home.testimonials.${i}.role`, '')}
                    </p>
                  </div>
                </figcaption>
              </LandingCard>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
