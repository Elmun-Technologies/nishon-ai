/**
 * CRM real revenue (MVP — server xotira). Production: DB + idempotency order_id.
 */

export type CrmPaymentSource = 'payme' | 'click' | 'uzum' | 'paynet' | 'telegram' | 'sheets' | 'webhook'

export interface CrmRevenueEvent {
  id: string
  userId: string
  phoneNorm: string
  phoneDisplay: string
  campaignId: string
  amountUzs: number
  source: CrmPaymentSource
  orderId?: string
  product?: string
  real: boolean
  createdAt: string
}

const MAX = 800
const events: CrmRevenueEvent[] = []

/** Oxirgi UTM / kampaniya (last-touch, 7 kun oynasi — MVP: oxirgi yozuv). */
const lastTouchCampaign = new Map<string, { campaignId: string; at: number }>()
const TOUCH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function normalizePhone(phone: string): string {
  const t = phone.trim()
  if (t.startsWith('tg_')) return t
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('998')) return d
  if (d.length === 9 && d.startsWith('9')) return `998${d}`
  return d
}

export function syntheticUserId(phoneNorm: string) {
  return `u_${phoneNorm.slice(-10)}`
}

export function touchCampaign(phoneNorm: string, campaignId: string) {
  lastTouchCampaign.set(phoneNorm, { campaignId, at: Date.now() })
  pruneTouches()
}

function resolveCampaign(phoneNorm: string, utmCampaign?: string | null): string {
  if (utmCampaign?.trim()) return utmCampaign.trim().slice(0, 64)
  const t = lastTouchCampaign.get(phoneNorm)
  if (t && Date.now() - t.at <= TOUCH_TTL_MS) return t.campaignId
  return 'camp_ig_1'
}

function pruneTouches() {
  const now = Date.now()
  for (const [k, v] of lastTouchCampaign) {
    if (now - v.at > TOUCH_TTL_MS) lastTouchCampaign.delete(k)
  }
}

function phoneDisplay(phoneNorm: string) {
  if (phoneNorm.startsWith('tg_')) return 'Telegram'
  if (phoneNorm.length >= 12) return `+${phoneNorm.slice(0, 3)}…${phoneNorm.slice(-4)}`
  return `+${phoneNorm}`
}

export function appendCrmRevenue(input: {
  phone: string
  amountUzs: number
  source: CrmPaymentSource
  orderId?: string
  product?: string
  utmCampaign?: string | null
}): CrmRevenueEvent {
  if (input.orderId) {
    const dup = events.find((e) => e.orderId === input.orderId)
    if (dup) return dup
  }
  pruneTouches()
  const phoneNorm = normalizePhone(input.phone)
  const userId = syntheticUserId(phoneNorm)
  const campaignId = resolveCampaign(phoneNorm, input.utmCampaign)
  const ev: CrmRevenueEvent = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    phoneNorm,
    phoneDisplay: phoneDisplay(phoneNorm),
    campaignId,
    amountUzs: Math.round(input.amountUzs),
    source: input.source,
    orderId: input.orderId?.slice(0, 120),
    product: input.product?.slice(0, 200),
    real: true,
    createdAt: new Date().toISOString(),
  }
  events.unshift(ev)
  if (events.length > MAX) events.length = MAX
  lastTouchCampaign.set(phoneNorm, { campaignId, at: Date.now() })
  return ev
}

export function listCrmRevenueEvents(limit = 50): CrmRevenueEvent[] {
  return events.slice(0, limit)
}

export interface CrmTopCustomer {
  phoneDisplay: string
  phoneNorm: string
  orders: number
  ltvUzs: number
}

export interface CrmSummary {
  realRevenueUzs: number
  /** Meta purchase revenue taxminiy (MVP: CRM × koeffitsient yoki alohida yozuv bo‘lmasa). */
  metaRevenueEstimateUzs: number
  diffPctVsMeta: number | null
  eventCount: number
  topCustomers: CrmTopCustomer[]
  /** Spend taxmin — CRM ROAS uchun; MVP: realRevenue / 2.8 */
  assumedSpendUzs: number
  realRoas: number | null
}

export function getCrmSummary(metaMultiplier = 1.12): CrmSummary {
  const real = events.reduce((a, e) => a + e.amountUzs, 0)
  const metaEst = events.length ? Math.round(real * metaMultiplier) : 0
  const diffPct = metaEst > 0 ? Math.round(((real - metaEst) / metaEst) * 1000) / 10 : null
  const byPhone = new Map<string, { orders: number; ltv: number; display: string }>()
  for (const e of events) {
    const cur = byPhone.get(e.phoneNorm) ?? { orders: 0, ltv: 0, display: e.phoneDisplay }
    cur.orders += 1
    cur.ltv += e.amountUzs
    cur.display = e.phoneDisplay
    byPhone.set(e.phoneNorm, cur)
  }
  const topCustomers: CrmTopCustomer[] = [...byPhone.entries()]
    .map(([phoneNorm, v]) => ({
      phoneNorm,
      phoneDisplay: v.display,
      orders: v.orders,
      ltvUzs: v.ltv,
    }))
    .sort((a, b) => b.ltvUzs - a.ltvUzs)
    .slice(0, 5)

  const assumedSpend = real > 0 ? Math.round(real / 2.8) : 0
  const realRoas = assumedSpend > 0 ? Math.round((real / assumedSpend) * 100) / 100 : null

  return {
    realRevenueUzs: real,
    metaRevenueEstimateUzs: metaEst,
    diffPctVsMeta: diffPct,
    eventCount: events.length,
    topCustomers,
    assumedSpendUzs: assumedSpend,
    realRoas,
  }
}

/** Demo ma'lumot (bir marta). */
export function seedCrmDemoIfEmpty() {
  if (events.length > 0) return
  const a = '998901112233'
  const b = '998907776655'
  touchCampaign(a, 'camp_ig_1')
  appendCrmRevenue({ phone: a, amountUzs: 299_000, source: 'payme', orderId: 'demo_1', product: 'Krossovka' })
  appendCrmRevenue({ phone: a, amountUzs: 150_000, source: 'telegram', orderId: 'demo_2', product: 'Krossovka' })
  appendCrmRevenue({ phone: a, amountUzs: 150_000, source: 'click', orderId: 'demo_3', product: 'Krossovka' })
  touchCampaign(b, 'camp_meta_2')
  appendCrmRevenue({ phone: b, amountUzs: 280_000, source: 'uzum', orderId: 'demo_4', product: 'Kurs' })
}
