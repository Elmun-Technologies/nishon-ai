import { NextResponse } from 'next/server'
import { getTelegramLinkResult, isPendingToken } from '@/lib/telegram-link-store'
import { backendLinkStatus } from '@/lib/telegram-link-backend'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ ok: false, message: 'token kerak' }, { status: 400 })
  }
  // Same-instance fast path.
  const linked = getTelegramLinkResult(token)
  if (linked) {
    return NextResponse.json({ ok: true, status: 'linked' as const, chatId: linked.chatId })
  }
  // Cross-instance: the /start webhook may have completed on another instance,
  // so check the shared backend before reporting pending/missing.
  const backendChatId = await backendLinkStatus(token)
  if (backendChatId) {
    return NextResponse.json({ ok: true, status: 'linked' as const, chatId: backendChatId })
  }
  if (isPendingToken(token)) {
    return NextResponse.json({ ok: true, status: 'pending' as const })
  }
  return NextResponse.json({ ok: true, status: 'missing' as const })
}
