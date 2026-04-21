import { NextResponse } from 'next/server'
import { getMockTargetologists } from '@/lib/marketplace/mock-data'

export const dynamic = 'force-dynamic'

/**
 * Keyinroq Nest `agents` / performance warehouse bilan almashtiriladi.
 * Hozircha: demo ma’lumot — UI chart va scoring uchun.
 */
export async function GET() {
  return NextResponse.json({ targetologists: getMockTargetologists() })
}
