'use client'

import { useMemo } from 'react'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import { LandingButton } from '../ui/LandingButton'
import { AnimatedCounter } from '../ui/AnimatedCounter'
import { HeroLiveDemo } from '../ui/HeroLiveDemo'

const STATS: Array<{ value: number; suffix: string; decimals?: number; prefix?: string }> = [
  { value: 34, suffix: '%', prefix: '+' },
  { value: 5, suffix: '×' },
  { value: 12, suffix: '+' },
  { value: 24, suffix: '/7' },
]

export function HeroSection() {
  const { t } = useI18n()

  const heroBullets = useMemo(
    () => [0, 1, 2].map((i) => t(`publicSite.home.hero.bullet${i}`, '')),
    [t],
  )
  const stats = useMemo(
    () =>
      STATS.map((s, i) => ({
        ...s,
        label: t(`publicSite.home.stats.${i}.label`, ''),
      })),
    [t],
  )

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden border-b border-[#e6efd9] bg-[#fafdf5]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,#ecfccb_0%,transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#84cc16]/50 to-transparent"
      />

      <PublicContainer className="grid gap-12 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#3f6212] ring-1 ring-inset ring-[#cfe8c0] shadow-[0_1px_2px_rgba(27,46,6,0.06)]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {t('landing.hero.badge', '')}
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-balance text-4xl font-medium tracking-tight text-text-primary md:text-[64px] md:leading-[1.02]"
          >
            {t('landing.hero.title1', '')}{' '}
            <span className="text-text-primary/95">{t('landing.hero.title2', '')}</span>{' '}
            <span className="bg-gradient-to-r from-[#3f6212] to-[#65a30d] bg-clip-text text-transparent">
              {t('landing.hero.title3', '')}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-text-secondary">
            {t('landing.hero.subtitle', '')}
          </p>

          <ul className="mt-7 space-y-2.5 text-sm text-text-secondary">
            {heroBullets.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LandingButton href="/onboarding" size="lg">
              {t('landing.hero.buttonStart', '')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LandingButton>
            <LandingButton href="/features" variant="secondary" size="lg">
              {t('publicSite.home.hero.secondaryCta', '')}
            </LandingButton>
          </div>
          <p className="mt-4 text-xs text-text-tertiary">{t('publicSite.home.hero.noCard', '')}</p>
        </div>

        <div className="space-y-4">
          <HeroLiveDemo />
          <dl className="grid grid-cols-2 gap-3">
            {stats.map((item, i) => (
              <div
                key={item.label || i}
                className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04)]"
              >
                <dt className="sr-only">{item.label}</dt>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-text-primary md:text-3xl">
                  <AnimatedCounter
                    value={item.value}
                    prefix={item.prefix ?? ''}
                    suffix={item.suffix}
                    decimals={item.decimals ?? 0}
                    duration={1600}
                  />
                </dd>
                <p className="mt-1 text-xs text-text-secondary md:text-sm">{item.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </PublicContainer>
    </section>
  )
}
