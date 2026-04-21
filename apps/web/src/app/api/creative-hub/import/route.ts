import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  source: z.literal('ad-library').optional(),
  referenceAd: z.string().min(1).max(200),
  headline: z.string().max(500).optional().default(''),
  primaryText: z.string().max(4000).optional().default(''),
  imageUrl: z
    .string()
    .max(2000)
    .optional()
    .refine((v) => !v || /^https:\/\//i.test(v), 'imageUrl https bo‘lishi kerak'),
  pageName: z.string().max(120).optional().default(''),
})

/**
 * Ad Library → Creative Hub: server draft tasdiqlaydi; loyiha brauzerda saqlanadi.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: 'Noto‘g‘ri so‘rov', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { referenceAd, headline, primaryText, imageUrl, pageName } = parsed.data
    const projectId = `imp-${randomUUID()}`
    const short = pageName?.trim() || referenceAd.slice(0, 28)
    const name = `Ad Library — ${short}`

    return NextResponse.json({
      ok: true,
      projectId,
      name,
      headline: headline.trim(),
      primaryText: primaryText.trim(),
      imageUrl: imageUrl?.trim() || undefined,
      referenceAd,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
