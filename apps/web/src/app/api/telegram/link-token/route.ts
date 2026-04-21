import { NextResponse } from 'next/server'
import { createTelegramLinkToken } from '@/lib/telegram-link-store'
import { telegramBotUsername } from '@/lib/telegram-bot'

export const runtime = 'nodejs'

/** Brauzer ulanish uchun yangi deep-link token. */
export async function POST() {
  const token = createTelegramLinkToken()
  const bot = telegramBotUsername()
  const deepLink = `https://t.me/${bot}?start=${encodeURIComponent(token)}`
  return NextResponse.json({ ok: true, token, deepLink, botUsername: bot })
}
