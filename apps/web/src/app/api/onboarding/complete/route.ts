import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  businessType: z.enum(['shop', 'course', 'restaurant', 'service', 'other']),
  goal: z.enum(['sales', 'leads', 'awareness']),
  pixelId: z.string().max(120).nullable().optional(),
  pixelMode: z.enum(['has_pixel', 'help', 'skipped']).optional(),
  /** Kunlik byudjet, so‘m */
  dailyBudget: z.number().int().min(50_000).max(500_000),
  telegram: z.string().max(80).optional().default(''),
})

/**
 * Autentifikatsiyadan keyin onboarding yakuni (DB keyin).
 * Hozircha tasdiq + struktura — workspace PATCH keyin ulash mumkin.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: 'Noto‘g‘ri ma’lumot', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: true, received: parsed.data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
