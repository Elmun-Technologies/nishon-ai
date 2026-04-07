'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, TrendingUp, Check, Loader2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useSpecialistSearch, type SpecialistCard } from '@/hooks/useSpecialistSearch'

const NICHES = [
  { id: 'ecommerce', label: 'E-commerce', icon: '🛍️' },
  { id: 'saas', label: 'SaaS', icon: '💻' },
  { id: 'leadgen', label: 'Lead Generation', icon: '📋' },
  { id: 'brand', label: 'Brand Building', icon: '✨' },
  { id: 'performance', label: 'Performance', icon: '📈' },
]

const PLATFORMS = [
  { id: 'meta', label: 'Meta Certified', icon: '📘' },
  { id: 'google', label: 'Google Partner', icon: '🔵' },
  { id: 'tiktok', label: 'TikTok Certified', icon: '🎵' },
  { id: 'yandex', label: 'Yandex Expert', icon: '🔴' },
]

function SpecialistCard({ specialist, t }: { specialist: SpecialistCard; t: (key: string) => string }) {
  const avgROAS = specialist.stats?.avgROAS
  const successRate = specialist.stats?.successRate
  const totalCampaigns = specialist.stats?.totalCampaigns

  return (
    <Link href={`/marketplace/specialists/${specialist.slug}`}>
      <div className="group rounded-2xl border border-white/10 bg-surface-2/50 p-6 hover:border-emerald-500/50 hover:bg-surface-2 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="text-4xl">{specialist.avatar || '👤'}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{specialist.displayName}</h3>
                {specialist.isVerified && <Check size={16} className="text-emerald-400" />}
              </div>
              <p className="text-sm text-text-tertiary">{specialist.title}</p>
            </div>
          </div>
          <div className="text-right">
            {specialist.monthlyRate ? (
              <>
                <div className="text-xl font-bold text-emerald-400">${specialist.monthlyRate.toLocaleString()}</div>
                <p className="text-xs text-text-tertiary">/oy</p>
              </>
            ) : (
              <div className="text-sm text-text-tertiary">Narx kelishiladi</div>
            )}
          </div>
        </div>

        {/* Rating & ROAS */}
        <div className="flex items-center gap-3 py-3 border-y border-white/10 mb-4">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-white">{specialist.rating?.toFixed(1) ?? '—'}</span>
            <span className="text-sm text-text-tertiary">({specialist.reviewCount ?? 0})</span>
          </div>
          {avgROAS != null && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1">
                <TrendingUp size={16} className="text-cyan-400" />
                <span className="font-semibold text-white">{avgROAS.toFixed(1)}x ROAS</span>
              </div>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-white/10">
          <div>
            <p className="text-xs text-text-tertiary">Kampaniyalar</p>
            <p className="text-lg font-semibold text-white">{totalCampaigns ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Muvaffaqiyat</p>
            <p className="text-lg font-semibold text-white">{successRate != null ? `${successRate}%` : '—'}</p>
          </div>
        </div>

        {/* Niches */}
        {specialist.niches?.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {specialist.niches.slice(0, 4).map((niche) => {
                const nicheData = NICHES.find((n) => n.id === niche)
                return (
                  <span
                    key={niche}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs border border-cyan-500/30"
                  >
                    {nicheData?.icon ?? '📌'} {nicheData?.label ?? niche}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-sm text-text-tertiary">
            {specialist.location && (
              <>
                <MapPin size={14} />
                {specialist.location}
              </>
            )}
          </div>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium group-hover:bg-emerald-500/30 transition-colors">
            Profil →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function MarketplacePage() {
  const { t } = useI18n()
  const [filters, setFilters] = useState({
    certifications: [] as string[],
    niches: [] as string[],
    platforms: [] as string[],
    minRating: 0,
    minRoas: 0,
  })
  const [sortBy, setSortBy] = useState<'rating' | 'roas' | 'trending'>('rating')

  const { specialists, loading, error, total } = useSpecialistSearch(
    {
      niches: filters.niches.length ? filters.niches : undefined,
      platforms: filters.platforms.length ? filters.platforms : undefined,
      minRating: filters.minRating || undefined,
      minRoas: filters.minRoas || undefined,
    },
    { sortBy, pageSize: 20 },
  )

  const featuredSpecialists = specialists.filter(s => s.isFeatured).slice(0, 3)

  const toggleArrayFilter = (key: 'niches' | 'platforms', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }))
  }

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t('marketplace.title')}</h1>
              <p className="text-text-secondary mt-1">{t('marketplace.subtitle')}</p>
            </div>
            <Link href="/" className="text-emerald-300 hover:text-emerald-200 transition-colors">
              ← {t('common.home')}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Featured Section */}
        {!loading && featuredSpecialists.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">{t('marketplace.featured')}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredSpecialists.map((specialist) => (
                <SpecialistCard key={specialist.id} specialist={specialist} t={t} />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('marketplace.filters')}</h2>
          <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-6 space-y-6">
            {/* Sorting */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">{t('marketplace.sorting')}</label>
              <div className="flex gap-3">
                {([
                  { key: 'rating' as const, label: t('marketplace.sortBy.rating') },
                  { key: 'roas' as const, label: t('marketplace.sortBy.roas') },
                  { key: 'trending' as const, label: '🔥 Trending' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortBy === key
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Minimal Reytingi</label>
              <div className="flex gap-2">
                {[0, 4.0, 4.5, 4.8].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.minRating === rating
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {rating === 0 ? 'Barchasi' : `${rating}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* ROAS Filter */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Minimal ROAS</label>
              <div className="flex gap-2">
                {[0, 3, 4, 5].map((roas) => (
                  <button
                    key={roas}
                    onClick={() => setFilters(prev => ({ ...prev, minRoas: roas }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filters.minRoas === roas
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {roas === 0 ? 'Barchasi' : `${roas}x+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Niches */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Mutahassisliklari</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => toggleArrayFilter('niches', niche.id)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filters.niches.includes(niche.id)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {niche.icon} {niche.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Platformalar</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => toggleArrayFilter('platforms', platform.id)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filters.platforms.includes(platform.id)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                  >
                    {platform.icon} {platform.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {t('marketplace.results')}: <span className="text-emerald-400">{total}</span> {t('marketplace.specialist')}
            </h2>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-text-tertiary">
              <Loader2 size={20} className="animate-spin" />
              <span>Yuklanmoqda...</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-12 text-center">
              <p className="text-text-secondary text-lg">Mutaxassislarni yuklashda xatolik yuz berdi</p>
              <p className="text-text-tertiary text-sm mt-2">{error.message}</p>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && specialists.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {specialists.map((specialist) => (
                <SpecialistCard key={specialist.id} specialist={specialist} t={t} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && specialists.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-12 text-center">
              <p className="text-text-tertiary text-lg">{t('marketplace.noResults')}</p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('marketplace.cta.title')}</h2>
          <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
            {t('marketplace.cta.subtitle')}
          </p>
          <Link
            href="/register?role=specialist"
            className="inline-block px-8 py-3 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-400 transition-colors"
          >
            {t('marketplace.cta.button')}
          </Link>
        </section>
      </div>
    </div>
  )
}
