/**
 * O‘zbekiston uchun tariflar (so‘m). Payme: sum * 100 = tiyin miqdori.
 */

export type SubscriptionPlanId = 'free' | 'starter' | 'pro' | 'agency'

export interface PlanLimits {
  maxCampaigns: number | null
  /** Agency: client workspace limit; boshqa planlarda 1 */
  maxClientAccounts: number
  dataRetentionDays: number | null
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  priceUzs: number
  /** Taxminiy USD (faqat ko‘rsatish) */
  approxUsd: number
  tagline: string
  features: string[]
  limits: PlanLimits
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceUzs: 0,
    approxUsd: 0,
    tagline: 'Kirish, ko‘rish, o‘rganish',
    features: ['1 ta kampaniya', '7 kunlik data', 'Dashboard'],
    limits: { maxCampaigns: 1, maxClientAccounts: 1, dataRetentionDays: 7 },
  },
  {
    id: 'starter',
    name: 'Starter',
    priceUzs: 199_000,
    approxUsd: 16,
    tagline: 'Kichik do‘kon',
    features: ['5 ta kampaniya', 'Auto-optimizer', 'Reports', 'Telegram alerts'],
    limits: { maxCampaigns: 5, maxClientAccounts: 1, dataRetentionDays: null },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUzs: 499_000,
    approxUsd: 40,
    tagline: 'Targetolog, agentlik',
    features: [
      'Cheksiz kampaniya',
      'Ad Library',
      'Audience Studio',
      '1-click Creative Hub',
      'Prioritet support',
    ],
    limits: { maxCampaigns: null, maxClientAccounts: 1, dataRetentionDays: null },
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    priceUzs: 1_199_000,
    approxUsd: 95,
    tagline: 'Agentliklar',
    features: ['10 ta client account', 'White-label', 'API access'],
    limits: { maxCampaigns: null, maxClientAccounts: 10, dataRetentionDays: null },
  },
]

export function getPlan(id: SubscriptionPlanId | string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id)
}

/** Payme Merchant API: summa tiyinda (1 so‘m = 100 tiyin). */
export function uzsToPaymeTiyin(amountUzs: number): number {
  return Math.round(amountUzs * 100)
}

export function formatUzs(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}
