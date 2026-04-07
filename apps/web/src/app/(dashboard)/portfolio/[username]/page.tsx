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
} from 'lucide-react'
import { usePortfolioStore } from '@/stores/portfolio.store'
import { LEVEL_REQUIREMENTS, BADGE_TEMPLATES } from '@/types/portfolio-system'

const RARITIES = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-300' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-300' },
}

function BadgeCard({ badgeId, status }: { badgeId: string; status: 'locked' | 'unlocked' }) {
  const badge = BADGE_TEMPLATES[badgeId]
  if (!badge) return null

  const rarity = RARITIES[badge.rarity]
  const isLocked = status === 'locked'

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        isLocked
          ? 'border-white/10 bg-white/5 opacity-50 hover:opacity-60'
          : `${rarity.border} ${rarity.bg} hover:${rarity.border.replace('40', '60')}`
      }`}
    >
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
          <Lock size={24} className="text-white/50" />
        </div>
      )}

      <div className="text-center">
        <div className="text-4xl mb-2">{badge.icon}</div>
        <h4 className="font-semibold text-sm text-white mb-1">{badge.name}</h4>
        <p className="text-xs text-text-tertiary mb-3">{badge.description}</p>

        <div className="flex items-center justify-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rarity.bg} ${rarity.text}`}>
            {badge.rarity}
          </span>
        </div>

        {!isLocked && badge.rewards && (
          <div className="mt-2 text-xs text-emerald-300 font-medium">
            +{badge.rewards.points} pts
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtext }: any) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface-2/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-text-tertiary">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-text-tertiary mt-1">{subtext}</p>}
    </div>
  )
}

