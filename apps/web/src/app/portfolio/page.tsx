'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Star } from 'lucide-react'
import { MOCK_TARGETOLOGISTS, formatSpend } from '@/lib/portfolio-data'
import { PublicContainer, PublicFooter, PublicNavbar, PublicSectionHeader } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

export default function PortfolioPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'roas' | 'rating' | 'spend'>('roas')

  const pp = (k: string, fb = '') => t(`publicSite.marketing.portfolioPublic.${k}`, fb)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = MOCK_TARGETOLOGISTS.filter((p) => {
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.niches.some((n) => n.toLowerCase().includes(q))
      )
    })

    list.sort((a, b) => {
      if (sortBy === 'roas') return b.stats.avgROAS - a.stats.avgROAS
      if (sortBy === 'rating') return b.rating - a.rating
      return b.stats.totalSpendManaged - a.stats.totalSpendManaged
    })
    return list
  }, [search, sortBy])

  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface py-10">
        <PublicContainer>
          <PublicSectionHeader eyebrow={pp('eyebrow')} title={pp('title')} description={pp('description')} />

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xl font-semibold">{MOCK_TARGETOLOGISTS.length}</p>
              <p className="text-sm text-text-secondary">{pp('statSpecialists')}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xl font-semibold">
                {formatSpend(MOCK_TARGETOLOGISTS.reduce((sum, item) => sum + item.stats.totalSpendManaged, 0))}
              </p>
              <p className="text-sm text-text-secondary">{pp('statManagedSpend')}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xl font-semibold">
                {(MOCK_TARGETOLOGISTS.reduce((sum, item) => sum + item.stats.avgROAS, 0) / MOCK_TARGETOLOGISTS.length).toFixed(1)}x
              </p>
              <p className="text-sm text-text-secondary">{pp('statAvgRoas')}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xl font-semibold">
                {MOCK_TARGETOLOGISTS.reduce((sum, item) => sum + item.stats.totalCampaigns, 0)}
              </p>
              <p className="text-sm text-text-secondary">{pp('statCampaigns')}</p>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="py-10">
        <PublicContainer>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={pp('searchPlaceholder')}
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'roas' | 'rating' | 'spend')}
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-secondary"
            >
              <option value="roas">{pp('sortRoas')}</option>
              <option value="rating">{pp('sortRating')}</option>
              <option value="spend">{pp('sortSpend')}</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((person) => (
              <Link
                key={person.id}
                href={`/portfolio/${person.slug}`}
                className="group rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{person.name}</h3>
                    <p className="text-sm text-text-secondary">{person.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {person.rating.toFixed(1)}
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {person.reviewCount} {t('publicSite.marketing.common.reviews', '')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border bg-surface-2 p-2 text-center">
                    <p className="text-xs text-text-tertiary">{pp('labelRoas')}</p>
                    <p className="text-sm font-semibold">{person.stats.avgROAS}x</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2 p-2 text-center">
                    <p className="text-xs text-text-tertiary">{pp('labelCampaigns')}</p>
                    <p className="text-sm font-semibold">{person.stats.totalCampaigns}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2 p-2 text-center">
                    <p className="text-xs text-text-tertiary">{pp('labelSpend')}</p>
                    <p className="text-sm font-semibold">{formatSpend(person.stats.totalSpendManaged)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {person.niches.slice(0, 3).map((niche) => (
                    <span key={niche} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-tertiary">
                      {niche}
                    </span>
                  ))}
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
