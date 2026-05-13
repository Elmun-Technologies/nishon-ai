'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CreditCard,
  Gauge,
  Layers3,
  LineChart,
  Lock,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'
import {
  AnimatedArrow,
  DecorativeBlob,
  HeroDashboardMock,
  IntegrationChip,
  LiveDot,
  ROIChart,
} from './_components/LandingVisuals'

const CORE_MODULES = [
  { key: 'campaignLaunch', href: '/launch', icon: Rocket },
  { key: 'aiDecisions', href: '/ai-decisions', icon: Brain },
  { key: 'performance', href: '/performance', icon: BarChart3 },
  { key: 'creativeScorer', href: '/creative-scorer', icon: Sparkles },
  { key: 'workspaceGov', href: '/settings/workspace/team', icon: Users },
  { key: 'billing', href: '/settings/workspace/payments', icon: CreditCard },
] as const

const FLOW_KEYS = ['connect', 'launch', 'optimize', 'scale'] as const
const PLAN_KEYS = ['free', 'starter', 'growth', 'pro', 'agency'] as const
const PAIN_KEYS = ['roas', 'manual', 'team'] as const
const USE_CASE_KEYS = ['brand', 'agency', 'specialist'] as const
const TESTIMONIAL_KEYS = [0, 1, 2] as const
const FAQ_INDICES = [0, 1, 2, 3, 4, 5] as const

const PAIN_ICONS = { roas: LineChart, manual: Gauge, team: Users } as const
const USE_CASE_ICONS = { brand: Target, agency: Layers3, specialist: Sparkles } as const

const INTEGRATIONS = [
  'Meta Ads',
  'Google Ads',
  'TikTok Ads',
  'AmoCRM',
  'Telegram',
  'Payme',
  'Google Sheets',
  'Click',
] as const

const MONETIZATION_KEYS = [
  { key: 'subscription', icon: Wallet },
  { key: 'billing', icon: CreditCard },
  { key: 'marketplace', icon: Layers3 },
] as const

