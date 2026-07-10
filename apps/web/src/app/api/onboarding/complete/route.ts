import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  businessType: z.enum(['shop', 'course', 'restaurant', 'service', 'other']),
  goal: z.enum(['sales', 'leads', 'awareness']),
  pixelId: z.string().max(120).nullable().optional(),
  pixelMode: z.enum(['has_pixel', 'help', 'skipped']).optional(),
  dailyBudget: z.number().int().min(50_000).max(500_000),
  telegram: z.string().max(80).optional().default(''),
  // Rich conversational-onboarding output (optional — the register flow may
  // omit it). Persisted onto workspace.aiStrategy so the Ad Launcher can
  // prefill "AI suggested" defaults instead of making the user retype it.
  cjm: z.string().max(40).optional(),
  vertical: z.string().max(40).optional(),
  geos: z.array(z.string().max(8)).max(12).optional(),
  ageRanges: z.array(z.string().max(12)).max(12).optional(),
  monthlyBudgetUzs: z.number().int().positive().max(1_000_000_000).optional(),
  allocation: z.record(z.number()).optional(),
})

/** UZS→USD — the launcher's Meta budget is in dollars (mirrors persistence.ts). */
const UZS_PER_USD = 12_500

/** Meta objective the wizard understands, derived from the onboarding goal. */
const META_OBJECTIVE_MAP: Record<string, string> = {
  sales: 'sales',
  leads: 'leads',
  awareness: 'awareness',
}

/** Parse the min/max numeric age from onboarding age-range labels (e.g. "25-34"). */
function ageBoundsFromRanges(ranges: string[] | undefined): { min: number; max: number } {
  const nums: number[] = []
  for (const r of ranges ?? []) {
    const m = r.match(/(\d+)\s*-\s*(\d+)/)
    if (m) {
      nums.push(Number(m[1]), Number(m[2]))
    } else {
      const single = r.match(/(\d+)/)
      if (single) nums.push(Number(single[1]))
    }
  }
  if (nums.length === 0) return { min: 18, max: 65 }
  return {
    min: Math.max(13, Math.min(...nums)),
    max: Math.min(65, Math.max(...nums)),
  }
}

/**
 * Build the workspace.aiStrategy payload from the onboarding answers. Keeps the
 * raw answers plus a computed `launchDefaults` block the Ad Launcher reads to
 * prefill objective / geo / age / daily budget.
 */
function buildAiStrategy(data: z.infer<typeof bodySchema>): Record<string, unknown> | undefined {
  const hasRich =
    data.cjm || data.vertical || (data.geos && data.geos.length) || data.monthlyBudgetUzs
  if (!hasRich) return undefined

  const allocation = data.allocation ?? {}
  // Meta's share of the split (Meta Ads + the Instagram bucket both run through Meta).
  const metaSharePct = (allocation.metaAds ?? 0) + (allocation.instagram ?? 0)
  const monthlyUzs = data.monthlyBudgetUzs ?? data.dailyBudget * 30
  const metaMonthlyUzs = metaSharePct > 0 ? (monthlyUzs * metaSharePct) / 100 : monthlyUzs
  const metaDailyUsd = Math.max(5, Math.round(metaMonthlyUzs / 30 / UZS_PER_USD))
  const { min: ageMin, max: ageMax } = ageBoundsFromRanges(data.ageRanges)
  const geos = data.geos && data.geos.length ? data.geos : ['UZ']

  return {
    source: 'onboarding',
    cjm: data.cjm ?? null,
    vertical: data.vertical ?? null,
    geos,
    ageRanges: data.ageRanges ?? [],
    monthlyBudgetUzs: monthlyUzs,
    allocation,
    launchDefaults: {
      objective: META_OBJECTIVE_MAP[data.goal] ?? 'leads',
      geos,
      primaryGeo: geos[0] ?? 'UZ',
      ageMin,
      ageMax,
      dailyBudgetUsd: metaDailyUsd,
      metaSharePct,
    },
  }
}

const INDUSTRY_MAP: Record<string, string> = {
  shop: 'ecommerce',
  course: 'education',
  restaurant: 'food',
  service: 'services',
  other: 'general',
}

const NAME_MAP: Record<string, string> = {
  shop: "Do'kon biznesi",
  course: "Kurs va ta'lim",
  restaurant: 'Restoran / Kafe',
  service: 'Xizmat biznesi',
  other: 'Mening biznesim',
}

const DESCRIPTION_MAP: Record<string, string> = {
  shop: "Online va offline savdo do'konimiz mahsulot va xizmatlarini taqdim etadi",
  course: "Ta'lim kurslari va onlayn darslar orqali bilim va ko'nikmalar o'rgatamiz",
  restaurant: 'Restoran va kafe biznesimiz mijozlarga sifatli taom va xizmat taklif etadi',
  service: 'Professional xizmatlar va yechimlar bilan mijozlarimizga yordam beramiz',
  other: 'Biznesimiz mijozlarga sifatli mahsulot va xizmatlarni taqdim etadi hamda ularning ehtiyojlarini qondiradi',
}

const AUDIENCE_MAP: Record<string, string> = {
  shop: 'Online xaridorlar va mahalliy mijozlar',
  course: "Bilim olishni istagan talabalar va kattalar",
  restaurant: 'Mahalliy va atrofdagi mijozlar',
  service: 'Xizmatga muhtoj korxona va jismoniy shaxslar',
  other: 'Keng omma va potentsial mijozlar',
}

const GOAL_MAP: Record<string, string> = {
  sales: 'sales',
  leads: 'leads',
  awareness: 'awareness',
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, message: "Token yo'q — qayta login qiling" }, { status: 401 })
    }

    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Noto'g'ri ma'lumot", issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { businessType, goal, dailyBudget } = parsed.data
    const aiStrategy = buildAiStrategy(parsed.data)
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://adspectr-api.onrender.com' : 'http://localhost:3001')

    const workspaceBody = {
      name: NAME_MAP[businessType] ?? 'Mening biznesim',
      industry: INDUSTRY_MAP[businessType] ?? 'general',
      productDescription: DESCRIPTION_MAP[businessType] ?? "Sifatli mahsulot va xizmatlar taqdim etamiz, mijozlar ehtiyojini birinchi o'ringa qo'yamiz",
      targetAudience: AUDIENCE_MAP[businessType] ?? 'Keng omma va potentsial mijozlar',
      monthlyBudget: dailyBudget * 30,
      goal: GOAL_MAP[goal] ?? 'sales',
      ...(aiStrategy ? { aiStrategy } : {}),
    }

    const wsRes = await fetch(`${apiBase}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(workspaceBody),
    })

    if (!wsRes.ok) {
      const err = await wsRes.json().catch(() => ({}))
      return NextResponse.json(
        { ok: false, message: (err as { message?: string }).message ?? 'Workspace yaratishda xato' },
        { status: wsRes.status },
      )
    }

    const workspace = await wsRes.json()
    return NextResponse.json({ ok: true, workspace })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server xatosi'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
