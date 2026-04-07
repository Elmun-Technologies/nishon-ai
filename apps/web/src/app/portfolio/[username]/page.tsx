'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Star,
  TrendingUp,
  Award,
  Lock,
  Check,
  Users,
  Zap,
  Shield,
  Globe,
  Calendar,
  Mail,
  Share2,
  Heart,
} from 'lucide-react'

const SPECIALIST_PORTFOLIO = {
  userId: 'spec_1',
  username: 'Dilshod_Pro',
  avatar: '👨‍💼',
  bio: 'E-commerce performance specialist. 7+ years building profitable campaigns. 4.8x average ROAS.',
  headline: 'Meta & Google Ads Specialist | E-commerce Expert',

  level: 'master',
  totalPoints: 7250,
  pointsToNextLevel: 2750,
  percentToNextLevel: 72.5,

  rating: 4.9,
  reviewCount: 127,
  responseTime: 2,

  badges: [
    { id: 'first-campaign', name: "Launch Master's Debut", icon: '🚀', rarity: 'common', unlocked: true },
    { id: 'ten-campaigns', name: 'Campaign Architect', icon: '🏗️', rarity: 'rare', unlocked: true },
    { id: 'fifty-campaigns', name: 'Campaign Legend', icon: '🏛️', rarity: 'epic', unlocked: true },
    { id: 'first-million', name: 'Million Dollar Manager', icon: '💰', rarity: 'epic', unlocked: true },
    { id: 'first-roas-streak', name: 'Consistent Performer', icon: '📈', rarity: 'rare', unlocked: true },
    { id: 'meta-master', name: 'Meta Master', icon: '📘', rarity: 'rare', unlocked: true },
    { id: 'google-guru', name: 'Google Guru', icon: '🔵', rarity: 'rare', unlocked: true },
    { id: 'ecommerce-expert', name: 'E-commerce Expert', icon: '🛍️', rarity: 'rare', unlocked: true },
    { id: 'saas-specialist', name: 'SaaS Specialist', icon: '💻', rarity: 'rare', unlocked: true },
    { id: 'leadgen-legend', name: 'Lead Gen Legend', icon: '📋', rarity: 'epic', unlocked: true },
    { id: 'automation-expert', name: 'Automation Expert', icon: '⚙️', rarity: 'epic', unlocked: true },
    { id: 'consistent-excellence', name: 'Consistent Excellence', icon: '✨', rarity: 'epic', unlocked: true },
    { id: 'top-performer', name: 'Top 1% Performer', icon: '🏆', rarity: 'legendary', unlocked: true },
    { id: 'meta-certified', name: 'Meta Certified Partner', icon: '🏆', rarity: 'epic', unlocked: true },
    { id: 'google-certified', name: 'Google Certified Partner', icon: '🏅', rarity: 'epic', unlocked: true },
    { id: 'perfect-rating', name: 'Perfect Score', icon: '⭐', rarity: 'legendary', unlocked: false },
    { id: 'platform-master', name: 'Platform Master', icon: '🎖️', rarity: 'legendary', unlocked: false },
    { id: 'multi-industry-master', name: 'Multi-Industry Master', icon: '🌍', rarity: 'epic', unlocked: true },
  ],

  certifications: [
    { name: 'Meta Blueprint - Campaign Specialist', issuer: 'Meta', platform: '📘', date: '2022-06-15' },
    { name: 'Google Ads Search Certification', issuer: 'Google', platform: '🔵', date: '2022-09-20' },
    { name: 'Google Ads Display Certification', issuer: 'Google', platform: '🔵', date: '2022-10-10' },
  ],

  specializations: [
    { industry: 'E-commerce', icon: '🛍️', campaigns: 87, roas: 5.2, spend: 125000, expertise: 'Master' },
    { industry: 'SaaS', icon: '💻', campaigns: 34, roas: 3.8, spend: 52000, expertise: 'Expert' },
    { industry: 'Lead Gen', icon: '📋', campaigns: 23, roas: 3.2, spend: 28000, expertise: 'Expert' },
  ],

  stats: {
    campaigns: 187,
    clients: 24,
    industries: 3,
    platforms: 2,
    totalSpend: 250000,
    averageRoas: 4.8,
    successRate: 94,
    repeatClients: 87,
    streak: 156,
  },

  testimonials: [
    {
      text: 'Dilshod took our e-commerce business from 2x ROAS to 5.2x in 4 months. Incredible!',
      author: 'Farida M., CEO',
      rating: 5,
      company: 'Fashion Store',
    },
    {
      text: 'Professional, responsive, and strategic. Best marketer we have worked with.',
      author: 'Rustam K.',
      rating: 5,
      company: 'Online Retail',
    },
    {
      text: 'Helped us launch our SaaS product successfully. Smart audience targeting.',
      author: 'Akmal T., Founder',
      rating: 5,
      company: 'Tech Startup',
    },
  ],

  joinedAt: '2017-03-15',
}

const RARITIES = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-300' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-300' },
}

