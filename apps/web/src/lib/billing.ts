/**
 * Agent ijarasi — 70% targetolog, 30% platforma.
 * Stripe Connect: pul avtomatik split.
 * Click.uz: ikki merchant ID yoki backend split hisob.
 */

import type { RevenueSplit } from '@/lib/ai-agents/types'

export const AGENT_RENTAL_SPLIT: RevenueSplit = {
  targetologistPct: 70,
  platformPct: 30,
}

export interface MoneySplitResult {
  targetologist: number
  platform: number
  currency: 'USD' | 'UZS'
}

export function splitAmount(total: number, split: RevenueSplit = AGENT_RENTAL_SPLIT): MoneySplitResult {
  const t = (total * split.targetologistPct) / 100
  const p = (total * split.platformPct) / 100
  return {
    targetologist: Math.round(t * 100) / 100,
    platform: Math.round(p * 100) / 100,
    currency: 'USD',
  }
}

export interface StripeRentalWebhookPayload {
  type: string
  data?: {
    object?: {
      id?: string
      metadata?: {
        listingId?: string
        businessWorkspaceId?: string
        targetologistConnectAccountId?: string
      }
      amount_total?: number
    }
  }
}

/** Stripe webhook: checkout.session.completed — rental aktivatsiya. */
export function parseStripeRentalActivation(payload: StripeRentalWebhookPayload): {
  ok: boolean
  listingId?: string
  businessWorkspaceId?: string
  connectAccountId?: string
  amountTotal?: number
} {
  const obj = payload.data?.object
  const md = obj?.metadata
  if (payload.type !== 'checkout.session.completed' || !md?.listingId || !md?.businessWorkspaceId) {
    return { ok: false }
  }
  return {
    ok: true,
    listingId: md.listingId,
    businessWorkspaceId: md.businessWorkspaceId,
    connectAccountId: md.targetologistConnectAccountId,
    amountTotal: obj.amount_total,
  }
}

export interface ClickRentalWebhookPayload {
  merchant_id?: string
  /** so'm */
  amount?: number
  /** sizning order id */
  merchant_trans_id?: string
  /** success / error */
  status?: string
}

/** Click.uz: to'lov muvaffaqiyatli — ijarani yoqish (merchant mapping backendda). */
export function parseClickRentalActivation(body: ClickRentalWebhookPayload): {
  ok: boolean
  merchantTransId?: string
  amountUzs?: number
} {
  if ((body.status ?? '').toLowerCase() !== 'success' || !body.merchant_trans_id) {
    return { ok: false }
  }
  return { ok: true, merchantTransId: body.merchant_trans_id, amountUzs: body.amount }
}
