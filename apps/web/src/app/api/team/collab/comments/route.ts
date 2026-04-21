import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendComment, listComments, seedCampaignCommentsIfEmpty } from '@/lib/team-collaboration-store'

export const runtime = 'nodejs'

const postSchema = z.object({
  workspaceId: z.string().min(4).max(80),
  campaignId: z.string().min(1).max(80),
  body: z.string().min(1).max(2000),
  authorName: z.string().min(1).max(120),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const workspaceId = url.searchParams.get('workspaceId')
  const campaignId = url.searchParams.get('campaignId')
  if (!workspaceId || !campaignId) {
    return NextResponse.json({ ok: false, message: 'workspaceId va campaignId kerak' }, { status: 400 })
  }
  seedCampaignCommentsIfEmpty(workspaceId, campaignId)
  return NextResponse.json({ ok: true, comments: listComments(workspaceId, campaignId) })
}

export async function POST(req: Request) {
  const parsed = postSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
  }
  const c = appendComment(parsed.data)
  return NextResponse.json({ ok: true, comment: c })
}