function IndustryCard({ industry, icon, campaigns, roas, spend, expertise }: any) {
  const expertiseColors = {
    beginner: 'text-yellow-400',
    intermediate: 'text-cyan-400',
    expert: 'text-emerald-400',
    master: 'text-purple-400',
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface-2/50 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-3xl mb-2">{icon}</div>
          <h3 className="font-semibold text-white capitalize">{industry}</h3>
        </div>
        <span className={`text-sm font-semibold ${expertiseColors[expertise]}`}>
          {expertise}
        </span>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <div className="flex justify-between">
          <span className="text-sm text-text-tertiary">Campaigns</span>
          <span className="text-sm font-semibold text-white">{campaigns}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-tertiary">Avg ROAS</span>
          <span className="text-sm font-semibold text-emerald-400">{roas}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-tertiary">Total Spend</span>
          <span className="text-sm font-semibold text-white">${spend.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default function PortfolioPage({ params }: { params: { username: string } }) {
  const portfolio = usePortfolioStore((s) => s.portfolio)
  const [activeTab, setActiveTab] = useState<'badges' | 'industries' | 'testimonials'>('badges')

  if (!portfolio) {
    return <div className="text-center py-20">Loading portfolio...</div>
  }

  const currentLevelReq = LEVEL_REQUIREMENTS[portfolio.level]
  const nextLevelEntry = Object.entries(LEVEL_REQUIREMENTS).find(
    ([_, req]) => req.level !== portfolio.level && req.minPoints > portfolio.totalPoints
  )
  const nextLevelReq = nextLevelEntry ? nextLevelEntry[1] : currentLevelReq

  const allBadges = usePortfolioStore((s) => s.getAllBadges())
  const unlockedBadges = allBadges.filter((b) => b.status === 'unlocked')
  const lockedBadges = allBadges.filter((b) => b.status === 'locked')

  const INDUSTRY_ICONS: Record<string, string> = {
    ecommerce: '🛍️',
    saas: '💻',
    leadgen: '📋',
    brand: '🎨',
    finance: '💰',
    health: '⚕️',
    education: '📚',
    travel: '✈️',
    fashion: '👗',
    automotive: '🚗',
    'real-estate': '🏠',
    technology: '💡',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="text-6xl">{portfolio.avatar}</div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{portfolio.username}</h1>
                <div className="text-3xl">{currentLevelReq.icon}</div>
              </div>
              <p className="text-xl text-text-secondary mb-1">{portfolio.headline}</p>
              <p className="text-text-tertiary mb-4">{portfolio.bio}</p>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-white">{portfolio.rating}</span>
                  <span className="text-text-tertiary">({portfolio.reviewCount} reviews)</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-cyan-400" />
                  <span className="text-text-tertiary">Joined {new Date(portfolio.joinedAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-text-tertiary mb-2">Level</p>
            <p className="text-4xl font-bold text-white capitalize">{portfolio.level}</p>
            <p className="text-xs text-text-tertiary mt-2">{currentLevelReq.title}</p>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap size={24} className="text-yellow-400" /> Level Progress
            </h2>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-400">{portfolio.totalPoints}</p>
              <p className="text-xs text-text-tertiary">Points</p>
            </div>
          </div>

          {/* Level Bar */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-text-secondary capitalize">{portfolio.level}</span>
                <span className="text-sm text-text-secondary capitalize">
                  {nextLevelReq.level} ({nextLevelReq.minPoints})
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${portfolio.percentToNextLevel}%` }}
                />
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                {portfolio.pointsToNextLevel.toLocaleString()} points to next level
              </p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl mb-2">🔥</div>
            <p className="text-xs text-text-tertiary">Streak</p>
            <p className="text-lg font-bold text-white">{portfolio.streakDays} days</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-xs text-text-tertiary">Avg ROAS</p>
            <p className="text-lg font-bold text-emerald-400">{portfolio.averageRoas}x</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-xs text-text-tertiary">Success Rate</p>
            <p className="text-lg font-bold text-white">{portfolio.successRate}%</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-xs text-text-tertiary">Repeat Clients</p>
            <p className="text-lg font-bold text-white">{portfolio.repeatClientRate}%</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          label="Campaigns"
          value={portfolio.campaignsManaged}
        />
        <StatCard
          icon={<Users size={18} className="text-cyan-400" />}
          label="Clients"
          value={portfolio.clientCount}
          subtext="Active relationships"
        />
        <StatCard
          icon={<Award size={18} className="text-yellow-400" />}
          label="Certifications"
          value={portfolio.certifications.length}
          subtext={portfolio.platformCertifications.join(', ')}
        />
        <StatCard
          icon={<Globe size={18} className="text-purple-400" />}
          label="Industries"
          value={portfolio.specializations.length}
          subtext="Specialized areas"
        />
      </div>

      {/* Certifications */}
      <div className="rounded-2xl border border-white/10 bg-surface-2/50 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield size={24} /> Certifications
        </h2>

        <div className="grid gap-3">
          {portfolio.certifications.map((cert) => (
            <div key={cert.id} className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-black/20">
              <div className="text-2xl">
                {cert.platform === 'meta' && '📘'}
                {cert.platform === 'google' && '🔵'}
                {cert.platform === 'tiktok' && '🎵'}
                {cert.platform === 'yandex' && '🔴'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{cert.name}</p>
                <p className="text-sm text-text-tertiary">{cert.issuer}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-tertiary">
                  Earned {new Date(cert.earnedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300">Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Tabs */}
      <div>
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
          {(['badges', 'industries', 'testimonials'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-emerald-300 border-b-2 border-emerald-400'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab === 'badges' && `Badges (${unlockedBadges.length}/${allBadges.length})`}
              {tab === 'industries' && `Specializations (${portfolio.specializations.length})`}
              {tab === 'testimonials' && `Testimonials (${portfolio.testimonials.length})`}
            </button>
          ))}
        </div>

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-8">
            {unlockedBadges.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Check size={20} className="text-emerald-400" /> Unlocked Badges ({unlockedBadges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {unlockedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badgeId={badge.id} status="unlocked" />
                  ))}
                </div>
              </div>
            )}

            {lockedBadges.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Lock size={20} className="text-text-tertiary" /> Locked Badges ({lockedBadges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {lockedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badgeId={badge.id} status="locked" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Industries Tab */}
        {activeTab === 'industries' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.specializations.map((spec) => (
              <IndustryCard
                key={spec.industry}
                industry={spec.industry}
                icon={INDUSTRY_ICONS[spec.industry] || '📊'}
                campaigns={spec.campaigns}
                roas={spec.averageRoas}
                spend={spec.totalSpend}
                expertise={spec.expertise}
              />
            ))}
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <div className="space-y-4">
            {portfolio.testimonials.map((testimonial, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-surface-2/50 p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-tertiary">— {testimonial.author}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300 capitalize">
                    {INDUSTRY_ICONS[testimonial.industry]} {testimonial.industry}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to collaborate?</h2>
        <p className="text-text-secondary mb-6">Contact {portfolio.username} through the marketplace</p>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-400 transition-colors">
          <Mail size={18} /> Send Message
        </button>
      </div>
    </div>
  )
}