function BadgeDisplay({ badge }: any) {
  const rarity = RARITIES[badge.rarity]

  return (
    <div
      className={`relative group rounded-2xl border p-6 transition-all cursor-pointer ${
        badge.unlocked
          ? `${rarity.border} ${rarity.bg} hover:${rarity.border.replace('40', '60')} hover:scale-105`
          : 'border-white/10 bg-white/5 opacity-50'
      }`}
    >
      <div className="text-center">
        <div className="text-5xl mb-3">{badge.icon}</div>
        <h3 className="font-semibold text-white mb-1">{badge.name}</h3>

        {!badge.unlocked && (
          <div className="flex items-center justify-center gap-1 text-xs text-text-tertiary mt-3 bg-black/40 rounded-full px-3 py-1 w-fit mx-auto">
            <Lock size={12} /> Locked
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/95 border border-white/20 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap">
          {badge.unlocked ? '✓ Unlocked' : '🔒 Locked'}
        </div>
      </div>
    </div>
  )
}

export default function PublicPortfolioPage({ params }: { params: { username: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'specializations'>('overview')
  const profile = SPECIALIST_PORTFOLIO

  const unlockedBadges = profile.badges.filter((b) => b.unlocked)
  const lockedBadges = profile.badges.filter((b) => !b.unlocked)

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      {/* Header Navigation */}
      <nav className="border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-emerald-300 hover:text-emerald-200 transition-colors text-sm">
              ← Back
            </Link>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Share2 size={18} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero Section */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-12 mb-12">
          <div className="flex items-start gap-8">
            <div className="text-7xl">{profile.avatar}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-5xl font-bold">{profile.username}</h1>
                <div className="text-4xl">👑</div>
              </div>
              <p className="text-2xl text-emerald-300 mb-2">{profile.headline}</p>
              <p className="text-lg text-text-secondary mb-6 max-w-2xl">{profile.bio}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{profile.rating}</span>
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  </div>
                  <p className="text-xs text-text-tertiary">({profile.reviewCount} reviews)</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Level</p>
                  <p className="text-2xl font-bold">Master 👑</p>
                  <p className="text-xs text-text-tertiary">Top 5%</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Avg ROAS</p>
                  <p className="text-2xl font-bold text-emerald-400">{profile.stats.averageRoas}x</p>
                  <p className="text-xs text-text-tertiary">{profile.stats.successRate}% success</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-1">Experience</p>
                  <p className="text-2xl font-bold">7+ years</p>
                  <p className="text-xs text-text-tertiary">Since 2017</p>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-400 transition-colors">
                <Mail size={18} /> Hire {profile.username}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: '📊', label: 'Campaigns', value: profile.stats.campaigns },
            { icon: '👥', label: 'Clients', value: profile.stats.clients },
            { icon: '🌍', label: 'Industries', value: profile.stats.industries },
            { icon: '💰', label: 'Total Managed', value: `$${(profile.stats.totalSpend / 1000).toFixed(0)}K` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-surface-2/50 p-4 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-text-tertiary mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield size={24} className="text-cyan-400" /> Verified Certifications
          </h2>
          <div className="space-y-3">
            {profile.certifications.map((cert, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-black/20">
                <div className="text-2xl">{cert.platform}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{cert.name}</p>
                  <p className="text-sm text-text-tertiary">{cert.issuer}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Check size={18} />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          {(['overview', 'badges', 'specializations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-colors capitalize ${
                activeTab === tab
                  ? 'text-emerald-300 border-b-2 border-emerald-400'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'badges' && `Badges (${unlockedBadges.length}/${profile.badges.length})`}
              {tab === 'specializations' && 'Specializations'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Achievements */}
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap size={24} className="text-yellow-400" /> Achievements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🔥', label: 'Daily Streak', value: `${profile.stats.streak} days` },
                  { icon: '⭐', label: 'Perfect Ratings', value: 'On track' },
                  { icon: '📈', label: 'ROAS Leader', value: 'Top 2%' },
                  { icon: '🏆', label: 'Repeat Clients', value: `${profile.stats.repeatClients}%` },
                ].map((achievement) => (
                  <div key={achievement.label} className="text-center p-4 rounded-lg border border-white/10 bg-black/20">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <p className="text-sm text-text-tertiary mb-1">{achievement.label}</p>
                    <p className="text-lg font-bold text-emerald-400">{achievement.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Heart size={24} className="text-red-400" /> Client Reviews
              </h3>
              <div className="space-y-4">
                {profile.testimonials.map((testimonial, i) => (
                  <div key={i} className="p-5 rounded-lg border border-white/10 bg-black/20">
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, j) => (
                        <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white mb-3 italic">"{testimonial.text}"</p>
                    <p className="text-sm text-text-tertiary">
                      — {testimonial.author} • <span className="text-cyan-300">{testimonial.company}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-8">
            {unlockedBadges.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Check size={20} className="text-emerald-400" /> Unlocked Badges ({unlockedBadges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {unlockedBadges.map((badge) => (
                    <BadgeDisplay key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            )}

            {lockedBadges.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Lock size={20} className="text-text-tertiary" /> Locked Badges ({lockedBadges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {lockedBadges.map((badge) => (
                    <BadgeDisplay key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Specializations Tab */}
        {activeTab === 'specializations' && (
          <div className="grid gap-6">
            {profile.specializations.map((spec) => (
              <div key={spec.industry} className="rounded-xl border border-white/10 bg-surface-2/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-4xl mb-2">{spec.icon}</div>
                    <h3 className="text-2xl font-bold text-white">{spec.industry}</h3>
                    <p className={`text-sm font-semibold mt-2 ${
                      spec.expertise === 'Master' ? 'text-purple-400' :
                      spec.expertise === 'Expert' ? 'text-emerald-400' :
                      'text-cyan-400'
                    }`}>
                      {spec.expertise} Level
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Campaigns</p>
                    <p className="text-2xl font-bold text-white">{spec.campaigns}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Avg ROAS</p>
                    <p className="text-2xl font-bold text-emerald-400">{spec.roas}x</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Total Spend</p>
                    <p className="text-2xl font-bold text-cyan-400">${(spec.spend / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-12 text-center mt-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to work together?</h2>
          <p className="text-lg text-text-secondary mb-8">
            {profile.username} is available for new projects and long-term partnerships
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-full hover:opacity-90 transition-opacity">
            <Mail size={20} /> Contact {profile.username.split('_')[0]}
          </button>
        </div>
      </div>
    </div>
  )
}
