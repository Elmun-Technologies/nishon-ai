'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, CheckCircle2, CreditCard, Layers3, Lock, Rocket, ShieldCheck, Sparkles, Users, Wallet } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

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

const MONETIZATION_KEYS = [
  { key: 'subscription', icon: Wallet },
  { key: 'billing', icon: CreditCard },
  { key: 'marketplace', icon: Layers3 },
] as const

const FAQ_INDICES = [0, 1, 2, 3] as const

export default function HomePage() {
  const { t } = useI18n()

  const heroBullets = [0, 1, 2].map((i) => t(`publicSite.home.hero.bullet${i}`, ''))
  const stats = [0, 1, 2, 3].map((i) => ({
    v: t(`publicSite.home.stats.${i}.value`, ''),
    l: t(`publicSite.home.stats.${i}.label`, ''),
  }))

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">
              {t('landing.hero.badge', '')}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              {t('landing.hero.title1', '')}
              <br />
              {t('landing.hero.title2', '')}
              <br />
              {t('landing.hero.title3', '')}
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
                href="/register"
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map((item) => (
              <article key={item.l} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-2xl font-semibold">{item.v}</p>
                <p className="mt-1 text-sm text-text-secondary">{item.l}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-9">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.capabilitiesEyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{t('landing.capabilities.title', '')}</h2>
            <p className="mt-2 max-w-3xl text-text-secondary">{t('landing.capabilities.subtitle', '')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CORE_MODULES.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group rounded-2xl border border-border bg-white p-6 transition hover:border-[#84cc16]/60"
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

      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="mb-8">
            <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.flow.eyebrow', '')}</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{t('publicSite.home.flow.title', '')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FLOW_KEYS.map((flowKey) => (
              <article key={flowKey} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-xs font-semibold tracking-wide text-[#65a30d]">
                  {t(`publicSite.home.flow.${flowKey}.step`, '')}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{t(`publicSite.home.flow.${flowKey}.title`, '')}</h3>
                <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.flow.${flowKey}.text`, '')}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
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
                  className={`rounded-2xl border p-5 ${
                    featured ? 'border-[#84cc16] bg-[#1f2b0f] text-white' : 'border-border bg-white'
                  }`}
                >
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
                        <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${featured ? 'text-[#d9f99d]' : 'text-[#65a30d]'}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {MONETIZATION_KEYS.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.key} className="rounded-2xl border border-border bg-[#f8fbf2] p-5">
                  <div className="mb-3 inline-flex rounded-xl border border-border bg-white p-2 text-[#65a30d]">
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

      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-3xl font-semibold">{t('publicSite.home.security.title', '')}</h3>
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
              <h3 className="text-3xl font-semibold">{t('publicSite.home.revenue.title', '')}</h3>
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

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-semibold">{t('publicSite.home.faq.title', '')}</h2>
            <p className="mt-2 text-text-secondary">{t('publicSite.home.faq.subtitle', '')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FAQ_INDICES.map((i) => (
              <article key={i} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-lg font-semibold">{t(`publicSite.home.faq.q${i}`, '')}</h3>
                <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.home.faq.a${i}`, '')}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm font-medium text-[#65a30d]">{t('publicSite.home.finalCta.eyebrow', '')}</p>
              <h2 className="mt-1 text-5xl font-semibold">{t('publicSite.home.finalCta.title', '')}</h2>
              <p className="mt-3 text-lg text-text-secondary">{t('publicSite.home.finalCta.subtitle', '')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05]">
                  {t('publicSite.cta.startFree', '')}
                </Link>
                <Link href="/solutions" className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium">
                  {t('publicSite.home.finalCta.solutions', '')}
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-[#f8fbf2] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">{t('publicSite.home.snapshot.title', '')}</p>
                <Lock className="h-4 w-4 text-[#65a30d]" />
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
