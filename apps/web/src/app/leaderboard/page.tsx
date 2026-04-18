'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, TrendingUp, Award, Crown, Target } from 'lucide-react'
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

  const TABS = [
    { id: 'overall', label: t('leaderboard.overall'), icon: '🏆' },
    { id: 'rising', label: t('leaderboard.rising'), icon: '🌟' },
    { id: 'roas', label: t('leaderboard.roasLeaders'), icon: '📈' },
    { id: 'rating', label: t('leaderboard.topRated'), icon: '⭐' },
  ]

  const sortedByTab = {
    overall: LEADERBOARD_DATA,
    rising: [...LEADERBOARD_DATA].sort((a, b) => parseInt(b.trend) - parseInt(a.trend)),
    roas: [...LEADERBOARD_DATA].sort((a, b) => b.roas - a.roas),
    rating: [...LEADERBOARD_DATA].sort((a, b) => b.rating - a.rating),
  }

  const displayData = sortedByTab[activeTab as keyof typeof sortedByTab]

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <Crown size={32} className="text-yellow-400" /> {t('leaderboard.title')}
              </h1>
              <p className="text-text-secondary mt-2">{t('leaderboard.subtitle')}</p>
            </div>
            <Link href="/" className="text-emerald-300 hover:text-emerald-200 transition-colors">
              ← {t('common.home')}
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-text-secondary hover:bg-white/20'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Featured Section - Top 3 */}
        {activeTab === 'overall' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-text-primary">{t('leaderboard.top3')}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {displayData.slice(0, 3).map((specialist, idx) => (
                <Link
                  key={specialist.rank}
                  href={`/portfolio/${specialist.username}`}
                  className={`group rounded-2xl border transition-all hover:scale-105 cursor-pointer ${
                    idx === 0
                      ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 ring-2 ring-yellow-500/20'
                      : idx === 1
                        ? 'border-gray-400/40 bg-gradient-to-br from-gray-400/10 to-slate-500/10'
                        : 'border-orange-600/40 bg-gradient-to-br from-orange-600/10 to-red-600/10'
                  } p-8`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>

                    <div className="text-5xl mb-4">{specialist.avatar}</div>

                    <h3 className="text-2xl font-bold text-white mb-1">{specialist.username}</h3>
                    <p className="flex items-center justify-center gap-1 text-lg font-semibold text-emerald-300 mb-4">
                      <span>{specialist.levelIcon}</span>
                      {specialist.level}
                    </p>

                    <div className="space-y-3 py-4 border-y border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-text-tertiary">{t('pages.leaderboard.rating')}</span>
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
                        <span className="text-text-tertiary">{t('pages.leaderboard.points')}</span>
                        <span className="font-bold text-white">{specialist.points}</span>
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
        <div className="rounded-2xl border border-white/10 bg-surface-2/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated/[0.04] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.rank')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.specialist')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.level')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.rating')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.roas')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.campaigns')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.specialty')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">{t('leaderboard.badges')}</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">{t('leaderboard.points')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {displayData.map((specialist) => (
                  <tr
                    key={specialist.username}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-yellow-400">#{specialist.rank}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/portfolio/${specialist.username}`} className="flex items-center gap-3">
                        <div className="text-2xl">{specialist.avatar}</div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-emerald-300">
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
                      <span className="text-emerald-400 font-bold">{specialist.roas}x</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white">{specialist.campaigns}</span>
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
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {specialist.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8">
          <h3 className="text-2xl font-bold text-white mb-4">{t('leaderboard.howWorks')}</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                titleKey: 'leaderboard.pointsSystem',
                descKey: 'leaderboard.pointsDesc',
              },
              {
                icon: '🏆',
                titleKey: 'leaderboard.levels',
                descKey: 'leaderboard.levelsDesc',
              },
              {
                icon: '🎖️',
                titleKey: 'leaderboard.badgesReward',
                descKey: 'leaderboard.badgesDesc',
              },
            ].map((item) => (
              <div key={item.titleKey}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h4 className="font-semibold text-white mb-2">{t(item.titleKey)}</h4>
                <p className="text-sm text-text-tertiary">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
