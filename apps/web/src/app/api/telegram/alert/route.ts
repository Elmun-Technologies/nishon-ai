import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendTelegramAlert, type TelegramAlertType } from '@/lib/telegram-bot'

export const runtime = 'nodejs'

const bodySchema = z.object({
  chatId: z.string().min(1).max(32),
  type: z.enum(['roas_drop', 'budget', 'competitor']),
  data: z
    .object({
      campaign: z.string().optional(),
      old: z.union([z.string(), z.number()]).optional(),
      new: z.union([z.string(), z.number()]).optional(),
      spent: z.number().optional(),
      budget: z.number().optional(),
      competitor: z.string().optional(),
      campaignId: z.string().optional(),
    })
    .optional()
    .default({}),
})

/**
 * Platformadan ichki alert (cron, AI, webhook).
 * Xavfsizlik: TELEGRAM_ALERT_SECRET bo‘lsa `x-telegram-alert-secret` header majburiy.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_ALERT_SECRET
  if (secret && req.headers.get('x-telegram-alert-secret') !== secret) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
  }

  const { chatId, type, data } = parsed.data
  const r = await sendTelegramAlert(chatId, type as TelegramAlertType, data ?? {})
  if (!r.ok) {
    return NextResponse.json({ ok: false, message: 'Yuborilmadi (token yoki tarmoq)' }, { status: 502 })
  }
  return NextResponse.json({ ok: true, sent: true })
}
