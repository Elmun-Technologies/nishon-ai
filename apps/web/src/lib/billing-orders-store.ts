/**
 * Serverda qisqa muddatli buyurtmalar (checkout → webhook / demo tasdiq).
 * Productionda DB + idempotency kerak.
 */

import type { SubscriptionPlanId } from '@/lib/subscription-plans'

export type BillingPaymentMethod = 'payme' | 'click' | 'uzum'

export interface PendingBillingOrder {
  planId: SubscriptionPlanId
  amountUzs: number
  method: BillingPaymentMethod
  createdAt: number
}

const TTL_MS = 60 * 60 * 1000
const orders = new Map<string, PendingBillingOrder>()

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10)
}

export function createPendingOrder(entry: Omit<PendingBillingOrder, 'createdAt'>): string {
  const id = `ord_${Date.now()}_${randomSuffix()}`
  orders.set(id, { ...entry, createdAt: Date.now() })
  prune()
  return id
}

export function getPendingOrder(orderId: string): PendingBillingOrder | null {
  prune()
  const o = orders.get(orderId)
  if (!o) return null
  if (Date.now() - o.createdAt > TTL_MS) {
    orders.delete(orderId)
    return null
  }
  return o
}

export function consumePendingOrder(orderId: string): PendingBillingOrder | null {
  const o = getPendingOrder(orderId)
  if (!o) return null
  orders.delete(orderId)
  return o
}

/** Payme CreateTransaction → PerformTransaction orqali yopiladi. */
const paymeCreates = new Map<string, { orderId: string; amountTiyin: number; time: number }>()

export function getPaymeCreate(paymeId: string) {
  prune()
  return paymeCreates.get(paymeId) ?? null
}

export function setPaymeCreate(paymeId: string, row: { orderId: string; amountTiyin: number; time: number }) {
  paymeCreates.set(paymeId, row)
}

export function deletePaymeCreate(paymeId: string) {
  paymeCreates.delete(paymeId)
}

/** Client poll: to‘lov yakunlangach natija (qisqa muddat). */
export interface BillingOrderResult {
  planId: SubscriptionPlanId
  amountUzs: number
  transactionId: string
  method: BillingPaymentMethod
}

const results = new Map<string, BillingOrderResult>()
const RESULT_TTL_MS = 30 * 60 * 1000
const resultTimes = new Map<string, number>()

export function setBillingOrderResult(orderId: string, r: BillingOrderResult) {
  results.set(orderId, r)
  resultTimes.set(orderId, Date.now())
}

export function getBillingOrderResult(orderId: string): BillingOrderResult | null {
  pruneResults()
  return results.get(orderId) ?? null
}

export function takeBillingOrderResult(orderId: string): BillingOrderResult | null {
  const r = getBillingOrderResult(orderId)
  if (r) {
    results.delete(orderId)
    resultTimes.delete(orderId)
  }
  return r
}

export function clearBillingOrderResult(orderId: string) {
  results.delete(orderId)
  resultTimes.delete(orderId)
}

/** To‘lov tasdiqlandi: pending yopiladi, client poll uchun natija yoziladi. */
export function fulfillPendingOrder(orderId: string, transactionId: string): BillingOrderResult | null {
  const o = consumePendingOrder(orderId)
  if (!o) return null
  const r: BillingOrderResult = {
    planId: o.planId,
    amountUzs: o.amountUzs,
    transactionId,
    method: o.method,
  }
  setBillingOrderResult(orderId, r)
  return r
}

function pruneResults() {
  const now = Date.now()
  for (const [k, t] of resultTimes) {
    if (now - t > RESULT_TTL_MS) {
      results.delete(k)
      resultTimes.delete(k)
    }
  }
}

function prune() {
  const now = Date.now()
  for (const [k, v] of orders) {
    if (now - v.createdAt > TTL_MS) orders.delete(k)
  }
  for (const [pid, row] of paymeCreates) {
    if (now - row.time > TTL_MS) paymeCreates.delete(pid)
  }
}
