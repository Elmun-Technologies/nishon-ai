'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, BarChart3, Brain, CreditCard, Crown, GitBranch, Layers3, Rocket, Search, Settings2, Shield, Sparkles, Target, Users, Wallet } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'
import { ContentMediaSlot } from '@/components/media/ContentMediaSlot'
import { useI18n } from '@/i18n/use-i18n'

const GROUP_ORDER = ['execution', 'aiOpt', 'analytics', 'governance'] as const

const ITEM_ICONS: Record<string, typeof Rocket> = {
  launchWizard: Rocket,
  campaignManager: Layers3,
  audienceBuilder: Users,
  retargeting: Target,
  aiDecisions: Brain,
  autoOptimization: Settings2,
  creativeScorer: Sparkles,
  budgetOpt: Wallet,
  simulation: GitBranch,
  roiCalculator: BarChart3,
  performance: BarChart3,
  reporting: Layers3,
  competitorIntel: Search,
  automationRules: Settings2,
  topAds: Crown,
  workspaceTeam: Users,
  adAccounts: Shield,
  productsPlans: Crown,
  paymentsInvoices: CreditCard,
  mcpCreds: Settings2,
  helpCenter: Layers3,
}

const ITEM_HREFS: Record<string, string> = {
  launchWizard: '/launch',
  campaignManager: '/campaigns',
  audienceBuilder: '/audiences',
  retargeting: '/retargeting',
  aiDecisions: '/ai-decisions',
  autoOptimization: '/auto-optimization',
  creativeScorer: '/creative-scorer',
  budgetOpt: '/budget',
  simulation: '/simulation',
  roiCalculator: '/roi-calculator',
  performance: '/performance',
  reporting: '/reporting',
  competitorIntel: '/competitors',
  automationRules: '/automation',
  topAds: '/top-ads',
  workspaceTeam: '/settings/workspace/team',
  adAccounts: '/settings/workspace/ad-accounts',
  productsPlans: '/settings/workspace/products',
  paymentsInvoices: '/settings/workspace/payments',
  mcpCreds: '/settings/workspace/mcp',
  helpCenter: '/settings/workspace/help',
}

const GROUP_ITEMS: Record<(typeof GROUP_ORDER)[number], (keyof typeof ITEM_HREFS)[]> = {
  execution: ['launchWizard', 'campaignManager', 'audienceBuilder', 'retargeting'],
  aiOpt: ['aiDecisions', 'autoOptimization', 'creativeScorer', 'budgetOpt', 'simulation', 'roiCalculator'],
  analytics: ['performance', 'reporting', 'competitorIntel', 'automationRules', 'topAds'],
  governance: ['workspaceTeam', 'adAccounts', 'productsPlans', 'paymentsInvoices', 'mcpCreds', 'helpCenter'],
}

export default function FeaturesPage() {
  const { t } = useI18n()
  const m = (k: string, fb = '') => t(`publicSite.marketing.features.${k}`, fb)

  const metrics = [
    [m('metric0v'), m('metric0l')],
    [m('metric1v'), m('metric1l')],
    [m('metric2v'), m('metric2l')],
    [m('metric3v'), m('metric3l')],
  ]

  const pillars = [
    [m('pillar0Title'), m('pillar0Desc')],
    [m('pillar1Title'), m('pillar1Desc')],
    [m('pillar2Title'), m('pillar2Desc')],
  ]

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            {t('publicSite.marketing.common.backToLanding', '')}
          </Link>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">{m('badge')}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{m('title')}</h1>
              <p className="mt-4 max-w-2xl text-lg text-text-secondary">{m('subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(([value, label]) => (
                <article key={label} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="text-sm text-text-secondary">{label}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <ContentMediaSlot
              slotId="public-features-hero-media"
              ratio="21:9"
              imageSrc="/stock/features-demo.svg"
              caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            />
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-12">
        <PublicContainer className="space-y-8">
          {GROUP_ORDER.map((groupId) => {
            const g = t(`publicSite.marketing.features.groups.${groupId}.name`, '')
            const metric = t(`publicSite.marketing.features.groups.${groupId}.metric`, '')
            return (
              <section key={groupId} className="rounded-3xl border border-border bg-white p-6 md:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold md:text-3xl">{g}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{m('groupClusterSubtitle')}</p>
                  </div>
                  <span className="rounded-full border border-[#cfe8a8] bg-[#f4f9ea] px-3 py-1 text-xs font-medium text-[#4d7c0f]">{metric}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {GROUP_ITEMS[groupId].map((itemId) => {
                    const Icon = ITEM_ICONS[itemId] ?? Layers3
                    const href = ITEM_HREFS[itemId] ?? '/'
                    return (
                      <Link
                        key={itemId}
                        href={href}
                        className="group rounded-2xl border border-border bg-[#fafcf6] p-5 transition hover:border-[#84cc16]/60 hover:bg-white"
                      >
                        <div className="mb-3 inline-flex rounded-xl border border-border bg-white p-2 text-[#65a30d]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mb-2 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] text-text-tertiary">
                          {t('publicSite.marketing.common.liveModuleTag', '')}
                        </p>
                        <h3 className="text-base font-semibold">{t(`publicSite.marketing.features.items.${itemId}.title`, '')}</h3>
                        <p className="mt-2 text-sm text-text-secondary">{t(`publicSite.marketing.features.items.${itemId}.desc`, '')}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                          {t('publicSite.marketing.common.openModule', '')}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </PublicContainer>
      </section>

      <section className="border-t border-border bg-[#f8fbf2] py-14">
        <PublicContainer>
          <ContentMediaSlot
            slotId="public-features-pillar-media"
            ratio="16:9"
            imageSrc="/stock/features-demo.svg"
            caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            className="mb-6"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
