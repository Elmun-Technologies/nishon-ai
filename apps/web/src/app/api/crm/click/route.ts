import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendCrmRevenue } from '@/lib/crm-revenue-store'
import { verifyCrmWebhook } from '@/lib/crm-webhook-auth'
import { sendCrmGroupOrder } from '@/lib/telegram-bot'

export const runtime = 'nodejs'

const bodySchema = z.object({
  phone: z.string().min(5),
  amount: z.number().positive(),
  product_id: z.string().max(200).optional(),
  /** Eski nom (retarget sahifasi) */
  productId: z.string().max(200).optional(),
  order_id: z.string().max(120).optional(),
  utm_campaign: z.string().max(64).optional().nullable(),
})

/**
 * Click / sayt / CRM — formadan kelgan to'lov (retarget sahifasi bilan bir xil path).
 */
export async function POST(req: Request) {
  if (!verifyCrmWebhook(req)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri JSON' }, { status: 400 })
  }
  const { phone, amount, product_id, productId, order_id, utm_campaign } = parsed.data
  const product = product_id ?? productId
  const ev = appendCrmRevenue({
    phone,
    amountUzs: amount,
    source: 'click',
    orderId: order_id,
    product,
    utmCampaign: utm_campaign,
  })
  const fmt = new Intl.NumberFormat('uz-UZ').format(ev.amountUzs)
  await sendCrmGroupOrder(
    `🛒 <b>Yangi to'lov (Click)</b>\n${ev.product ?? 'Mahsulot'} — <b>${fmt}</b> so'm\nKampaniya: <code>${ev.campaignId}</code>\nTel: ${ev.phoneDisplay}`,
  )
  return NextResponse.json({ ok: true, revenue: { id: ev.id, campaignId: ev.campaignId, userId: ev.userId } })
}
