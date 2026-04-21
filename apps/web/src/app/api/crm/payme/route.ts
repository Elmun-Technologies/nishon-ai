import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendCrmRevenue } from '@/lib/crm-revenue-store'
import { verifyCrmWebhook } from '@/lib/crm-webhook-auth'
import { sendCrmGroupOrder } from '@/lib/telegram-bot'

export const runtime = 'nodejs'

const bodySchema = z.object({
  amount: z.number().positive(),
  phone: z.string().min(5),
  order_id: z.string().max(120).optional(),
  product_id: z.string().max(200).optional(),
  utm_campaign: z.string().max(64).optional().nullable(),
})

/**
 * Payme (yoki boshqa) to'lovi — real revenue, kampaniya (last-touch / UTM).
 * Xavfsizlik: CRM_WEBHOOK_SECRET → header x-crm-webhook-secret
 */
export async function POST(req: Request) {
  if (!verifyCrmWebhook(req)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri JSON' }, { status: 400 })
  }
  const { amount, phone, order_id, product_id, utm_campaign } = parsed.data
  const ev = appendCrmRevenue({
    phone,
    amountUzs: amount,
    source: 'payme',
    orderId: order_id,
    product: product_id,
    utmCampaign: utm_campaign,
  })
  const fmt = new Intl.NumberFormat('uz-UZ').format(ev.amountUzs)
  await sendCrmGroupOrder(
    `🛒 <b>Yangi to'lov (Payme)</b>\n${ev.product ?? 'Mahsulot'} — <b>${fmt}</b> so'm\nKampaniya: <code>${ev.campaignId}</code>\nTel: ${ev.phoneDisplay}`,
  )
  return NextResponse.json({
    ok: true,
    revenue: { id: ev.id, campaignId: ev.campaignId, userId: ev.userId, amountUzs: ev.amountUzs, real: ev.real },
  })
}
