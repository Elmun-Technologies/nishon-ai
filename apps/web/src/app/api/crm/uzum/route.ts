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

export async function POST(req: Request) {
  if (!verifyCrmWebhook(req)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri JSON' }, { status: 400 })
  }
  const b = parsed.data
  const ev = appendCrmRevenue({
    phone: b.phone,
    amountUzs: b.amount,
    source: 'uzum',
    orderId: b.order_id,
    product: b.product_id,
    utmCampaign: b.utm_campaign,
  })
  const fmt = new Intl.NumberFormat('uz-UZ').format(ev.amountUzs)
  await sendCrmGroupOrder(
    `🛒 <b>Yangi to'lov (Uzum)</b>\n${ev.product ?? 'Mahsulot'} — <b>${fmt}</b> so'm\nKampaniya: <code>${ev.campaignId}</code>`,
  )
  return NextResponse.json({ ok: true, revenue: { id: ev.id, campaignId: ev.campaignId } })
}
