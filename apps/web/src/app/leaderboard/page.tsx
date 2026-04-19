'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Award, Crown, Star, TrendingUp } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar, PublicSectionHeader } from '@/components/public/PublicLayout'

const LEADERBOARD_DATA = [
  {
    rank: 1,
    username: 'Dilshod_Pro',
    avatar: '👨‍💼',
    level: 'Master',
    levelIcon: '👑',
    points: 7250,
    rating: 4.9,
    reviews: 127,
    roas: 4.8,
    campaigns: 187,
    specialty: 'E-commerce',
    specialtyIcon: '🛍️',
    badges: 18,
    trend: '↑ +450',
    featured: true,
  },
  {
    rank: 2,
    username: 'Saida_TikTok',
    avatar: '👩‍💼',
    level: 'Expert',
    levelIcon: '🎯',
    points: 5800,
    rating: 4.85,
    reviews: 98,
    roas: 5.2,
    campaigns: 145,
    specialty: 'TikTok Ads',
    specialtyIcon: '🎵',
    badges: 14,
    trend: '↑ +320',
    featured: true,
  },
  {
    rank: 3,
    username: 'Akmal_Lead',
    avatar: '👨‍💼',
    level: 'Expert',
    levelIcon: '🎯',
    points: 5200,
    rating: 4.75,
    reviews: 85,
    roas: 3.8,
    campaigns: 128,
    specialty: 'Lead Gen',
    specialtyIcon: '📋',
    badges: 12,
    trend: '↑ +280',
    featured: true,
  },
  {
    rank: 4,
    username: 'Gulnora_Shop',
    avatar: '👩‍💼',
    level: 'Expert',
    levelIcon: '🎯',
    points: 4950,
    rating: 4.95,
    reviews: 73,
    roas: 6.1,
    campaigns: 92,
    specialty: 'E-commerce',
    specialtyIcon: '🛍️',
    badges: 11,
    trend: '↑ +420',
    featured: false,
  },
  {
    rank: 5,
    username: 'Nasim_Agency',
    avatar: '👨‍💼',
    level: 'Pro',
    levelIcon: '⭐',
    points: 4650,
    rating: 4.7,
    reviews: 156,
    roas: 4.2,
    campaigns: 245,
    specialty: 'All Platforms',
    specialtyIcon: '🌍',
    badges: 9,
    trend: '↑ +180',
    featured: false,
  },
  {
    rank: 6,
    username: 'Rustam_Yandex',
    avatar: '👨‍💼',
    level: 'Intermediate',
    levelIcon: '📈',
    points: 3400,
    rating: 4.6,
    reviews: 62,
    roas: 3.8,
    campaigns: 76,
    specialty: 'Yandex Direct',
    specialtyIcon: '🔴',
    badges: 7,
    trend: '↑ +140',
    featured: false,
  },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('overall')

  const TABS = [
    { id: 'overall', label: 'Overall', icon: '🏆' },
    { id: 'rising', label: 'Rising', icon: '🌟' },
    { id: 'roas', label: 'ROAS leaders', icon: '📈' },
    { id: 'rating', label: 'Top rated', icon: '⭐' },
  ]

  const sortedByTab = useMemo(() => ({
    overall: LEADERBOARD_DATA,
    rising: [...LEADERBOARD_DATA].sort((a, b) => parseInt(b.trend) - parseInt(a.trend)),
    roas: [...LEADERBOARD_DATA].sort((a, b) => b.roas - a.roas),
    rating: [...LEADERBOARD_DATA].sort((a, b) => b.rating - a.rating),
  }), [])

  const displayData = sortedByTab[activeTab as keyof typeof sortedByTab]

  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface py-10">
        <PublicContainer>
          <PublicSectionHeader
            eyebrow="Performance Ranking"
            title="Top specialists by outcomes, consistency, and client trust"
            description="Leaderboard helps brands compare specialists by ROAS, ratings, campaigns, and verified delivery patterns."
          />

          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  activeTab === tab.id
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-2'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="py-10">
        <PublicContainer>
        {/* Featured Section - Top 3 */}
        {activeTab === 'overall' && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-text-primary">Top 3 specialists</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {displayData.slice(0, 3).map((specialist, idx) => (
                <Link
                  key={specialist.rank}
                  href={`/portfolio/${specialist.username}`}
                  className={`group rounded-2xl border transition-all hover:scale-[1.02] ${
                    idx === 0
                      ? 'border-yellow-300 bg-yellow-50 ring-2 ring-yellow-200'
                      : idx === 1
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-orange-300 bg-orange-50'
                  } p-8`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>

                    <div className="text-5xl mb-4">{specialist.avatar}</div>

                    <h3 className="mb-1 text-2xl font-bold text-text-primary">{specialist.username}</h3>
                    <p className="mb-4 flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                      <span>{specialist.levelIcon}</span>
                      {specialist.level}
                    </p>

                    <div className="space-y-3 border-y border-border py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-text-tertiary">Rating</span>
                        <span className="flex items-center gap-1">
                          {specialist.rating}
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-tertiary">ROAS</span>
                        <span className="text-emerald-400 font-semibold">{specialist.roas}x</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-tertiary">Points</span>
                        <span className="font-bold text-text-primary">{specialist.points}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="text-text-tertiary">{specialist.specialtyIcon}</span>
                        <span className="font-semibold ml-2">{specialist.specialty}</span>
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {specialist.campaigns} campaigns • {specialist.badges} badges
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-2">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Specialist</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">ROAS</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Campaigns</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Specialty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Badges</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayData.map((specialist) => (
                  <tr
                    key={specialist.username}
                    className="group cursor-pointer transition-colors hover:bg-surface-2"
                  >
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-yellow-500">#{specialist.rank}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/portfolio/${specialist.username}`} className="flex items-center gap-3">
                        <div className="text-2xl">{specialist.avatar}</div>
                        <div>
                          <p className="font-semibold text-text-primary group-hover:text-primary">
                            {specialist.username}
                          </p>
                          <p className="text-xs text-text-tertiary">{specialist.reviews} reviews</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-sm font-semibold">
                        {specialist.levelIcon} {specialist.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{specialist.rating}</span>
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600">{specialist.roas}x</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-primary">{specialist.campaigns}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {specialist.specialtyIcon} {specialist.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Award size={16} className="text-purple-400" />
                        <span className="text-sm font-medium">{specialist.badges}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-text-primary">
                      {specialist.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-2xl border border-border bg-surface p-8">
          <h3 className="mb-4 text-2xl font-bold text-text-primary">How leaderboard works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Points system',
                desc: 'Points combine campaign quality, consistency, and verified delivery over time.',
              },
              {
                icon: '🏆',
                title: 'Level progression',
                desc: 'Specialists move from intermediate to master tiers based on sustained outcomes.',
              },
              {
                icon: '🎖️',
                title: 'Badge rewards',
                desc: 'Badges reflect domain strengths such as ROAS leadership, speed, and retention.',
              },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h4 className="mb-2 font-semibold text-text-primary">{item.title}</h4>
                <p className="text-sm text-text-tertiary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
