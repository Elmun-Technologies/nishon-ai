import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizePhone, touchCampaign } from '@/lib/crm-revenue-store'
import { verifyCrmWebhook } from '@/lib/crm-webhook-auth'

export const runtime = 'nodejs'

const bodySchema = z.object({
  phone: z.string().min(5),
  utm_campaign: z.string().min(1).max(64),
})

/** Landing: last-touch kampaniya (7 kun) — keyingi to'lov bilan bog'lash. */
export async function POST(req: Request) {
  if (!verifyCrmWebhook(req)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri JSON' }, { status: 400 })
  }
  const phoneNorm = normalizePhone(parsed.data.phone)
  touchCampaign(phoneNorm, parsed.data.utm_campaign)
  return NextResponse.json({ ok: true, phoneNorm, campaignId: parsed.data.utm_campaign })
}
