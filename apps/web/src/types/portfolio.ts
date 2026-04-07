// ─── Badge Types ──────────────────────────────────────────────────────────────

export type BadgeStatus = 'locked' | 'unlocked'
export type BadgeCategory = 'milestone' | 'skill' | 'certification' | 'achievement' | 'industry'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: BadgeCategory
  rarity: BadgeRarity
  status: BadgeStatus
  unlockedAt?: string
  requirements: {
    minPoints?: number
    minRating?: number
    minCampaigns?: number
    minRoas?: number
    specificAchievement?: string
  }
  rewards?: {
    points: number
    profileBoost: number
  }
}

// ─── User Level System ────────────────────────────────────────────────────────

export type UserLevel = 'novice' | 'apprentice' | 'expert' | 'master' | 'legend'

export interface LevelRequirements {
  level: UserLevel
  minPoints: number
  title: string
  icon: string
  description: string
  unlocks: string[]  // What features/badges unlock at this level
}

// ─── Certification Types ──────────────────────────────────────────────────────

export type CertificationType = 'platform' | 'industry' | 'specialization'

export interface Certification {
  id: string
  name: string
  type: CertificationType
  issuer: string
  platform?: 'meta' | 'google' | 'tiktok' | 'yandex'
  category?: string
  earnedAt: string
  expiresAt?: string
  verificationLink?: string
}

// ─── Industry Specialization ───────────────────────────────────────────────────

export type IndustryType =
  | 'ecommerce'
  | 'saas'
  | 'leadgen'
  | 'brand'
  | 'finance'
  | 'health'
  | 'education'
  | 'travel'
  | 'fashion'
  | 'automotive'
  | 'real-estate'
  | 'technology'

export interface IndustrySpecialization {
  industry: IndustryType
  icon: string
  campaigns: number
  averageRoas: number
  totalSpend: number
  expertise: 'beginner' | 'intermediate' | 'expert' | 'master'
  topClients: number
}

// ─── User Portfolio/Profile ───────────────────────────────────────────────────

export interface UserPortfolio {
  userId: string
  username: string
  avatar: string
  bio: string
  headline: string

  // Level & Points System
  level: UserLevel
  totalPoints: number
  pointsToNextLevel: number
  percentToNextLevel: number

  // Rating & Reviews
  rating: number
  reviewCount: number
  responseTime: number  // hours

  // Badges
  badges: Badge[]
  totalBadgesUnlocked: number
  totalBadgesAvailable: number

  // Certifications
  certifications: Certification[]
  platformCertifications: ('meta' | 'google' | 'tiktok' | 'yandex')[]

  // Industry Specializations
  specializations: IndustrySpecialization[]
  primaryIndustry: IndustryType

  // Statistics
  campaignsManaged: number
  totalSpend: number
  averageRoas: number
  successRate: number
  clientCount: number
  repeatClientRate: number

  // Achievements
  streakDays: number  // Days active in a row
  perfectRating: boolean
  topPerformer: boolean

  // Social Proof
  testimonials: {
    text: string
    author: string
    rating: number
    industry: IndustryType
  }[]

  joinedAt: string
}

// ─── Achievement Types ────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
  points: number
  rarity: BadgeRarity
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar: string
  level: UserLevel
  totalPoints: number
  rating: number
  specialization: IndustryType
}
