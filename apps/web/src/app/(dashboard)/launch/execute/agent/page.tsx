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

      <div className="rounded-2xl border border-dashed border-border bg-surface-2/50 p-4 font-mono text-xs text-text-secondary">
        [log] Agent: strategiya yuklandi…
        <br />
        [log] Telegram: «ROAS {state.mindmap.children?.find((c) => c.id === 'budget')?.label ?? '—'} — tasdiq?»
      </div>
    </div>
  )
}
