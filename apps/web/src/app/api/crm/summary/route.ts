import { NextResponse } from 'next/server'
import { getCrmSummary, seedCrmDemoIfEmpty } from '@/lib/crm-revenue-store'

export const runtime = 'nodejs'

/** Dashboard: CRM real revenue, Meta taxmin, top mijozlar. */
export async function GET() {
  seedCrmDemoIfEmpty()
  const s = getCrmSummary(1.12)
  return NextResponse.json({ ok: true, ...s })
}
