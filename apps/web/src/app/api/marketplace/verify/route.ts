import { NextResponse } from 'next/server'

/**
 * Loyiha case ni Meta bilan tasdiqlash (stub).
 * Production: Graph insights / ad account scope tekshiruvi.
 */
export async function POST(req: Request) {
  let body: { specialistId?: string; caseId?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.specialistId || !body.caseId) {
    return NextResponse.json({ ok: false, message: 'specialistId and caseId required' }, { status: 400 })
  }
  await new Promise((r) => setTimeout(r, 450))
  return NextResponse.json({
    ok: true,
    verified: true,
    source: 'meta_graph_stub',
    specialistId: body.specialistId,
    caseId: body.caseId,
  })
}
