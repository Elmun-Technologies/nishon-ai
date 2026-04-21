import { NextResponse } from 'next/server'
import { buildAudienceStoryPayload } from '@/lib/audience-story/build'

export const runtime = 'nodejs'

/**
 * Audience Story — har 24 soat yangilanish (reja); hozir mock.
 * GET ?workspaceId=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')?.trim() || 'demo'
    const payload = buildAudienceStoryPayload(workspaceId)
    return NextResponse.json({ ok: true, ...payload })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
