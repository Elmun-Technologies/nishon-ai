'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { describeExecutorSchedule, mockExecutorTick } from '@/lib/ai-agents/runtime/executor'
import { appendLearning, emptyMemory } from '@/lib/ai-agents/memory'
import { runHourlySignalAgentTick } from '@/lib/ai-agents/signalAgentLoop'
import type { HourlyTickResult } from '@/lib/ai-agents/signalAgentLoop'
import { useMemo, useState } from 'react'

export default function AgentRuntimePage() {
  const [mem] = useState(() => {
    let m = emptyMemory('biz_123')
    m = appendLearning(m, '9:16 video yaxshi')
    m = appendLearning(m, 'Seshanba kuni CPA past')
    return { ...m, rules: ["ROAS < 2 → budgetni 20% kamaytirishni tavsiya qil", 'Har tick: inson tasdiqi'] }
  })
  const tick = useMemo(() => mockExecutorTick('ag_kiyim_1'), [])
  const [signalTick, setSignalTick] = useState<HourlyTickResult | null>(null)
  const [signalLoading, setSignalLoading] = useState(false)
  const [signalErr, setSignalErr] = useState<string | null>(null)

  const runSignalDemo = async () => {
    setSignalLoading(true)
    setSignalErr(null)
    try {
      const r = await runHourlySignalAgentTick({
        businessId: 'biz_123',
        agentId: 'ag_kiyim_1',
        targetologistTelegramChatId: '000000000',
        autoApproveEnabled: true,
        autoApproveMinConfidence: 0.9,
      })
      setSignalTick(r)
    } catch (e: unknown) {
      setSignalErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSignalLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="Runtime & xotira"
        subtitle={describeExecutorSchedule()}
        actions={
          <Link href="/ai-agents" className="text-sm font-medium text-primary underline">
            ← Hub
          </Link>
        }
      />

      <div className="rounded-2xl border border-border bg-surface-1 p-5">
        <p className="text-sm font-semibold text-text-primary">Agent xotirasi (JSON)</p>
        <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-surface-2 p-4 font-mono text-xs text-text-secondary">
          {JSON.stringify(mem, null, 2)}
        </pre>
      </div>

      <div className="rounded-2xl border border-border bg-surface-1 p-5">
        <p className="text-sm font-semibold text-text-primary">Oxirgi tick (demo)</p>
        <p className="mt-1 text-xs text-text-tertiary">{tick.ranAt}</p>
        <ul className="mt-3 list-inside list-disc text-sm text-text-secondary">
          {tick.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs font-medium text-amber-700 dark:text-amber-300">
          requiresHumanApproval: {String(tick.requiresHumanApproval)} — avtomatik pause yo‘q.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-1 p-5">
        <p className="text-sm font-semibold text-text-primary">Signal Bridge + agent tick (demo)</p>
        <p className="mt-1 text-xs text-text-tertiary">
          getBusinessState → tavsiya → Telegram stub. confidence ≥ 0.9 va auto-approve: avtomatik action.
        </p>
        <button
          type="button"
          disabled={signalLoading}
          onClick={() => void runSignalDemo()}
          className="mt-3 rounded-xl bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-lime disabled:opacity-50"
        >
          {signalLoading ? '…' : 'Tick ishga tushirish'}
        </button>
        {signalErr ? <p className="mt-2 text-xs text-red-600">{signalErr}</p> : null}
        {signalTick ? (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-[11px] text-text-secondary">
            {JSON.stringify(signalTick, null, 2)}
          </pre>
        ) : null}
      </div>

      <p className="text-center text-xs text-text-tertiary">
        Stack: GPT-4o mini · Postgres + pgvector (reja) · Node cron / worker · Stripe + Click.uz
      </p>
    </div>
  )
}
