import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPendingOrder } from '@/lib/billing-orders-store'
import { getPlan, uzsToPaymeTiyin } from '@/lib/subscription-plans'

export const runtime = 'nodejs'

const bodySchema = z.object({
  planId: z.enum(['starter', 'pro', 'agency']),
  method: z.enum(['payme', 'click', 'uzum']),
})

/**
 * Checkout: serverda pending order + Payme uchun summa (tiyin).
 * Real checkout URL merchant kabinetida sozlanadi.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
    }
    const plan = getPlan(parsed.data.planId)
    if (!plan) {
      return NextResponse.json({ ok: false, message: 'Plan topilmadi' }, { status: 400 })
    }
    const orderId = createPendingOrder({
      planId: parsed.data.planId,
      amountUzs: plan.priceUzs,
      method: parsed.data.method,
    })
    const amountTiyin = uzsToPaymeTiyin(plan.priceUzs)
    return NextResponse.json({
      ok: true,
      orderId,
      planId: plan.id,
      amountUzs: plan.priceUzs,
      amountTiyin,
      /** Payme Merchant API: account ichida order_id */
      paymeAccount: { order_id: orderId },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
