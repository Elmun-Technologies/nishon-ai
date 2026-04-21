import { NextResponse } from 'next/server'
import { checkCampaign, DEFAULT_OPTIMIZER_PREFS, type OptimizerPreference } from '@/lib/optimizer'

export const runtime = 'nodejs'

/** Cron / worker: har 2 soat barcha active kampaniyalar uchun chaqirish (MVP). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { campaignId?: string; prefs?: Partial<OptimizerPreference> }
    if (!body.campaignId?.trim()) {
      return NextResponse.json({ ok: false, message: 'campaignId kerak' }, { status: 400 })
    }
    const prefs = { ...DEFAULT_OPTIMIZER_PREFS, ...body.prefs }
    const result = await checkCampaign(body.campaignId.trim(), prefs)
    return NextResponse.json({ ok: true, result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
