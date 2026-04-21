import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendCrmRevenue } from '@/lib/crm-revenue-store'
import { verifyCrmWebhook } from '@/lib/crm-webhook-auth'

export const runtime = 'nodejs'

const rowSchema = z.object({
  phone: z.string(),
  amountUzs: z.number().positive(),
  order_id: z.string().optional(),
  product: z.string().optional(),
})

const bodySchema = z.object({
  rows: z.array(rowSchema).max(500),
})

/**
 * Google Sheets / Excel — kunlik sync (MVP: qatorlarni qabul qiladi).
 */
export async function POST(req: Request) {
  if (!verifyCrmWebhook(req)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri JSON' }, { status: 400 })
  }
  let n = 0
  for (const r of parsed.data.rows) {
    appendCrmRevenue({
      phone: r.phone,
      amountUzs: r.amountUzs,
      source: 'sheets',
      orderId: r.order_id,
      product: r.product,
    })
    n++
  }
  return NextResponse.json({ ok: true, imported: n })
}
