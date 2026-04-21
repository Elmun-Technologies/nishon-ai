'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { LaunchFlowProgress } from '@/components/launch-flow/LaunchFlowProgress'
import type { LaunchFlowState } from '@/lib/launch-flow/types'
import { loadLaunchFlowState, saveLaunchFlowState } from '@/lib/launch-flow/storage'
import { cn } from '@/lib/utils'

const PROFILES = [
  { id: '1', name: 'Nilufar K.', niche: 'Fashion / Meta', rate: '$50/hafta' },
  { id: '2', name: 'Jasur T.', niche: 'E-com ROAS', rate: '$50/hafta' },
  { id: '3', name: 'Dilshod A.', niche: 'Yandex + Meta', rate: '$60/hafta' },
  { id: '4', name: 'Madina S.', niche: 'Lead gen', rate: '$45/hafta' },
  { id: '5', name: 'Kamola R.', niche: 'Creative + media', rate: '$55/hafta' },
] as const

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
        subtitle="5 ta profildan tanlang. To‘lovdan keyin BM + pixel access (reja)."
        actions={
          <Link href={marketplaceHref} className="text-sm font-semibold text-primary underline">
            Marketplace ochish
          </Link>
        }
      />

      <LaunchFlowProgress step={2} />

      <div className="space-y-3">
        {PROFILES.map((p) => (
          <div
            key={p.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-1 p-4',
            )}
          >
            <div>
              <p className="font-semibold text-text-primary">{p.name}</p>
              <p className="text-xs text-text-tertiary">{p.niche}</p>
            </div>
            <span className="text-sm font-bold text-text-primary">{p.rate}</span>
            <Link
              href={marketplaceHref}
              className="rounded-xl bg-brand-ink px-3 py-1.5 text-xs font-semibold text-brand-lime"
            >
              Tanlash
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