export default function HomePage() {
  const { t } = useI18n()

  const heroBullets = [0, 1, 2].map((i) => t(`publicSite.home.hero.bullet${i}`, ''))
  const stats = [0, 1, 2, 3].map((i) => ({
    v: t(`publicSite.home.stats.${i}.value`, ''),
    l: t(`publicSite.home.stats.${i}.label`, ''),
  }))
  const roiStats = [0, 1, 2, 3].map((i) => ({
    v: t(`publicSite.home.roi.${i}.value`, ''),
    l: t(`publicSite.home.roi.${i}.label`, ''),
  }))

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-[#f7faf2]">
        <DecorativeBlob className="-left-32 top-10" color="#84cc16" size={420} />
        <DecorativeBlob className="-right-24 top-40" color="#34d399" size={360} />

        <PublicContainer className="relative grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="lp-fade-up">
            <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">
              {t('landing.hero.badge', '')}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              {t('landing.hero.title1', '')}
              <br />
              {t('landing.hero.title2', '')}
              <br />
              <span className="text-[#3f6212]">{t('landing.hero.title3', '')}</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-text-secondary">{t('landing.hero.subtitle', '')}</p>
            <div className="mt-6 space-y-2 text-sm text-text-secondary">
              {heroBullets.map((line) => (
                <p key={line} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#65a30d]" />
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05] hover:opacity-90"
              >
                {t('landing.hero.buttonStart', '')}
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium hover:bg-surface-2"
              >
                {t('publicSite.home.hero.secondaryCta', '')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-text-tertiary">{t('publicSite.home.hero.noCard', '')}</p>
          </div>

          <div className="lp-fade-up space-y-3" style={{ animationDelay: '150ms' }}>
            <HeroDashboardMock />
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((item, idx) => (
                <article
                  key={item.l}
                  className="lp-fade-up lp-card-hover rounded-2xl border border-border bg-white p-5"
                  style={{ animationDelay: `${300 + idx * 80}ms` }}
                >
                  <p className="text-2xl font-semibold">{item.v}</p>
                  <p className="mt-1 text-sm text-text-secondary">{item.l}</p>
                </article>
              ))}
            </div>
          </div>
        </PublicContainer>
      </section>

      {/* ─── TRUSTED BY / INTEGRATIONS STRIP ──────────────────────────────── */}
      <section className="border-b border-border bg-white">
        <PublicContainer className="py-10">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {t('publicSite.home.trustedBy.title', '')}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {INTEGRATIONS.map((name) => (
              <IntegrationChip key={name} name={name} />
            ))}
          </div>
        </PublicContainer>
      </section>

      {/* ─── PROBLEM / PAIN POINTS ────────────────────────────────────────── */}
      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.painPoints.eyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">
              {t('publicSite.home.painPoints.title', '')}
            </h2>
            <p className="mt-2 text-text-secondary">{t('publicSite.home.painPoints.subtitle', '')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PAIN_KEYS.map((key, idx) => {
              const Icon = PAIN_ICONS[key]
              return (
                <article
                  key={key}
                  className="lp-card-hover lp-fade-up rounded-2xl border border-border bg-white p-6"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="mb-3 inline-flex rounded-xl border border-[#fecaca] bg-[#fef2f2] p-2 text-[#b91c1c]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-heading font-semibold">
                    {t(`publicSite.home.painPoints.${key}.title`, '')}
                  </h3>
                  <p className="mt-2 text-body-sm text-text-secondary">
                    {t(`publicSite.home.painPoints.${key}.problem`, '')}
                  </p>
                  <div className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-sm text-[#166534]">
                    <p className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t(`publicSite.home.painPoints.${key}.solution`, '')}</span>
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      {/* ─── CORE CAPABILITIES ────────────────────────────────────────────── */}
      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.capabilitiesEyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{t('landing.capabilities.title', '')}</h2>
            <p className="mt-2 text-text-secondary">{t('landing.capabilities.subtitle', '')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CORE_MODULES.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group lp-card-hover rounded-2xl border border-border bg-white p-6 hover:border-[#84cc16]/60"
                >
                  <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-heading font-semibold">{t(`publicSite.home.modules.${item.key}.title`, '')}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{t(`publicSite.home.modules.${item.key}.desc`, '')}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                    {t('publicSite.home.openModule', '')}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.flow.eyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{t('publicSite.home.flow.title', '')}</h2>
            <p className="mt-2 text-text-secondary">{t('publicSite.home.flow.subtitle', '')}</p>
          </div>
          <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FLOW_KEYS.map((flowKey, idx) => (
              <article
                key={flowKey}
                className="lp-card-hover relative rounded-2xl border border-border bg-white p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#84cc16] text-sm font-bold text-[#1a2e05]">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-semibold">{t(`publicSite.home.flow.${flowKey}.title`, '')}</h3>
                <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.flow.${flowKey}.text`, '')}</p>
                {idx < FLOW_KEYS.length - 1 && (
                  <AnimatedArrow className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#84cc16] lg:block" />
                )}
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      {/* ─── USE CASES / FOR WHO ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.useCases.eyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{t('publicSite.home.useCases.title', '')}</h2>
            <p className="mt-2 text-text-secondary">{t('publicSite.home.useCases.subtitle', '')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {USE_CASE_KEYS.map((key) => {
              const Icon = USE_CASE_ICONS[key]
              const points = [0, 1, 2].map((i) => t(`publicSite.home.useCases.${key}.points.${i}`, ''))
              return (
                <article key={key} className="lp-card-hover rounded-2xl border border-border bg-white p-6">
                  <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-semibold">{t(`publicSite.home.useCases.${key}.title`, '')}</h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    {t(`publicSite.home.useCases.${key}.desc`, '')}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={t(`publicSite.home.useCases.${key}.href`, '/features')}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]"
                  >
                    {t('publicSite.home.useCases.cta', '')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      {/* ─── ROI / OUTCOMES ───────────────────────────────────────────────── */}
      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.roi.eyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{t('publicSite.home.roi.title', '')}</h2>
            <p className="mt-2 text-text-secondary">{t('publicSite.home.roi.subtitle', '')}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <ROIChart />
            <div className="grid gap-3 sm:grid-cols-2">
              {roiStats.map((item, idx) => (
                <article
                  key={item.l}
                  className="lp-card-hover rounded-2xl border border-border bg-[#1f2b0f] p-6 text-white"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <p className="text-4xl font-semibold text-[#d9f99d]">{item.v}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.l}</p>
                </article>
              ))}
            </div>
          </div>
        </PublicContainer>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.pricing.eyebrow', '')}</p>
            <h2 className="mt-1 text-4xl font-semibold">{t('publicSite.home.pricing.title', '')}</h2>
            <p className="mx-auto mt-3 max-w-3xl text-text-secondary">{t('publicSite.home.pricing.subtitle', '')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {PLAN_KEYS.map((planKey) => {
              const featured = planKey === 'growth'
              const points = [0, 1, 2, 3].map((i) => t(`publicSite.home.plans.${planKey}.points.${i}`, ''))
              return (
                <article
                  key={planKey}
                  className={`lp-card-hover relative rounded-2xl border p-5 ${
                    featured ? 'border-[#84cc16] bg-[#1f2b0f] text-white shadow-lg shadow-[#84cc16]/20' : 'border-border bg-white'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-5 rounded-full bg-[#84cc16] px-3 py-1 text-xs font-semibold text-[#1a2e05]">
                      {t('publicSite.home.pricing.popular', '')}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{t(`publicSite.home.plans.${planKey}.name`, '')}</h3>
                  <p className={`mt-2 text-xl font-semibold ${featured ? 'text-[#d9f99d]' : 'text-text-primary'}`}>
                    {t(`publicSite.home.plans.${planKey}.price`, '')}
                  </p>
                  <p className={`mt-1 text-xs ${featured ? 'text-slate-300' : 'text-text-secondary'}`}>
                    {t(`publicSite.home.plans.${planKey}.who`, '')}
                  </p>
                  <ul className={`mt-4 space-y-2 text-xs ${featured ? 'text-slate-200' : 'text-text-secondary'}`}>
                    {points.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${featured ? 'text-[#d9f99d]' : 'text-[#65a30d]'}`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/onboarding"
                    className={`mt-5 block rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                      featured
                        ? 'bg-[#84cc16] text-[#1a2e05]'
                        : 'border border-border bg-surface text-text-primary hover:bg-surface-2'
                    }`}
                  >
                    {t('publicSite.home.pricing.cta', '')}
                  </Link>
                </article>
              )
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {MONETIZATION_KEYS.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.key} className="rounded-2xl border border-border bg-white p-5">
                  <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold">{t(`publicSite.home.monetization.${item.key}.title`, '')}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.monetization.${item.key}.text`, '')}</p>
                </article>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      {/* ─── SECURITY & SNAPSHOT ──────────────────────────────────────────── */}
      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-2xl font-semibold md:text-3xl">{t('publicSite.home.security.title', '')}</h3>
              <p className="mt-3 text-text-secondary">{t('publicSite.home.security.intro', '')}</p>
              <ul className="mt-5 space-y-2 text-sm text-text-secondary">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#65a30d]" />
                    {t(`publicSite.home.security.bullet${i}`, '')}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-2xl font-semibold md:text-3xl">{t('publicSite.home.revenue.title', '')}</h3>
              <p className="mt-3 text-text-secondary">{t('publicSite.home.revenue.intro', '')}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface-2 p-3">
                    <p className="text-xs text-text-tertiary">{t(`publicSite.home.revenue.cell${i}.k`, '')}</p>
                    <p className="mt-1 text-sm font-semibold">{t(`publicSite.home.revenue.cell${i}.v`, '')}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </PublicContainer>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border bg-[#f8fbf2] py-16">
        <DecorativeBlob className="left-1/4 top-10" color="#84cc16" size={300} />
        <PublicContainer className="relative">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.testimonials.eyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">
              {t('publicSite.home.testimonials.title', '')}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIAL_KEYS.map((i) => (
              <article key={i} className="lp-card-hover rounded-2xl border border-border bg-white p-6">
                <Quote className="h-5 w-5 text-[#84cc16]" />
                <p className="mt-3 text-sm text-text-secondary">
                  {t(`publicSite.home.testimonials.${i}.quote`, '')}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t(`publicSite.home.testimonials.${i}.name`, '')}</p>
                    <p className="text-xs text-text-tertiary">{t(`publicSite.home.testimonials.${i}.role`, '')}</p>
                  </div>
                  <div className="flex gap-0.5 text-[#84cc16]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">{t('publicSite.home.faq.title', '')}</h2>
            <p className="mt-2 text-text-secondary">{t('publicSite.home.faq.subtitle', '')}</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            {FAQ_INDICES.map((i) => (
              <article key={i} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-lg font-semibold">{t(`publicSite.home.faq.q${i}`, '')}</h3>
                <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.faq.a${i}`, '')}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.finalCta.eyebrow', '')}</p>
              <h2 className="mt-1 text-4xl font-semibold md:text-5xl">{t('publicSite.home.finalCta.title', '')}</h2>
              <p className="mt-3 text-lg text-text-secondary">{t('publicSite.home.finalCta.subtitle', '')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/onboarding" className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05]">
                  {t('publicSite.cta.startFree', '')}
                </Link>
                <Link href="/solutions" className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium">
                  {t('publicSite.home.finalCta.solutions', '')}
                </Link>
              </div>
              <p className="mt-3 text-xs text-text-tertiary">{t('publicSite.home.finalCta.note', '')}</p>
            </div>
            <div className="rounded-2xl border border-border bg-[#f8fbf2] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">{t('publicSite.home.snapshot.title', '')}</p>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#65a30d]">
                  <LiveDot />
                  <Lock className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5"
                  >
                    <span className="text-sm">{t(`publicSite.home.snapshot.row${i}.label`, '')}</span>
                    <span className="text-xs font-medium text-[#65a30d]">{t(`publicSite.home.snapshot.row${i}.status`, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
