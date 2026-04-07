import { create } from 'zustand'
import type { UserPortfolio, IndustrySpecialization, Badge, Achievement } from '@/types/portfolio'
import { BADGE_TEMPLATES, LEVEL_REQUIREMENTS, getUserBadges } from '@/types/portfolio-system'

// ─── Mock User Portfolio Data ─────────────────────────────────────────────────

const MOCK_PORTFOLIO: UserPortfolio = {
  userId: 'user_123',
  username: 'Dilshod_Pro',
  avatar: '👨‍💼',
  bio: 'E-commerce performance specialist. 7+ years building profitable campaigns. 4.8x average ROAS.',
  headline: 'Meta & Google Ads Specialist | E-commerce Expert',

  // Level System
  level: 'master',
  totalPoints: 7250,
  pointsToNextLevel: 2750,
  percentToNextLevel: 72.5,

  // Rating
  rating: 4.9,
  reviewCount: 127,
  responseTime: 2,

  // Badges
  badges: [],
  totalBadgesUnlocked: 18,
  totalBadgesAvailable: 28,

  // Certifications
  certifications: [
    {
      id: 'cert_meta_1',
      name: 'Meta Blueprint - Campaign Specialist',
      type: 'platform',
      issuer: 'Meta',
      platform: 'meta',
      earnedAt: '2022-06-15',
    },
    {
      id: 'cert_google_1',
      name: 'Google Ads Search Certification',
      type: 'platform',
      issuer: 'Google',
      platform: 'google',
      earnedAt: '2022-09-20',
    },
    {
      id: 'cert_google_2',
      name: 'Google Ads Display Certification',
      type: 'platform',
      issuer: 'Google',
      platform: 'google',
      earnedAt: '2022-10-10',
    },
  ],
  platformCertifications: ['meta', 'google'],

  // Industry Specializations
  specializations: [
    {
      industry: 'ecommerce',
      icon: '🛍️',
      campaigns: 87,
      averageRoas: 5.2,
      totalSpend: 125000,
      expertise: 'master',
      topClients: 12,
    },
    {
      industry: 'saas',
      icon: '💻',
      campaigns: 34,
      averageRoas: 3.8,
      totalSpend: 52000,
      expertise: 'expert',
      topClients: 5,
    },
    {
      industry: 'leadgen',
      icon: '📋',
      campaigns: 23,
      averageRoas: 3.2,
      totalSpend: 28000,
      expertise: 'expert',
      topClients: 3,
    },
  ],
  primaryIndustry: 'ecommerce',

  // Statistics
  campaignsManaged: 187,
  totalSpend: 250000,
  averageRoas: 4.8,
  successRate: 94,
  clientCount: 24,
  repeatClientRate: 87,

  // Achievements
  streakDays: 156,
  perfectRating: false,
  topPerformer: true,

  // Testimonials
  testimonials: [
    {
      text: 'Dilshod took our e-commerce business from 2x ROAS to 5.2x in 4 months. Incredible results!',
      author: 'Farida M., CEO',
      rating: 5,
      industry: 'ecommerce',
    },
    {
      text: 'Professional, responsive, and strategic. Best marketer we have worked with.',
      author: 'Rustam K., Store Owner',
      rating: 5,
      industry: 'ecommerce',
    },
    {
      text: 'Helped us launch our SaaS product successfully. Smart audience targeting.',
      author: 'Akmal T., Founder',
      rating: 5,
      industry: 'saas',
    },
  ],

  joinedAt: '2017-03-15',
}

// ─── Store Interface ───────────────────────────────────────────────────────────

interface PortfolioStore {
  portfolio: UserPortfolio | null
  isLoading: boolean

  // Portfolio actions
  loadPortfolio: (userId: string) => void
  updatePortfolio: (updates: Partial<UserPortfolio>) => void

  // Points & Levels
  addPoints: (points: number, reason: string) => void
  claimAchievement: (achievementId: string) => void

  // Badges
  unlockBadge: (badgeId: string) => void
  getAllBadges: () => Badge[]

  // Analytics
  getIndustryStats: (industry: string) => IndustrySpecialization | undefined
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  portfolio: MOCK_PORTFOLIO,
  isLoading: false,

  loadPortfolio: (userId) => {
    set({ isLoading: true })
    // Simulate API call
    setTimeout(() => {
      set({ isLoading: false })
    }, 500)
  },

  updatePortfolio: (updates) =>
    set((state) => {
      if (!state.portfolio) return state
      return {
        portfolio: { ...state.portfolio, ...updates },
      }
    }),

  addPoints: (points, reason) => {
    set((state) => {
      if (!state.portfolio) return state

      const newPoints = state.portfolio.totalPoints + points
      const currentLevelReq = LEVEL_REQUIREMENTS[state.portfolio.level]
      const nextLevel = Object.entries(LEVEL_REQUIREMENTS).find(
        ([_, req]) => req.minPoints > newPoints
      )

      let newLevel = state.portfolio.level
      if (nextLevel) {
        newLevel = nextLevel[0] as any
      }

      const nextLevelReq = LEVEL_REQUIREMENTS[newLevel]
      const pointsToNext = Math.max(0, nextLevelReq.minPoints - newPoints)
      const percentToNext = ((newPoints - currentLevelReq.minPoints) /
        (nextLevelReq.minPoints - currentLevelReq.minPoints)) * 100

      return {
        portfolio: {
          ...state.portfolio,
          totalPoints: newPoints,
          level: newLevel,
          pointsToNextLevel: pointsToNext,
          percentToNextLevel: Math.min(100, Math.max(0, percentToNext)),
        },
      }
    })
  },

  claimAchievement: (achievementId) => {
    set((state) => {
      if (!state.portfolio) return state

      const achievement = BADGE_TEMPLATES[achievementId]
      if (!achievement || !achievement.rewards) return state

      // Add points from achievement
      return state
    })
  },

  unlockBadge: (badgeId) => {
    set((state) => {
      if (!state.portfolio) return state

      const badge = BADGE_TEMPLATES[badgeId]
      if (!badge) return state

      const unlockedBadge: Badge = {
        ...badge,
        status: 'unlocked',
        unlockedAt: new Date().toISOString(),
      }

      const updatedBadges = [...state.portfolio.badges, unlockedBadge]

      return {
        portfolio: {
          ...state.portfolio,
          badges: updatedBadges,
          totalBadgesUnlocked: updatedBadges.filter((b) => b.status === 'unlocked').length,
        },
      }
    })
  },

  getAllBadges: () => {
    const state = get()
    if (!state.portfolio) return []

    return getUserBadges({
      totalPoints: state.portfolio.totalPoints,
      rating: state.portfolio.rating,
      campaignsManaged: state.portfolio.campaignsManaged,
      averageRoas: state.portfolio.averageRoas,
      certifications: state.portfolio.platformCertifications,
      industries: state.portfolio.specializations.map((s) => s.industry),
    })
  },

  getIndustryStats: (industry) => {
    const state = get()
    if (!state.portfolio) return undefined
    return state.portfolio.specializations.find((s) => s.industry === industry)
  },
}))
