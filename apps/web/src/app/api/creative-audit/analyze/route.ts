import { NextResponse } from 'next/server'
import type { AuditOnboardingContext, AuditIssue, HumanAuditOverrides } from '@/lib/creative-audit/types'
import { calculateCreativeAudit } from '@/lib/creative-audit/scorer'
import { runGpt4oVisionScan } from '@/lib/creative-audit/vision'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST multipart: `file`, `width`, `height`, `onboarding` (JSON string), `overrides` (JSON string).
 * Keyinsa: Cloudinary upload (CLOUDINARY_* bo‘lsa) — hozircha stub.
 */
export async function POST(req: Request) {
  try {
    const ct = req.headers.get('content-type') || ''
    if (!ct.includes('multipart/form-data')) {
      return NextResponse.json({ ok: false, message: 'multipart/form-data kerak' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ ok: false, message: 'file majburiy' }, { status: 400 })
    }

    const width = Math.max(1, Number(form.get('width')) || 1080)
    const height = Math.max(1, Number(form.get('height')) || 1080)

    let onboarding: AuditOnboardingContext = {}
    const onRaw = form.get('onboarding')
    if (typeof onRaw === 'string' && onRaw.trim()) {
      try {
        onboarding = JSON.parse(onRaw) as AuditOnboardingContext
      } catch {
        return NextResponse.json({ ok: false, message: 'onboarding JSON noto‘g‘ri' }, { status: 400 })
      }
    }

    let overrides: HumanAuditOverrides | undefined
    const ovRaw = form.get('overrides')
    if (typeof ovRaw === 'string' && ovRaw.trim()) {
      try {
        overrides = JSON.parse(ovRaw) as HumanAuditOverrides
      } catch {
        return NextResponse.json({ ok: false, message: 'overrides JSON noto‘g‘ri' }, { status: 400 })
      }
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const base64 = buf.toString('base64')
    const mimeType = (file as File).type || 'image/jpeg'

    const audienceHint =
      onboarding.audienceAgeMin != null && onboarding.audienceAgeMax != null
        ? `${onboarding.audienceAgeMin}-${onboarding.audienceAgeMax} yosh`
        : undefined

    const visionPack = await runGpt4oVisionScan({
      base64,
      mimeType,
      audienceHint,
    })

    const extraIssues: AuditIssue[] = visionPack.issues.map((message) => ({
      severity: 'warning' as const,
      message,
    }))

    const audit = calculateCreativeAudit({
      vision: visionPack.parsed,
      technical: { width, height },
      onboarding,
      overrides,
      extraIssues,
      extraSuggestions: visionPack.suggestions,
      usedOpenAi: visionPack.usedOpenAi,
    })

    const seen = new Set<string>()
    const issuesDeduped = audit.issues.filter((i) => {
      if (seen.has(i.message)) return false
      seen.add(i.message)
      return true
    })

    return NextResponse.json({
      ok: true,
      ...audit,
      issues: issuesDeduped,
      visionRaw: visionPack.raw,
      assetId: undefined,
      assetUrl: undefined,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Tahlil xatosi'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
