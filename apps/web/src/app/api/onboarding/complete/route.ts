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
})

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
