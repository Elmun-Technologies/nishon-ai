'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Search, SlidersHorizontal, Star, TrendingUp, Users } from 'lucide-react'
import { PublicContainer, PublicFooter } from '@/components/public/PublicLayout'
import { ContentMediaSlot } from '@/components/media/ContentMediaSlot'
import { MarketplaceLiveDiscovery } from '@/components/marketplace/MarketplaceLiveDiscovery'
import { useI18n } from '@/i18n/use-i18n'

const specialists = [
  {
    id: 'spec_1',
    name: 'Dilshod Rakhimov',
    title: 'Meta and Google Ads Specialist',
    rating: 4.9,
    reviews: 127,
    roas: '4.8x',
    monthlyRate: '$250 / hour',
    specialties: ['E-commerce', 'Performance', 'Creative Testing'],
    verified: true,
  },
  {
    id: 'spec_2',
    name: 'Saida Karimova',
    title: 'Growth Marketing Strategist',
    rating: 4.8,
    reviews: 93,
    roas: '4.2x',
    monthlyRate: '$220 / hour',
    specialties: ['Funnel Ops', 'Lifecycle', 'Retention'],
    verified: true,
  },
  {
    id: 'spec_3',
    name: 'Akmal Tursunov',
    title: 'Media Buying Lead',
    rating: 4.7,
    reviews: 86,
    roas: '3.9x',
    monthlyRate: '$180 / hour',
    specialties: ['Lead Gen', 'Budget Control', 'Reporting'],
    verified: false,
  },
]

export default function MarketplacePage() {
  const { t } = useI18n()
  const mp = (k: string, fb = '') => t(`publicSite.marketing.marketplacePublic.${k}`, fb)

  const marketplaceStats: Array<{ value: string; label: string; icon: typeof Users }> = [
    { value: mp('stat0v'), label: mp('stat0l'), icon: Users },
    { value: mp('stat1v'), label: mp('stat1l'), icon: Star },
    { value: mp('stat2v'), label: mp('stat2l'), icon: TrendingUp },
  ]

  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <section className="border-b border-border bg-[#111827] text-white">
        <PublicContainer className="py-14 md:py-20">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
            <div>
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">{mp('heroBadge')}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
                {mp('heroTitle1')}
                <br />
                {mp('heroTitle2')}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">{mp('heroSubtitle')}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {marketplaceStats.map(({ value, label, icon: StatIcon }) => {
                return (
                  <article key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <StatIcon className="mb-2 h-4 w-4 text-[#a3e635]" />
                    <p className="text-xl font-semibold">{value}</p>
                    <p className="text-xs text-slate-300">{label}</p>
                  </article>
                )
              })}
            </div>
          </div>
          <div className="mt-6">
            <ContentMediaSlot
              slotId="public-marketplace-hero-media"
              ratio="21:9"
              imageSrc="/stock/marketplace-demo.svg"
              caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            />
          </div>
        </PublicContainer>
      </section>

      <MarketplaceLiveDiscovery />

      <section className="bg-surface py-10">
        <PublicContainer>
          <div className="rounded-2xl border border-border bg-white p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  placeholder={mp('searchPlaceholder')}
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#84cc16]/60"
                />
              </div>
              <select className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-secondary">
                <option value="rating">{t('marketplace.sortBy.rating', '')}</option>
                <option value="roas">{t('marketplace.sortBy.roas', '')}</option>
                <option value="price">{t('marketplace.sortBy.price', '')}</option>
              </select>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-2">
                <SlidersHorizontal className="h-4 w-4" />
                {mp('advancedFilters')}
              </button>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-4 pb-14">
        <PublicContainer>
          <ContentMediaSlot
            slotId="public-marketplace-catalog-media"
            ratio="16:9"
            imageSrc="/stock/marketplace-demo.svg"
            caption={t('preAuthOnboarding.mediaSlotCaption', 'Illustration / motion')}
            className="mb-6"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {specialists.map((spec) => (
              <Link
                key={spec.id}
                href={`/marketplace/specialists/${spec.id}`}
                className="group rounded-2xl border border-border bg-white p-6 transition hover:border-[#84cc16]/60"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{spec.name}</h3>
                  {spec.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('publicSite.marketing.common.verified', '')}
                    </span>
                  )}
                </div>

                <p className="text-sm text-text-secondary">{spec.title}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border bg-surface-2 p-2.5 text-center">
                    <p className="text-xs text-text-tertiary">{t('leaderboard.rating', '')}</p>
                    <p className="text-sm font-semibold">{spec.rating}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2 p-2.5 text-center">
                    <p className="text-xs text-text-tertiary">{t('leaderboard.roas', '')}</p>
                    <p className="text-sm font-semibold">{spec.roas}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2 p-2.5 text-center">
                    <p className="text-xs text-text-tertiary">{t('publicSite.marketing.specialistProfile.reviewsLabel', '')}</p>
                    <p className="text-sm font-semibold">{spec.reviews}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {spec.specialties.map((s) => (
                    <span key={s} className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] text-text-tertiary">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-text-secondary">{spec.monthlyRate}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                    {mp('openProfile')}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
