import { NextResponse } from 'next/server'
import { buildTrainingJobPayload } from '@/lib/ai-agents/studio/train'
import type { TargetologistAgentDraft, VerticalId } from '@/lib/ai-agents/types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TargetologistAgentDraft> & { vertical?: VerticalId }
    if (!body.name?.trim() || !body.rules?.trim()) {
      return NextResponse.json({ ok: false, message: 'name va rules majburiy' }, { status: 400 })
    }
    const draft: TargetologistAgentDraft = {
      name: body.name.trim(),
      vertical: body.vertical ?? 'ecommerce',
      campaignIds: Array.isArray(body.campaignIds) ? body.campaignIds : [],
      rules: body.rules,
      toneUz: body.toneUz?.trim() || "O'zbekcha, do'stona",
    }
    const payload = buildTrainingJobPayload(draft)
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({
      ok: true,
      jobId: `train_${Date.now()}`,
      message: "RAG + prompt job navbatga qo'yildi (~5 daqiqa MVP stub).",
      payload,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
