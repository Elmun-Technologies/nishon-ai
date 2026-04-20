'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, LineChart, ShieldCheck, Workflow } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { ContentMediaSlot } from '@/components/media/ContentMediaSlot'
import { useI18n } from '@/i18n/use-i18n'

const TRACK_ORDER = ['ecommerce', 'agency', 'inhouse'] as const

const TRACK_META: Record<(typeof TRACK_ORDER)[number], { cta: string; color: string }> = {
  ecommerce: { cta: '/launch', color: 'bg-[#f4f9ea] border-[#cfe8a8]' },
  agency: { cta: '/settings/workspace', color: 'bg-[#eef6ff] border-[#bfdbfe]' },
  inhouse: { cta: '/ai-decisions', color: 'bg-[#f5f3ff] border-[#ddd6fe]' },
}

export default function SolutionsPage() {
  const { t } = useI18n()
  const s = (k: string, fb = '') => t(`publicSite.marketing.solutions.${k}`, fb)

  const steps = [
    [s('step0Label'), s('step0Title'), s('step0Desc')],
    [s('step1Label'), s('step1Title'), s('step1Desc')],
    [s('step2Label'), s('step2Title'), s('step2Desc')],
  ]

  const structureItems = [s('structure0'), s('structure1'), s('structure2')]

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            {t('publicSite.marketing.common.backToLanding', '')}
          </Link>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
            <div>
              <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">{s('badge')}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{s('title')}</h1>
              <p className="mt-4 text-lg text-text-secondary">{s('subtitle')}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-xl font-semibold">{s('structureTitle')}</h2>
              <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-[#65a30d]" />
                  {structureItems[0]}
                </li>
                <li className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-[#65a30d]" />
                  {structureItems[1]}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#65a30d]" />
                  {structureItems[2]}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <ContentMediaSlot
              slotId="public-solutions-hero-media"
              ratio="21:9"
              imageSrc="/stock/solutions-demo.svg"
              caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            />
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-12">
        <PublicContainer>
          <div className="grid gap-5 md:grid-cols-3">
            {TRACK_ORDER.map((trackId) => {
              const meta = TRACK_META[trackId]
              const tr = (k: string) => t(`publicSite.marketing.solutions.tracks.${trackId}.${k}`, '')
              const stacks = [tr('stack0'), tr('stack1'), tr('stack2'), tr('stack3')]
              return (
                <article key={trackId} className="rounded-2xl border border-border bg-white p-6">
                  <div className={`mb-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.color}`}>
                    {t('publicSite.marketing.common.solutionTrackTag', '')}
                  </div>
                  <h2 className="text-2xl font-semibold">{tr('title')}</h2>
                  <p className="mt-2 text-sm text-text-secondary">{tr('summary')}</p>
                  <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                    {stacks.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#65a30d]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={meta.cta} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                    {t('publicSite.marketing.common.openRelatedFlow', '')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      <section className="border-y border-border bg-[#f8fbf2] py-14">
        <PublicContainer>
          <ContentMediaSlot
            slotId="public-solutions-steps-media"
            ratio="16:9"
            imageSrc="/stock/solutions-demo.svg"
            caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            className="mb-6"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(([step, title, desc]) => (
              <article key={title} className="rounded-2xl border border-border bg-white p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-[#65a30d]">{step}</p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-14">
        <PublicContainer>
          <div className="rounded-3xl border border-border bg-white p-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-[1.3fr_auto] md:items-center">
              <div>
                <p className="text-sm font-medium text-[#65a30d]">{s('nextEyebrow')}</p>
                <h2 className="mt-1 text-3xl font-semibold md:text-4xl">{s('nextTitle')}</h2>
                <p className="mt-3 text-text-secondary">{s('nextSubtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/features" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium">
                  {s('openFeatureMap')}
                </Link>
                <Link href="/login" className="rounded-xl bg-[#84cc16] px-4 py-2.5 text-sm font-semibold text-[#1a2e05]">
                  {s('openProduct')}
                </Link>
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
