'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LaunchFlowProgress } from '@/components/launch-flow/LaunchFlowProgress'
import { StrategyMindmap } from '@/components/launch-flow/StrategyMindmap'
import { applyBudgetToState, buildDefaultLaunchState } from '@/lib/launch-flow/strategy-sample'
import { canConfirmStrategy } from '@/lib/launch-flow/guards'
import type { LaunchFlowState, MindmapNode } from '@/lib/launch-flow/types'
import { loadLaunchFlowState, saveLaunchFlowState } from '@/lib/launch-flow/storage'
import { cn } from '@/lib/utils'

function findNode(root: MindmapNode, id: string | null): MindmapNode | null {
  if (!id) return null
  if (root.id === id) return root
  for (const ch of root.children ?? []) {
    const f = findNode(ch, id)
    if (f) return f
  }
  return null
}

export default function LaunchPreviewPage() {
  const router = useRouter()
  const [state, setState] = useState<LaunchFlowState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>('root')
  const [budgetInput, setBudgetInput] = useState('20')

  useEffect(() => {
    const existing = loadLaunchFlowState()
    if (existing?.mindmap) {
      setState(existing)
      setBudgetInput(String(existing.dailyBudgetUsd))
    } else {
      const s = buildDefaultLaunchState()
      setState(s)
      saveLaunchFlowState(s)
    }
  }, [])

  const selected = useMemo(() => (state ? findNode(state.mindmap, selectedId) : null), [state, selectedId])

  const applyBudget = () => {
    if (!state) return
    const n = Number(budgetInput.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) return
    const next = applyBudgetToState(state, n)
    setState(next)
    saveLaunchFlowState(next)
  }

  const goConfirm = () => {
    if (!state || !canConfirmStrategy(state)) return
    const next = { ...state, phase: 'preview' as const }
    saveLaunchFlowState(next)
    router.push('/launch/confirm')
  }

  if (!state) {
    return <div className="p-8 text-text-secondary">Yuklanmoqda…</div>
  }

  const canGo = canConfirmStrategy(state)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Launch — strategiya preview"
        subtitle="Meta Ads Manager ketma-ketligi: Check → Build → Launch → Monitor. Avval mindmap va muammolarni ko‘ring."
        actions={
          <Link href="/launch" className="text-sm font-medium text-primary underline">
            Klassik Launch
          </Link>
        }
      />

      <LaunchFlowProgress step={0} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <StrategyMindmap root={state.mindmap} selectedId={selectedId} onSelect={(n) => setSelectedId(n.id)} />

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface-1 p-5">
            <h3 className="text-sm font-semibold text-text-primary">Tugun tafsiloti</h3>
            {selected ? (
              <div className="mt-2 text-sm text-text-secondary">
                <p className="font-medium text-text-primary">{selected.label}</p>
                {selected.detail ? <p className="mt-2">{selected.detail}</p> : null}
                <p className="mt-2 text-xs uppercase text-text-tertiary">Status: {selected.status}</p>
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">Tugunni tanlang</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-1 p-5">
            <h3 className="text-sm font-semibold text-text-primary">Tahrirlash — kunlik budget ($)</h3>
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm dark:bg-slate-950"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <button
                type="button"
                onClick={applyBudget}
                className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-text-primary"
              >
                Qo‘llash
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-1 p-5">
            <h3 className="text-sm font-semibold text-text-primary">Tekshiruv (Step 1: Check)</h3>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary underline"
              onClick={() => {
                const next: LaunchFlowState = {
                  ...state,
                  checklist: state.checklist.map((c) =>
                    c.id === 'pixel' ? { ...c, ok: true, hint: undefined } : c,
                  ),
                }
                setState(next)
                saveLaunchFlowState(next)
              }}
            >
              Demo: pixel ulangan deb belgilash
            </button>
            <ul className="mt-3 space-y-2">
              {state.checklist.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm">
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                  )}
                  <span className={c.ok ? 'text-text-secondary' : 'text-red-600 dark:text-red-400'}>
                    {c.label}
                    {c.hint ? <span className="block text-xs text-text-tertiary">{c.hint}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!canGo}
              onClick={goConfirm}
              className={cn(
                'flex-1 rounded-2xl bg-gradient-to-r from-brand-mid to-brand-lime py-3 text-sm font-bold text-brand-ink',
                !canGo && 'cursor-not-allowed opacity-50',
              )}
            >
              Tasdiqlash → yo‘l tanlash
            </button>
          </div>
          {!canGo ? (
            <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              Pixel va budget tuzalguncha tugma faol emas (holat 5 va 6).
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
