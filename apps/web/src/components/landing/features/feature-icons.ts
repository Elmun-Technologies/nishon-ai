import {
  BarChart3,
  Brain,
  CreditCard,
  Crown,
  GitBranch,
  Layers3,
  type LucideIcon,
  Rocket,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
} from 'lucide-react'

export type FeatureIconKey =
  | 'rocket'
  | 'layers'
  | 'users'
  | 'target'
  | 'brain'
  | 'settings'
  | 'sparkles'
  | 'wallet'
  | 'gitBranch'
  | 'barChart'
  | 'search'
  | 'crown'
  | 'shield'
  | 'creditCard'

export const FEATURE_ICONS: Record<FeatureIconKey, LucideIcon> = {
  rocket: Rocket,
  layers: Layers3,
  users: Users,
  target: Target,
  brain: Brain,
  settings: Settings2,
  sparkles: Sparkles,
  wallet: Wallet,
  gitBranch: GitBranch,
  barChart: BarChart3,
  search: Search,
  crown: Crown,
  shield: Shield,
  creditCard: CreditCard,
}
