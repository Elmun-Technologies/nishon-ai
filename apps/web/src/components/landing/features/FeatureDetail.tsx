'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Plus, Sparkles } from 'lucide-react'
import { PublicContainer } from '@/components/public/PublicLayout'
import { LandingButton } from '@/components/landing/ui/LandingButton'
import { LandingCard } from '@/components/landing/ui/LandingCard'
import { LaunchFlowDemo } from './animations/LaunchFlowDemo'
import { AiDecisionFeedDemo } from './animations/AiDecisionFeedDemo'
import { AnalyticsDashboardDemo } from './animations/AnalyticsDashboardDemo'
import { WorkspaceOrgDemo } from './animations/WorkspaceOrgDemo'
import {
  FEATURE_CATEGORY_LABEL,
  FEATURE_CONTENT,
  type CategoryId,
  type FeatureContent,
} from './feature-content'
import { FEATURE_ICONS } from './feature-icons'

interface FeatureDetailProps {
  feature: FeatureContent
}

function CategoryAnimation({ category, header }: { category: CategoryId; header: string }) {
  switch (category) {
    case 'execution':
      return <LaunchFlowDemo />
    case 'aiOpt':
      return <AiDecisionFeedDemo headerLabel={header} />
    case 'analytics':
      return <AnalyticsDashboardDemo />
    case 'governance':
      return <WorkspaceOrgDemo />
    default:
      return null
  }
}

