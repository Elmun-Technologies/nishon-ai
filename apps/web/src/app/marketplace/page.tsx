'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Search, Star, TrendingUp, Users } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar, PublicSectionHeader } from '@/components/public/PublicLayout'

const specialists = [
  {
    id: 'spec_1',
    name: 'Dilshod Rakhimov',
    title: 'Meta & Google Ads Specialist',
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
  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface py-10">
        <PublicContainer>
          <PublicSectionHeader
            eyebrow="Talent Marketplace"
            title="Find verified performance specialists for your campaigns"
            description="Marketplace helps teams quickly discover experts by ROAS, niche, and operating style. Profiles include portfolio and review context."
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Specialists', value: '150+', icon: Users },
              { label: 'Average Rating', value: '4.8', icon: Star },
              { label: 'Average ROAS', value: '3.9x', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="mb-2 inline-flex rounded-lg border border-border p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-semibold">{item.value}</p>
                  <p className="text-sm text-text-secondary">{item.label}</p>
                </div>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      <section className="py-10">
        <PublicContainer>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                placeholder="Search by specialist, niche, or platform"
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <select className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-secondary">
              <option>Sort by rating</option>
              <option>Sort by ROAS</option>
              <option>Sort by reviews</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {specialists.map((spec) => (
              <Link
                key={spec.id}
                href={`/marketplace/specialists/${spec.id}`}
                className="group rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{spec.name}</h3>
                  {spec.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">{spec.title}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border bg-surface-2 p-2 text-center">
                    <p className="text-xs text-text-tertiary">Rating</p>
                    <p className="text-sm font-semibold">{spec.rating}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2 p-2 text-center">
                    <p className="text-xs text-text-tertiary">ROAS</p>
                    <p className="text-sm font-semibold">{spec.roas}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2 p-2 text-center">
                    <p className="text-xs text-text-tertiary">Reviews</p>
                    <p className="text-sm font-semibold">{spec.reviews}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {spec.specialties.map((s) => (
                    <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-tertiary">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-text-secondary">{spec.monthlyRate}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    Open profile
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
