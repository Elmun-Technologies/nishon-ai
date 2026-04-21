/**
 * Signal Bridge — agentlar uchun haqiqiy (yoki API orqali) biznes metrikalari.
 * Production: Nest `GET /signal-bridge/business/:id/state` yoki Meta Graph agregatsiyasi.
 */

export type BusinessStateSource = 'signal_bridge' | 'api_mock' | 'meta_graph'

export interface BusinessState {
  businessId: string
  roas: number
  spend: number
  purchases: number
  /** Unix ms */
  asOf: number
  source: BusinessStateSource
}

function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** API yo‘q paytda — bir xil businessId uchun barqaror mock (demo). */
export function mockBusinessState(businessId: string): BusinessState {
  const h = stableHash(businessId)
  const roas = 1.2 + (h % 90) / 50
  const spend = 200 + (h % 400)
  const purchases = 3 + (h % 20)
  return {
    businessId,
    roas: Math.round(roas * 100) / 100,
    spend,
    purchases,
    asOf: Date.now(),
    source: 'api_mock',
  }
}

function businessStateUrl(businessId: string): string {
  const path = `/api/signal-bridge/business-state?businessId=${encodeURIComponent(businessId.trim())}`
  if (typeof window !== 'undefined') return path
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  return `${origin.replace(/\/$/, '')}${path}`
}

/**
 * Agent har soat chaqiradi — real ROAS / spend / purchases.
 * Web: ichki `/api/signal-bridge/business-state` (keyinroq Nest proxy).
 */
export async function getBusinessState(businessId: string): Promise<BusinessState> {
  if (!businessId?.trim()) {
    throw new Error('businessId majburiy')
  }
  const url = businessStateUrl(businessId)
  const res = await fetch(url, { credentials: typeof window !== 'undefined' ? 'include' : 'same-origin' })
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText)
    throw new Error(`Signal Bridge: ${res.status} ${t.slice(0, 120)}`)
  }
  return (await res.json()) as BusinessState
}
