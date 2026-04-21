import { NextResponse } from 'next/server'
import { getTelegramLinkResult, isPendingToken } from '@/lib/telegram-link-store'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ ok: false, message: 'token kerak' }, { status: 400 })
  }
  const linked = getTelegramLinkResult(token)
  if (linked) {
    return NextResponse.json({ ok: true, status: 'linked' as const, chatId: linked.chatId })
  }
  if (isPendingToken(token)) {
    return NextResponse.json({ ok: true, status: 'pending' as const })
  }
  return NextResponse.json({ ok: true, status: 'missing' as const })
}
