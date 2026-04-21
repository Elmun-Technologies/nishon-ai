import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clearBillingOrderResult } from '@/lib/billing-orders-store'

export const runtime = 'nodejs'

const bodySchema = z.object({ orderId: z.string().min(4) })

/** Client localStorage ga yozgach, serverdagi poll natijasini tozalaydi. */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  clearBillingOrderResult(parsed.data.orderId)
  return NextResponse.json({ ok: true })
}