export function FeatureDetail({ feature }: FeatureDetailProps) {
  const Icon = FEATURE_ICONS[feature.iconKey]
  const related = feature.related
    .map((slug) => FEATURE_CONTENT[slug])
    .filter((f): f is FeatureContent => Boolean(f))
    .slice(0, 4)

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="feature-hero-heading"
        className="relative isolate overflow-hidden border-b border-[#e6efd9] bg-[#fafdf5]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,#ecfccb_0%,transparent_60%)]"
        />
        <PublicContainer className="py-14 md:py-20">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              На главную
            </Link>
            <span aria-hidden="true" className="text-text-tertiary">·</span>
            <Link
              href="/features"
              className="rounded-full px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
            >
              Все функции
            </Link>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#3f6212] ring-1 ring-inset ring-[#cfe8c0] shadow-[0_1px_2px_rgba(27,46,6,0.06)]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#3f6212] ring-1 ring-inset ring-[#cfe8c0] shadow-[0_1px_2px_rgba(27,46,6,0.06)]">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {feature.hero.eyebrow}
                </span>
              </div>
              <h1
                id="feature-hero-heading"
                className="mt-5 text-balance text-4xl font-medium tracking-tight text-text-primary md:text-[56px] md:leading-[1.04]"
              >
                {feature.hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg text-text-secondary">
                {feature.hero.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {feature.cta ? (
                  <LandingButton href={feature.cta.href} size="lg">
                    {feature.cta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </LandingButton>
                ) : null}
                <LandingButton href="/features" variant="secondary" size="lg">
                  Все возможности
                </LandingButton>
              </div>
            </div>

            <div>
              <CategoryAnimation category={feature.category} header={feature.mockHeader} />
            </div>
          </div>
        </PublicContainer>
      </section>

      {/* ─── BULLETS ─────────────────────────────────────────────────────── */}
      <section aria-label="Возможности модуля" className="bg-white py-20 md:py-24">
        <PublicContainer>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-[#e6efd9] ring-1 ring-[#e6efd9] md:grid-cols-2">
            {feature.bullets.map((b, i) => (
              <div key={b.title} className="flex flex-col bg-white p-7 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65a30d]">
                  0{i + 1}
                </p>
                <h3 className="mt-3 text-lg font-medium tracking-tight text-text-primary md:text-xl">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{b.desc}</p>
              </div>
            ))}
          </div>
        </PublicContainer>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="feature-steps-heading"
        className="border-y border-[#e6efd9] bg-[#fafdf5] py-20 md:py-24"
      >
        <PublicContainer>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#65a30d]">
              Как это работает
            </p>
            <h2
              id="feature-steps-heading"
              className="mt-3 text-balance text-3xl font-medium tracking-tight text-text-primary md:text-[40px] md:leading-[1.05]"
            >
              {feature.steps.length} {feature.steps.length === 4 ? 'шага' : feature.steps.length === 1 ? 'шаг' : 'шага'} от подключения до результата
            </h2>
          </div>
          <ol className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-[#cfe8c0] to-transparent lg:block"
            />
            {feature.steps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1b2e06] text-sm font-semibold text-[#d9f99d] ring-4 ring-[#fafdf5]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-medium tracking-tight text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.desc}</p>
              </li>
            ))}
          </ol>
        </PublicContainer>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section aria-labelledby="feature-faq-heading" className="bg-white py-20 md:py-24">
        <PublicContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="feature-faq-heading"
              className="text-balance text-3xl font-medium tracking-tight text-text-primary md:text-[40px] md:leading-[1.05]"
            >
              Частые вопросы
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl divide-y divide-[#e6efd9] rounded-2xl bg-white ring-1 ring-inset ring-[#e6efd9]">
            {feature.faq.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 text-left text-base font-medium text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1b2e06]">
                  <span className="flex-1 tracking-tight">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4f9ea] text-[#3f6212] transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-text-secondary">{item.a}</p>
              </details>
            ))}
          </div>
        </PublicContainer>
      </section>

      {/* ─── RELATED ──────────────────────────────────────────────────────── */}
      {related.length > 0 ? (
        <section
          aria-labelledby="feature-related-heading"
          className="border-t border-[#e6efd9] bg-[#fafdf5] py-20 md:py-24"
        >
          <PublicContainer>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <h2
                id="feature-related-heading"
                className="text-balance text-3xl font-medium tracking-tight text-text-primary md:text-[40px] md:leading-[1.05]"
              >
                Связанные функции
              </h2>
              <p className="text-sm text-text-tertiary">
                {FEATURE_CATEGORY_LABEL[feature.category]}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => {
                const RIcon = FEATURE_ICONS[r.iconKey]
                return (
                  <Link
                    key={r.slug}
                    href={`/features/${r.slug}`}
                    className="group flex flex-col rounded-2xl bg-white p-6 ring-1 ring-inset ring-[#e6efd9] shadow-[0_1px_2px_rgba(27,46,6,0.04)] transition-colors hover:ring-[#cfe8c0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2e06]"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f9ea] text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
                      <RIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-base font-medium tracking-tight text-text-primary">
                      {r.hero.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary line-clamp-3">
                      {r.hero.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#3f6212]">
                      Подробнее
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                )
              })}
            </div>
          </PublicContainer>
        </section>
      ) : null}

      {/* ─── FINAL CTA ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="feature-final-cta-heading"
        className="relative isolate overflow-hidden bg-white py-20 md:py-24"
      >
        <PublicContainer>
          <div className="relative overflow-hidden rounded-3xl bg-[#1b2e06] p-8 text-white ring-1 ring-[#243a12] md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_15%,rgba(163,230,53,0.22)_0%,transparent_60%)]"
            />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a3e635]">
                  Готовы попробовать?
                </p>
                <h2
                  id="feature-final-cta-heading"
                  className="mt-3 text-balance text-3xl font-medium tracking-tight md:text-4xl md:leading-[1.08]"
                >
                  Запустите {feature.hero.title.toLowerCase()} за 3 минуты.
                </h2>
                <p className="mt-3 max-w-xl text-white/75">
                  Бесплатный план без карты. Отключите в любой момент.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/onboarding"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#a3e635] px-6 text-base font-medium text-[#1a2e05] transition hover:bg-[#bef264] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Начать бесплатно
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <LandingButton
                  href="/features"
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Все функции
                </LandingButton>
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>
    </>
  )
}

export function FeatureDetailHighlights({ feature }: FeatureDetailProps) {
  // Optional callout strip — kept exported for reuse without breaking tree-shaking.
  return (
    <LandingCard tone="soft">
      <ul className="space-y-2 text-sm text-text-secondary">
        {feature.bullets.slice(0, 3).map((b) => (
          <li key={b.title} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#65a30d]" aria-hidden="true" />
            <span>
              <span className="font-medium text-text-primary">{b.title}.</span> {b.desc}
            </span>
          </li>
        ))}
      </ul>
    </LandingCard>
  )
}
