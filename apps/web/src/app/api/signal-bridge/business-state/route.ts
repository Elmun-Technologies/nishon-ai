import { NextResponse } from 'next/server'
import type { BusinessState } from '@/lib/signalBridge'
import { mockBusinessState } from '@/lib/signalBridge'

export const runtime = 'nodejs'

/**
 * GET ?businessId=
 * Keyin: `process.env.API_BASE_URL` ga proxy yoki Redis/Meta agregat.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')?.trim()
  if (!businessId) {
    return NextResponse.json({ message: 'businessId kerak' }, { status: 400 })
  }

  const useMock = process.env.SIGNAL_BRIDGE_USE_MOCK !== 'false'
  if (useMock) {
    const state = mockBusinessState(businessId)
    return NextResponse.json(state)
  }

  // Production placeholder: Nest endpoint
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!base) {
    return NextResponse.json(mockBusinessState(businessId))
  }
  try {
    const upstream = await fetch(`${base.replace(/\/$/, '')}/signal-bridge/business/${encodeURIComponent(businessId)}/state`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
    if (!upstream.ok) {
      return NextResponse.json(mockBusinessState(businessId))
    }
    const data = (await upstream.json()) as BusinessState
    return NextResponse.json({ ...data, source: 'signal_bridge' as const })
  } catch {
    return NextResponse.json(mockBusinessState(businessId))
  }
}
