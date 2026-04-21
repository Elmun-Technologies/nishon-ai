'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { PageHeader } from '@/components/ui/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { DEMO_STORE_LISTINGS, estimateMonthlyRevenueUsd } from '@/lib/ai-agents'
import { cn } from '@/lib/utils'

export default function AgentStorePage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const rent = async (listingId: string) => {
    const wid = currentWorkspace?.id ?? 'demo_ws'
    setLoadingId(listingId)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/ai-agents/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, businessWorkspaceId: wid }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        message?: string
        revenueSplitMonthlyUsd?: { toTargetologist: number; toPlatform: number }
        listing?: { priceMonthlyUsd: number }
      }
      if (!res.ok || !j.ok) throw new Error(j.message || 'Xato')
      const rev = j.revenueSplitMonthlyUsd
      setMsg(
        `Ijara ulandi. Oyiga ~$${j.listing?.priceMonthlyUsd}: targetolog ~$${rev?.toTargetologist}, platforma ~$${rev?.toPlatform} (70/30).`,
      )
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Agent Store"
        subtitle="Test → tasdiq → do'kon. Ijara: targetolog narxi + 70/30 revenue share (MVP stub to'lov)."
        actions={
          <Link href="/ai-agents" className="text-sm font-medium text-primary underline">
            ← Hub
          </Link>
        }
      />

      {err ? <Alert variant="error">{err}</Alert> : null}
      {msg ? <Alert variant="info">{msg}</Alert> : null}

      <div className="space-y-4">
        {DEMO_STORE_LISTINGS.map((l) => {
          const rev = estimateMonthlyRevenueUsd(l.priceMonthlyUsd)
          return (
            <div key={l.id} className="rounded-2xl border border-border bg-surface-1 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-text-primary">{l.name}</p>
                  <p className="text-xs text-text-tertiary">
                    @{l.author} · {l.vertical} · {l.status === 'testing' ? `Test: ${l.testDaysRemaining} kun` : 'Published'}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-text-primary">${l.priceMonthlyUsd}/oy</p>
                  {l.pricePerActionUsd != null ? (
                    <p className="text-xs text-text-tertiary">yoki ${l.pricePerActionUsd}/action</p>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                70/30: targetolog ~${rev.toTargetologist}, platforma ~${rev.toPlatform}
              </p>
              <button
                type="button"
                disabled={loadingId === l.id}
                onClick={() => void rent(l.id)}
                className={cn(
                  'mt-4 w-full rounded-xl border border-brand-mid/40 py-2.5 text-sm font-semibold text-brand-mid',
                  'hover:bg-brand-mid/10 dark:text-brand-lime',
                  loadingId === l.id && 'opacity-60',
                )}
              >
                {loadingId === l.id ? '…' : "Ijaraga olish (biznes)"}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
