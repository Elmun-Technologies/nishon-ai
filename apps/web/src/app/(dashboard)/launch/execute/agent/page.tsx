'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { LaunchFlowProgress } from '@/components/launch-flow/LaunchFlowProgress'
import type { LaunchFlowState } from '@/lib/launch-flow/types'
import { loadLaunchFlowState, saveLaunchFlowState } from '@/lib/launch-flow/storage'

const STEPS = [
  { id: 'check', title: 'Step 1: Check', items: ['Pixel', 'Budget', 'Kreativ'] },
  { id: 'build', title: 'Step 2: Build', items: ['Kampaniya', 'Ad set', 'Ad'] },
  { id: 'launch', title: 'Step 3: Launch', items: ['Preview', 'Tasdiq', 'Publish'] },
  { id: 'monitor', title: 'Step 4: Monitor', items: ['Real-time', 'Agent loglari'] },
] as const

export default function LaunchExecuteAgentPage() {
  const router = useRouter()
  const [state, setState] = useState<LaunchFlowState | null>(null)

  useEffect(() => {
    const s = loadLaunchFlowState()
    if (!s?.pathLocked || s.pathChoice !== 'agent') {
      router.replace('/launch/confirm')
      return
    }
    const running = { ...s, phase: 'running' as const }
    setState(running)
    saveLaunchFlowState(running)
  }, [router])

  if (!state) return <div className="p-8 text-text-secondary">Yuklanmoqda…</div>

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Execution — Agent"
        subtitle="Human-in-loop: har tavsiya Telegram orqali tasdiq. Avtomatik pause yo‘q."
        actions={
          <Link href="/dashboard" className="text-sm text-primary underline">
            Dashboard
          </Link>
        }
      />

      <LaunchFlowProgress step={2} />

      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-text-secondary">
        Namuna — bu oqim agent bosqichlarini ko&apos;rsatadi (demo). Reklamani haqiqatan
        ishga tushirish va agentga topshirish uchun quyidagi haqiqiy sahifalardan
        foydalaning.
      </div>

      <div className="space-y-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-border bg-surface-1 p-4">
            <p className="text-xs font-bold text-text-tertiary">{i + 1}</p>
            <p className="font-semibold text-text-primary">{s.title}</p>
            <ul className="mt-2 list-inside list-disc text-sm text-text-secondary">
              {s.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/launch"
          className="flex-1 rounded-2xl bg-gradient-to-r from-brand-mid to-brand-lime py-3 text-center text-sm font-bold text-brand-ink"
        >
          Reklamani ishga tushirish (Launch)
        </Link>
        <Link
          href="/ai-agents"
          className="flex-1 rounded-2xl border border-border bg-surface-1 py-3 text-center text-sm font-semibold text-text-primary"
        >
          AI Agentga topshirish
        </Link>
      </div>
    </div>
  )
}
