import { NextResponse } from 'next/server'
import { parseClickRentalActivation } from '@/lib/billing'

export const runtime = 'nodejs'

/** Click.uz merchant webhook (MVP). */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON emas' }, { status: 400 })
  }
  const act = parseClickRentalActivation(body as Parameters<typeof parseClickRentalActivation>[0])
  if (!act.ok) {
    return NextResponse.json({ ok: true, ignored: true })
  }
  // TODO: merchant_id bo'yicha 70/30 split log + rental activate
  return NextResponse.json({
    ok: true,
    rentalActivated: true,
    merchantTransId: act.merchantTransId,
    amountUzs: act.amountUzs,
  })
}
