'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { LaunchFlowProgress } from '@/components/launch-flow/LaunchFlowProgress'
import type { LaunchFlowState } from '@/lib/launch-flow/types'
import { loadLaunchFlowState, saveLaunchFlowState } from '@/lib/launch-flow/storage'

export default function LaunchExecuteSpecialistPage() {
  const router = useRouter()
  const [state, setState] = useState<LaunchFlowState | null>(null)

  useEffect(() => {
    const s = loadLaunchFlowState()
    if (!s?.pathLocked || s.pathChoice !== 'specialist') {
      router.replace('/launch/confirm')
      return
    }
    const running = { ...s, phase: 'running' as const }
    setState(running)
    saveLaunchFlowState(running)
  }, [router])

  if (!state) return <div className="p-8 text-text-secondary">Yuklanmoqda…</div>

  const marketplaceHref =
    '/marketplace/search?from=launch&q=' + encodeURIComponent('Meta targetolog Toshkent')

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Execution — Mutaxassis"
        subtitle="Tekshirilgan targetologni Marketplace'dan tanlang. To‘lovdan keyin BM + pixel access."
      />

      <LaunchFlowProgress step={2} />

      <div className="rounded-2xl border border-border bg-surface-1 p-6 text-center">
        <p className="text-4xl" aria-hidden>
          🧑‍💻
        </p>
        <h3 className="mt-3 text-base font-semibold text-text-primary">
          Real targetologlar Marketplace&apos;da
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Reklamangizni tajribali mutaxassisga topshiring. Marketplace&apos;da haqiqiy
          profillar, reyting va narxlar — o&apos;zingizga mosini tanlang.
        </p>
        <Link
          href={marketplaceHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-lime"
        >
          Marketplace&apos;ni ochish →
        </Link>
      </div>
    </div>
  )
}
