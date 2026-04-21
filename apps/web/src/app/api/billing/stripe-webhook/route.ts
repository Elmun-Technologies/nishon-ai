import { NextResponse } from 'next/server'
import { parseStripeRentalActivation } from '@/lib/billing'

export const runtime = 'nodejs'

/**
 * Stripe webhook — Connect split Stripe Dashboard da sozlanadi;
 * bu yerda faqat rental metadata aktivatsiyasi (MVP log).
 */
export async function POST(req: Request) {
  // Production: stripe-signature + constructEvent with raw body
  const raw = await req.text()
  let payload: unknown
  try {
    payload = JSON.parse(raw) as unknown
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON emas' }, { status: 400 })
  }
  const act = parseStripeRentalActivation(payload as Parameters<typeof parseStripeRentalActivation>[0])
  if (!act.ok) {
    return NextResponse.json({ ok: true, ignored: true })
  }
  // TODO: DB da rental row = active
  return NextResponse.json({
    ok: true,
    rentalActivated: true,
    listingId: act.listingId,
    businessWorkspaceId: act.businessWorkspaceId,
  })
}
