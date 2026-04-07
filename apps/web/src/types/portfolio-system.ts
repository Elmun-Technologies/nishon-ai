import type { Badge, LevelRequirements, UserLevel, IndustryType } from './portfolio'

// ─── Level System ─────────────────────────────────────────────────────────────

export const LEVEL_REQUIREMENTS: Record<UserLevel, LevelRequirements> = {
  novice: {
    level: 'novice',
    minPoints: 0,
    title: 'Novice',
    icon: '🌱',
    description: 'Journey started. Learning the basics.',
    unlocks: ['basic_badges', 'first_certification'],
  },
  apprentice: {
    level: 'apprentice',
    minPoints: 500,
    title: 'Apprentice',
    icon: '👨‍🎓',
    description: 'Growing skills. First campaigns running.',
    unlocks: ['intermediate_badges', 'multiple_certifications', 'industry_tracking'],
  },
  expert: {
    level: 'expert',
    minPoints: 2000,
    title: 'Expert',
    icon: '🎯',
    description: 'Proven track record. Consistent results.',
    unlocks: ['expert_badges', 'premium_features', 'featured_badge'],
  },
  master: {
    level: 'master',
    minPoints: 5000,
    title: 'Master',
    icon: '👑',
    description: 'Mastery achieved. Industry leader.',
    unlocks: ['master_badges', 'exclusive_tools', 'mentor_badge'],
  },
  legend: {
    level: 'legend',
    minPoints: 10000,
    title: 'Legend',
    icon: '⭐',
    description: 'Legendary performance. Platform icon.',
    unlocks: ['all_badges', 'vip_features', 'hall_of_fame'],
  },
}

// ─── Badge Definitions ────────────────────────────────────────────────────────

