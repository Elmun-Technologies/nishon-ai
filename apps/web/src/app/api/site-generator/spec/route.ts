import { NextResponse } from 'next/server'
import { buildLandingSpec } from '@/lib/site-generator/generator'
import type { OnboardingBriefInput, SiteTemplateId } from '@/lib/site-generator/types'

export const runtime = 'nodejs'

/**
 * POST JSON: { onboarding: OnboardingBriefInput, templateId, locale? }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      onboarding?: OnboardingBriefInput
      templateId?: SiteTemplateId
      locale?: 'uz' | 'ru'
    }
    if (!body.onboarding?.productTitle?.trim()) {
      return NextResponse.json({ ok: false, message: 'productTitle majburiy' }, { status: 400 })
    }
    const templateId = body.templateId === 'course' ? 'course' : 'fashion'
    const spec = buildLandingSpec(body.onboarding, templateId, body.locale ?? 'uz')
    return NextResponse.json({ ok: true, spec })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
