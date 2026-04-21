import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listPendingApprovals, requestApproval, resolveApproval } from '@/lib/team-collaboration-store'

export const runtime = 'nodejs'

const requestSchema = z.object({
  workspaceId: z.string().min(4).max(80),
  campaignId: z.string().min(1).max(80),
  campaignName: z.string().min(1).max(200),
  requestedBy: z.string().min(1).max(120),
})

const resolveSchema = z.object({
  id: z.string().min(4),
  workspaceId: z.string().min(4).max(80),
  actorName: z.string().min(1).max(120),
  approved: z.boolean(),
})

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ ok: false, message: 'workspaceId kerak' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, pending: listPendingApprovals(workspaceId) })
}

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
  }
  const p = requestApproval(parsed.data)
  return NextResponse.json({ ok: true, pending: p })
}

export async function PATCH(req: Request) {
  const parsed = resolveSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Noto‘g‘ri so‘rov' }, { status: 400 })
  }
  const ok = resolveApproval(parsed.data.id, parsed.data.workspaceId, parsed.data.actorName, parsed.data.approved)
  if (!ok) return NextResponse.json({ ok: false, message: 'Topilmadi' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
