import { NextResponse } from 'next/server'
import { z } from 'zod'
import { takeTelegramLinkResult } from '@/lib/telegram-link-store'

export const runtime = 'nodejs'

const bodySchema = z.object({ token: z.string().min(4) })

/** Client chat_id ni saqlagach, serverdagi linked yozuvni olib tashlash. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  takeTelegramLinkResult(parsed.data.token)
  return NextResponse.json({ ok: true })
}
