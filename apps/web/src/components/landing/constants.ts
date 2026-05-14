import {
  BarChart3,
  Brain,
  CreditCard,
  Gauge,
  Layers3,
  LineChart,
  Rocket,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react'

export const CORE_MODULES = [
  { key: 'campaignLaunch', href: '/launch', icon: Rocket },
  { key: 'aiDecisions', href: '/ai-decisions', icon: Brain },
  { key: 'performance', href: '/performance', icon: BarChart3 },
  { key: 'creativeScorer', href: '/creative-scorer', icon: Sparkles },
  { key: 'workspaceGov', href: '/settings/workspace/team', icon: Users },
  { key: 'billing', href: '/settings/workspace/payments', icon: CreditCard },
] as const

export const FLOW_KEYS = ['connect', 'launch', 'optimize', 'scale'] as const
export const PLAN_KEYS = ['free', 'starter', 'growth', 'pro', 'agency'] as const
export const PAIN_KEYS = ['roas', 'manual', 'team'] as const
export const USE_CASE_KEYS = ['brand', 'agency', 'specialist'] as const
export const TESTIMONIAL_KEYS = [0, 1, 2] as const
export const FAQ_INDICES = [0, 1, 2, 3, 4, 5] as const

export const PAIN_ICONS = { roas: LineChart, manual: Gauge, team: Users } as const
export const USE_CASE_ICONS = { brand: Target, agency: Layers3, specialist: Sparkles } as const

export const INTEGRATIONS = [
  'Meta Ads',
  'Google Ads',
  'TikTok Ads',
  'AmoCRM',
  'Telegram',
  'Payme',
  'Google Sheets',
  'Click',
] as const

export const MONETIZATION_KEYS = [
  { key: 'subscription', icon: Wallet },
  { key: 'billing', icon: CreditCard },
  { key: 'marketplace', icon: Layers3 },
] as const
