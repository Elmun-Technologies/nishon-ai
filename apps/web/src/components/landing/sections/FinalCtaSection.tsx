'use client'

import { ArrowRight, Lock } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { LandingButton } from '../ui/LandingButton'

export function FinalCtaSection() {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative isolate overflow-hidden bg-white py-20 md:py-28"
    >
      <PublicContainer>
        <div className="relative overflow-hidden rounded-3xl bg-[#1b2e06] p-8 text-white ring-1 ring-[#243a12] md:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_15%,rgba(163,230,53,0.22)_0%,transparent_60%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#a3e635]/10 blur-3xl"
          />

          <div className="relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a3e635]">
                {t('publicSite.home.finalCta.eyebrow', '')}
              </p>
              <h2
                id="final-cta-heading"
                className="mt-3 text-balance text-3xl font-medium tracking-tight md:text-5xl md:leading-[1.05]"
              >
                {t('publicSite.home.finalCta.title', '')}
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-white/75 md:text-lg">
                {t('publicSite.home.finalCta.subtitle', '')}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="/onboarding"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#a3e635] px-6 text-base font-medium text-[#1a2e05] transition hover:bg-[#bef264] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {t('publicSite.cta.startFree', '')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <LandingButton
                  href="/solutions"
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  {t('publicSite.home.finalCta.solutions', '')}
                </LandingButton>
              </div>
              <p className="mt-4 text-xs text-white/60">{t('publicSite.home.finalCta.note', '')}</p>
            </div>

            <div className="rounded-2xl bg-[#243a12] p-6 ring-1 ring-inset ring-[#365314]/80">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-white/90">{t('publicSite.home.snapshot.title', '')}</p>
                <Lock className="h-4 w-4 text-[#a3e635]" aria-hidden="true" />
              </div>
              <ul className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-[#1b2e06] px-3.5 py-2.5 ring-1 ring-inset ring-[#365314]/60"
                  >
                    <span className="text-sm text-white/85">
                      {t(`publicSite.home.snapshot.row${i}.label`, '')}
                    </span>
                    <span className="text-xs font-medium text-[#a3e635]">
                      {t(`publicSite.home.snapshot.row${i}.status`, '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PublicContainer>
    </section>
  )
}