export const BADGE_TEMPLATES: Record<string, Omit<Badge, 'status' | 'unlockedAt'>> = {
  // ─── MILESTONE BADGES ─────────────────────────────────────────────

  'first-campaign': {
    id: 'first-campaign',
    name: "Launch Master's Debut",
    description: 'Launched your first campaign successfully',
    icon: '🚀',
    category: 'milestone',
    rarity: 'common',
    requirements: {
      minCampaigns: 1,
    },
    rewards: { points: 100, profileBoost: 2 },
  },

  'ten-campaigns': {
    id: 'ten-campaigns',
    name: 'Campaign Architect',
    description: 'Launched 10+ campaigns successfully',
    icon: '🏗️',
    category: 'milestone',
    rarity: 'rare',
    requirements: {
      minCampaigns: 10,
    },
    rewards: { points: 300, profileBoost: 5 },
  },

  'fifty-campaigns': {
    id: 'fifty-campaigns',
    name: 'Campaign Legend',
    description: 'Launched 50+ campaigns with consistent results',
    icon: '🏛️',
    category: 'milestone',
    rarity: 'epic',
    requirements: {
      minCampaigns: 50,
    },
    rewards: { points: 1000, profileBoost: 15 },
  },

  'first-million': {
    id: 'first-million',
    name: 'Million Dollar Manager',
    description: 'Managed $1M+ in ad spend',
    icon: '💰',
    category: 'milestone',
    rarity: 'epic',
    requirements: {
      minCampaigns: 10,
    },
    rewards: { points: 800, profileBoost: 12 },
  },

  'first-roas-streak': {
    id: 'first-roas-streak',
    name: 'Consistent Performer',
    description: 'Maintained 4x+ ROAS for 5+ campaigns',
    icon: '📈',
    category: 'milestone',
    rarity: 'rare',
    requirements: {
      minCampaigns: 5,
      minRoas: 4.0,
    },
    rewards: { points: 500, profileBoost: 8 },
  },

  // ─── SKILL BADGES ─────────────────────────────────────────────────

  'meta-master': {
    id: 'meta-master',
    name: 'Meta Master',
    description: 'Expert-level Meta Ads management',
    icon: '📘',
    category: 'skill',
    rarity: 'rare',
    requirements: {
      minCampaigns: 5,
      minRoas: 3.5,
    },
    rewards: { points: 400, profileBoost: 6 },
  },

  'google-guru': {
    id: 'google-guru',
    name: 'Google Guru',
    description: 'Master Google Ads strategist',
    icon: '🔵',
    category: 'skill',
    rarity: 'rare',
    requirements: {
      minCampaigns: 5,
      minRoas: 3.0,
    },
    rewards: { points: 400, profileBoost: 6 },
  },

  'tiktok-titan': {
    id: 'tiktok-titan',
    name: 'TikTok Titan',
    description: 'TikTok Ads specialist with proven results',
    icon: '🎵',
    category: 'skill',
    rarity: 'rare',
    requirements: {
      minCampaigns: 3,
      minRoas: 3.5,
    },
    rewards: { points: 350, profileBoost: 5 },
  },

  'automation-expert': {
    id: 'automation-expert',
    name: 'Automation Expert',
    description: 'Master of campaign automation and optimization',
    icon: '⚙️',
    category: 'skill',
    rarity: 'epic',
    requirements: {
      minCampaigns: 10,
      minRoas: 4.0,
    },
    rewards: { points: 600, profileBoost: 10 },
  },

  'data-analyst': {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analytics and insights expert',
    icon: '📊',
    category: 'skill',
    rarity: 'rare',
    requirements: {
      minPoints: 1000,
    },
    rewards: { points: 300, profileBoost: 5 },
  },

  'budget-optimizer': {
    id: 'budget-optimizer',
    name: 'Budget Optimizer',
    description: 'Master of budget allocation and ROI maximization',
    icon: '💵',
    category: 'skill',
    rarity: 'rare',
    requirements: {
      minCampaigns: 8,
      minRoas: 4.5,
    },
    rewards: { points: 500, profileBoost: 8 },
  },

  // ─── CERTIFICATION BADGES ─────────────────────────────────────────

  'meta-certified': {
    id: 'meta-certified',
    name: 'Meta Certified Partner',
    description: 'Official Meta Ads certification earned',
    icon: '🏆',
    category: 'certification',
    rarity: 'epic',
    requirements: {
      specificAchievement: 'meta_certification',
    },
    rewards: { points: 750, profileBoost: 12 },
  },

  'google-certified': {
    id: 'google-certified',
    name: 'Google Certified Partner',
    description: 'Official Google Partner status',
    icon: '🏅',
    category: 'certification',
    rarity: 'epic',
    requirements: {
      specificAchievement: 'google_certification',
    },
    rewards: { points: 750, profileBoost: 12 },
  },

  'platform-master': {
    id: 'platform-master',
    name: 'Platform Master',
    description: 'Certified on all major ad platforms',
    icon: '🎖️',
    category: 'certification',
    rarity: 'legendary',
    requirements: {
      specificAchievement: 'all_certifications',
    },
    rewards: { points: 2000, profileBoost: 30 },
  },

  // ─── ACHIEVEMENT BADGES ───────────────────────────────────────────

  'perfect-rating': {
    id: 'perfect-rating',
    name: 'Perfect Score',
    description: 'Maintained 5.0★ rating with 10+ reviews',
    icon: '⭐',
    category: 'achievement',
    rarity: 'legendary',
    requirements: {
      minRating: 5.0,
      specificAchievement: '10_reviews',
    },
    rewards: { points: 1500, profileBoost: 25 },
  },

  'top-performer': {
    id: 'top-performer',
    name: 'Top 1% Performer',
    description: 'Ranked in top 1% of platform',
    icon: '🏆',
    category: 'achievement',
    rarity: 'legendary',
    requirements: {
      minRoas: 5.0,
      minCampaigns: 20,
    },
    rewards: { points: 2000, profileBoost: 40 },
  },

  'consistent-excellence': {
    id: 'consistent-excellence',
    name: 'Consistent Excellence',
    description: '10+ consecutive successful campaigns',
    icon: '✨',
    category: 'achievement',
    rarity: 'epic',
    requirements: {
      minCampaigns: 10,
      minRoas: 4.0,
      specificAchievement: '10_streak',
    },
    rewards: { points: 1000, profileBoost: 18 },
  },

  'rapid-learner': {
    id: 'rapid-learner',
    name: 'Rapid Learner',
    description: 'Earned 3+ certifications in 6 months',
    icon: '🚀',
    category: 'achievement',
    rarity: 'rare',
    requirements: {
      specificAchievement: 'rapid_certifications',
    },
    rewards: { points: 600, profileBoost: 10 },
  },

  // ─── INDUSTRY BADGES ──────────────────────────────────────────────

  'ecommerce-expert': {
    id: 'ecommerce-expert',
    name: 'E-commerce Expert',
    description: '10+ successful e-commerce campaigns',
    icon: '🛍️',
    category: 'industry',
    rarity: 'rare',
    requirements: {
      minCampaigns: 10,
      specificAchievement: 'ecommerce_10',
    },
    rewards: { points: 500, profileBoost: 8 },
  },

  'saas-specialist': {
    id: 'saas-specialist',
    name: 'SaaS Specialist',
    description: '10+ successful SaaS product campaigns',
    icon: '💻',
    category: 'industry',
    rarity: 'rare',
    requirements: {
      minCampaigns: 8,
      specificAchievement: 'saas_8',
    },
    rewards: { points: 450, profileBoost: 7 },
  },

  'leadgen-legend': {
    id: 'leadgen-legend',
    name: 'Lead Gen Legend',
    description: 'Generated 10K+ leads across campaigns',
    icon: '📋',
    category: 'industry',
    rarity: 'epic',
    requirements: {
      minCampaigns: 5,
      specificAchievement: 'leadgen_10k',
    },
    rewards: { points: 800, profileBoost: 14 },
  },

  'brand-builder': {
    id: 'brand-builder',
    name: 'Brand Builder',
    description: 'Expert in brand awareness campaigns',
    icon: '🎨',
    category: 'industry',
    rarity: 'rare',
    requirements: {
      minCampaigns: 6,
      specificAchievement: 'brand_6',
    },
    rewards: { points: 400, profileBoost: 6 },
  },

  'multi-industry-master': {
    id: 'multi-industry-master',
    name: 'Multi-Industry Master',
    description: 'Expertise across 5+ industries',
    icon: '🌍',
    category: 'industry',
    rarity: 'epic',
    requirements: {
      minCampaigns: 20,
      specificAchievement: 'five_industries',
    },
    rewards: { points: 1200, profileBoost: 20 },
  },
}

// ─── Badge Unlock Logic ───────────────────────────────────────────────────────

export function canUnlockBadge(
  badge: Omit<Badge, 'status' | 'unlockedAt'>,
  userStats: {
    totalPoints: number
    rating: number
    campaignsManaged: number
    averageRoas: number
    certifications: string[]
    industries: string[]
  }
): boolean {
  const req = badge.requirements

  if (req.minPoints && userStats.totalPoints < req.minPoints) return false
  if (req.minRating && userStats.rating < req.minRating) return false
  if (req.minCampaigns && userStats.campaignsManaged < req.minCampaigns) return false
  if (req.minRoas && userStats.averageRoas < req.minRoas) return false

  return true
}

// ─── Helper to get all badges for a user ───────────────────────────────────

export function getUserBadges(userStats: {
  totalPoints: number
  rating: number
  campaignsManaged: number
  averageRoas: number
  certifications: string[]
  industries: string[]
}): Badge[] {
  return Object.entries(BADGE_TEMPLATES).map(([_, template]) => {
    const canUnlock = canUnlockBadge(template, userStats)
    return {
      ...template,
      status: canUnlock ? 'unlocked' : 'locked',
      unlockedAt: canUnlock ? new Date().toISOString() : undefined,
    }
  })
}
