import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fulfillPendingOrder } from '@/lib/billing-orders-store'

export const runtime = 'nodejs'

const bodySchema = z.object({ orderId: z.string().min(4) })

/**
 * Demo / lokal: haqiqiy to‘lov oynasi o‘rniga tasdiq.
 * Productionda faqat webhook (yoki redirect) ishlatiladi.
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'orderId kerak' }, { status: 400 })
  }
  const txId = `demo_${Date.now()}`
  const result = fulfillPendingOrder(parsed.data.orderId, txId)
  if (!result) {
    return NextResponse.json({ ok: false, message: 'Buyurtma topilmadi yoki muddati o‘tgan' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, result })
}
