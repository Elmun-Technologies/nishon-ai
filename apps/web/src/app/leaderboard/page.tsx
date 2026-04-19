'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Award, Star } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar, PublicSectionHeader } from '@/components/public/PublicLayout'
import { useI18n } from '@/i18n/use-i18n'

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
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('overall')

  const lp = (k: string, fb = '') => t(`publicSite.marketing.leaderboardPublic.${k}`, fb)

  const TABS = [
    { id: 'overall', label: lp('tabOverall'), icon: '🏆' },
    { id: 'rising', label: lp('tabRising'), icon: '🌟' },
    { id: 'roas', label: lp('tabRoas'), icon: '📈' },
    { id: 'rating', label: lp('tabRating'), icon: '⭐' },
  ]

  const sortedByTab = useMemo(
    () => ({
      overall: LEADERBOARD_DATA,
      rising: [...LEADERBOARD_DATA].sort((a, b) => parseInt(b.trend) - parseInt(a.trend)),
      roas: [...LEADERBOARD_DATA].sort((a, b) => b.roas - a.roas),
      rating: [...LEADERBOARD_DATA].sort((a, b) => b.rating - a.rating),
    }),
    [],
  )

  const displayData = sortedByTab[activeTab as keyof typeof sortedByTab]

  const infoBlocks = [
    { icon: '🎯', title: t('leaderboard.pointsSystem', ''), desc: t('leaderboard.pointsDesc', '') },
    { icon: '🏆', title: t('leaderboard.levels', ''), desc: t('leaderboard.levelsDesc', '') },
    { icon: '🎖️', title: t('leaderboard.badgesReward', ''), desc: t('leaderboard.badgesDesc', '') },
  ]

  const dot = t('publicSite.marketing.common.dot', ' • ')

  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface py-10">
        <PublicContainer>
          <PublicSectionHeader eyebrow={lp('eyebrow')} title={lp('title')} description={lp('description')} />

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
          {activeTab === 'overall' && (
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-text-primary">{lp('top3Title')}</h2>
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
                      <div className="mb-4 text-6xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>

                      <div className="mb-4 text-5xl">{specialist.avatar}</div>

                      <h3 className="mb-1 text-2xl font-bold text-text-primary">{specialist.username}</h3>
                      <p className="mb-4 flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                        <span>{specialist.levelIcon}</span>
                        {specialist.level}
                      </p>

                      <div className="space-y-3 border-y border-border py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-text-tertiary">{t('leaderboard.rating', '')}</span>
                          <span className="flex items-center gap-1">
                            {specialist.rating}
                            <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-tertiary">{t('leaderboard.roas', '')}</span>
                          <span className="font-semibold text-emerald-400">{specialist.roas}x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-tertiary">{t('leaderboard.points', '')}</span>
                          <span className="font-bold text-text-primary">{specialist.points}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-sm">
                          <span className="text-text-tertiary">{specialist.specialtyIcon}</span>
                          <span className="ml-2 font-semibold">{specialist.specialty}</span>
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {specialist.campaigns} {lp('campaignsJoin')}
                          {dot}
                          {specialist.badges} {t('publicSite.marketing.common.badgesWord', '')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-surface-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.rank', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.specialist', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.level', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.rating', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.roas', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.campaigns', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.specialty', '')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.badges', '')}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">{t('leaderboard.points', '')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayData.map((specialist) => (
                    <tr key={specialist.username} className="group cursor-pointer transition-colors hover:bg-surface-2">
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-yellow-500">#{specialist.rank}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/portfolio/${specialist.username}`} className="flex items-center gap-3">
                          <div className="text-2xl">{specialist.avatar}</div>
                          <div>
                            <p className="font-semibold text-text-primary group-hover:text-primary">{specialist.username}</p>
                            <p className="text-xs text-text-tertiary">
                              {specialist.reviews} {t('publicSite.marketing.common.reviews', '')}
                            </p>
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
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
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
                      <td className="px-6 py-4 text-right font-bold text-text-primary">{specialist.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-surface p-8">
            <h3 className="mb-4 text-2xl font-bold text-text-primary">{t('leaderboard.howWorks', '')}</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {infoBlocks.map((item) => (
                <div key={item.title}>
                  <div className="mb-3 text-4xl">{item.icon}</div>
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
