import { NextResponse } from 'next/server'
import { estimateMonthlyRevenueUsd, validateRentRequest } from '@/lib/ai-agents/store/rent'
import { DEMO_STORE_LISTINGS } from '@/lib/ai-agents/store/list'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const rent = {
      listingId: String(body.listingId ?? ''),
      businessWorkspaceId: String(body.businessWorkspaceId ?? ''),
    }
    if (!validateRentRequest(rent)) {
      return NextResponse.json({ ok: false, message: 'listingId va businessWorkspaceId kerak' }, { status: 400 })
    }
    const listing = DEMO_STORE_LISTINGS.find((l) => l.id === rent.listingId)
    if (!listing) {
      return NextResponse.json({ ok: false, message: 'Listing topilmadi' }, { status: 404 })
    }
    const rev = estimateMonthlyRevenueUsd(listing.priceMonthlyUsd)
    await new Promise((r) => setTimeout(r, 300))
    return NextResponse.json({
      ok: true,
      subscriptionId: `sub_${Date.now()}`,
      listing,
      revenueSplitMonthlyUsd: rev,
      note: 'To‘lov: Stripe / Click.uz — integratsiya keyingi bosqich.',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Xato'
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
