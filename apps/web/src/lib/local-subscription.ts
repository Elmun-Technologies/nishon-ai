/**
 * Client-side subscription snapshot (MVP). Keyin API / workspace bilan sinxron.
 */

import type { SubscriptionPlanId } from '@/lib/subscription-plans'
import { getPlan } from '@/lib/subscription-plans'

const KEY = 'adspectr-local-subscription-v1'

export type BillingProvider = 'payme' | 'click' | 'uzum'

export interface BillingTransaction {
  id: string
  paidAt: string
  amountUzs: number
  method: BillingProvider
  status: 'success' | 'pending' | 'failed'
  planId: SubscriptionPlanId
}

export interface LocalSubscriptionState {
  planId: SubscriptionPlanId
  /** ISO — keyingi avto-to‘lov (oyning 1-kuni) */
  currentPeriodEnd: string | null
  paymentMethod: BillingProvider | null
  transactions: BillingTransaction[]
  /** Demo: kampaniya / client usage */
  usageCampaigns: number
  usageClientAccounts: number
  promoCodeApplied: string | null
}

/** Keyingi oyning 1-kuni (avto-renewal uchun ko‘rsatish). */
export function nextRenewalDateIso(from = new Date()): string {
  const y = from.getFullYear()
  const m = from.getMonth()
  const firstNext = new Date(y, m + 1, 1, 12, 0, 0, 0)
  return firstNext.toISOString()
}

function getDefaultLocalSubscription(): LocalSubscriptionState {
  return {
    planId: 'pro',
    currentPeriodEnd: nextRenewalDateIso(),
    paymentMethod: 'payme',
    transactions: [
      {
        id: 'demo_tx_1',
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        amountUzs: 499_000,
        method: 'payme',
        status: 'success',
        planId: 'pro',
      },
      {
        id: 'demo_tx_2',
        paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        amountUzs: 499_000,
        method: 'click',
        status: 'success',
        planId: 'pro',
      },
    ],
    usageCampaigns: 8,
    usageClientAccounts: 0,
    promoCodeApplied: null,
  }
}

export function loadLocalSubscription(): LocalSubscriptionState {
  if (typeof window === 'undefined') return getDefaultLocalSubscription()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return getDefaultLocalSubscription()
    const p = JSON.parse(raw) as Partial<LocalSubscriptionState>
    const base = getDefaultLocalSubscription()
    return {
      ...base,
      ...p,
      transactions: Array.isArray(p.transactions) ? p.transactions : base.transactions,
    }
  } catch {
    return getDefaultLocalSubscription()
  }
}

export function saveLocalSubscription(next: LocalSubscriptionState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function applySuccessfulPayment(args: {
  planId: SubscriptionPlanId
  method: BillingProvider
  transactionId: string
  amountUzs: number
}) {
  const cur = loadLocalSubscription()
  const paidAt = new Date().toISOString()
  const tx: BillingTransaction = {
    id: args.transactionId,
    paidAt,
    amountUzs: args.amountUzs,
    method: args.method,
    status: 'success',
    planId: args.planId,
  }
  const next: LocalSubscriptionState = {
    ...cur,
    planId: args.planId,
    paymentMethod: args.method,
    currentPeriodEnd: args.planId === 'free' ? null : nextRenewalDateIso(),
    transactions: [tx, ...cur.transactions.filter((t) => t.id !== args.transactionId)],
  }
  saveLocalSubscription(next)
  return next
}

export function campaignCap(planId: SubscriptionPlanId): number | null {
  return getPlan(planId)?.limits.maxCampaigns ?? null
}

export function clientCap(planId: SubscriptionPlanId): number {
  return getPlan(planId)?.limits.maxClientAccounts ?? 1
}
