import { NextResponse } from 'next/server'
import { getBillingOrderResult } from '@/lib/billing-orders-store'

export const runtime = 'nodejs'

/** Client poll: to‘lov webhook yakunidan keyin. */
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId?.trim()) {
    return NextResponse.json({ ok: false, message: 'orderId kerak' }, { status: 400 })
  }
  const result = getBillingOrderResult(orderId)
  if (!result) {
    return NextResponse.json({ ok: true, status: 'pending' as const })
  }
  return NextResponse.json({ ok: true, status: 'paid' as const, result })
}
