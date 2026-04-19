'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Star } from 'lucide-react'
import { MOCK_TARGETOLOGISTS, formatSpend } from '@/lib/portfolio-data'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'

export default function PortfolioDetailPage({ params }: { params: { slug: string } }) {
  const person = MOCK_TARGETOLOGISTS.find((item) => item.slug === params.slug)
  if (!person) notFound()

  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface py-8">
        <PublicContainer>
          <Link href="/portfolio" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>

          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <div>
              <h1 className="text-3xl font-semibold">{person.name}</h1>
              <p className="mt-1 text-text-secondary">{person.title}</p>
              <p className="mt-3 max-w-3xl text-sm text-text-secondary">{person.bio}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs text-text-tertiary">Rating</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {person.rating.toFixed(1)} ({person.reviewCount} reviews)
              </p>
              <p className="mt-3 text-xs text-text-tertiary">Response time</p>
              <p className="text-sm font-medium">{person.responseTime}</p>
              <p className="mt-3 text-xs text-text-tertiary">Location</p>
              <p className="text-sm font-medium">{person.location}</p>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="py-10">
        <PublicContainer>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-tertiary">Avg ROAS</p>
              <p className="text-lg font-semibold">{person.stats.avgROAS}x</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-tertiary">Managed spend</p>
              <p className="text-lg font-semibold">{formatSpend(person.stats.totalSpendManaged)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-tertiary">Campaigns</p>
              <p className="text-lg font-semibold">{person.stats.totalCampaigns}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-tertiary">Success rate</p>
              <p className="text-lg font-semibold">{person.stats.successRate}%</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Specialization niches</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {person.niches.map((niche) => (
                  <span key={niche} className="rounded-full border border-border px-2 py-0.5 text-sm text-text-secondary">
                    {niche}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Platform split</h2>
              <div className="mt-3 space-y-2">
                {person.platformSplit.map((row) => (
                  <div key={row.platform} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{row.platform}</span>
                    <span className="font-medium">{row.percent}%</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="mt-6 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">Recent campaign samples</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-text-tertiary">
                  <tr>
                    <th className="pb-2">Niche</th>
                    <th className="pb-2">Platform</th>
                    <th className="pb-2">Spend</th>
                    <th className="pb-2">ROAS</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {person.recentCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="py-2">{campaign.niche}</td>
                      <td className="py-2">{campaign.platform}</td>
                      <td className="py-2">{formatSpend(campaign.spend)}</td>
                      <td className="py-2">{campaign.roas}x</td>
                      <td className="py-2 capitalize">{campaign.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
