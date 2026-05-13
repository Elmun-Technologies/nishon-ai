'use client'

import { Quote, Star } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { TESTIMONIAL_KEYS } from '../constants'

export function TestimonialsSection() {
  const { t } = useI18n()

  return (
    <section aria-labelledby="testimonials-heading" className="border-y border-border bg-[#f8fbf2] py-16">
      <PublicContainer>
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.testimonials.eyebrow', '')}</p>
          <h2 id="testimonials-heading" className="mt-1 text-3xl font-semibold md:text-4xl">
            {t('publicSite.home.testimonials.title', '')}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIAL_KEYS.map((i) => {
            const name = t(`publicSite.home.testimonials.${i}.name`, '')
            return (
              <figure key={i} className="rounded-2xl border border-border bg-white p-6">
                <Quote className="h-5 w-5 text-[#84cc16]" aria-hidden="true" />
                <blockquote className="mt-3 text-sm text-text-secondary">
                  {t(`publicSite.home.testimonials.${i}.quote`, '')}
                </blockquote>
                <figcaption className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-text-tertiary">{t(`publicSite.home.testimonials.${i}.role`, '')}</p>
                  </div>
                  <div className="flex gap-0.5 text-[#84cc16]" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </PublicContainer>
    </section>
  )
}
