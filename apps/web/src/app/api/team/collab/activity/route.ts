import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendActivity, listActivity, seedWorkspaceActivityIfEmpty } from '@/lib/team-collaboration-store'

export const runtime = 'nodejs'

const postSchema = z.object({
  workspaceId: z.string().min(4).max(80),
  actorName: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
})

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ ok: false, message: 'workspaceId kerak' }, { status: 400 })
  }
  seedWorkspaceActivityIfEmpty(workspaceId)
  return NextResponse.json({ ok: true, activity: listActivity(workspaceId) })
}

export async function POST(req: Request) {
  const parsed = postSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
  }
  const a = appendActivity(parsed.data.workspaceId, parsed.data.actorName, parsed.data.message)
  return NextResponse.json({ ok: true, activity: a })
}
