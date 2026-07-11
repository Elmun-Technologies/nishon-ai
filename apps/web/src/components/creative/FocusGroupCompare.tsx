'use client'

import { useState } from 'react'
import { Sparkles, Trophy } from 'lucide-react'
import { aiAgent, type FocusGroupResult } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

type CompareResult = {
  a: FocusGroupResult
  b: FocusGroupResult
  winner: 'A' | 'B' | 'tie'
  liftPct: number
  recommendation: string
}

type Variant = { headline: string; body: string; cta: string }
const empty: Variant = { headline: '', body: '', cta: '' }

/**
 * A/B synthetic focus group — run two creatives past the same AI panel and see
 * which one earns more click-intent, with a code-computed winner + lift. Lets a
 * buyer pick the stronger creative before spending. Self-contained inputs.
 */
export function FocusGroupCompare() {
  const { currentWorkspace } = useWorkspaceStore()
  const [a, setA] = useState<Variant>(empty)
  const [b, setB] = useState<Variant>(empty)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CompareResult | null>(null)

  const filled = (v: Variant) => Boolean(v.headline.trim() || v.body.trim())
  const canRun = filled(a) && filled(b)

  const run = async () => {
    if (!canRun) return
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const toVariant = (v: Variant) => ({
        headline: v.headline.trim() || undefined,
        adCopy: v.body.trim() || undefined,
        cta: v.cta.trim() || undefined,
      })
      const res = await aiAgent.focusGroupCompare({
        workspaceId: currentWorkspace?.id ?? '',
        variantA: toVariant(a),
        variantB: toVariant(b),
        platform: 'meta',
      })
      setResult(res.data)
    } catch (err: any) {
      const status = err?.response?.status
      setError(
        status === 503
          ? 'AI hali sozlanmagan — administrator serverda kalitni qo\'shsin.'
          : err?.response?.data?.message || err?.message || 'Taqqoslash bajarilmadi.',
      )
    } finally {
      setRunning(false)
    }
  }

  const VariantInputs = ({
    label,
    v,
    set,
  }: {
    label: string
    v: Variant
    set: (v: Variant) => void
  }) => (
    <div className="space-y-2 rounded-xl border border-border/70 bg-surface-2/40 p-3">
      <p className="text-sm font-semibold text-text-primary">Variant {label}</p>
      <input
        value={v.headline}
        onChange={(e) => set({ ...v, headline: e.target.value })}
        placeholder="Sarlavha"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
      />
      <textarea
        value={v.body}
        onChange={(e) => set({ ...v, body: e.target.value })}
        placeholder="Reklama matni"
        rows={3}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
      />
      <input
        value={v.cta}
        onChange={(e) => set({ ...v, cta: e.target.value })}
        placeholder="CTA (ixtiyoriy)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
      />
    </div>
  )

  const VariantResult = ({
    label,
    r,
    won,
  }: {
    label: string
    r: FocusGroupResult
    won: boolean
  }) => (
    <div
      className={`rounded-xl border p-4 ${
        won
          ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
          : 'border-border/70 bg-surface-2/30'
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Variant {label}</p>
        {won && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            G&apos;olib
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">
        {Math.round(r.avgClickProbability * 100)}%
      </p>
      <p className="text-xs text-text-tertiary">o&apos;rtacha qiziqish</p>
      <p className="mt-1 text-xs text-text-secondary">
        CTR (taxminiy): {r.predictedCtrRange}
      </p>
    </div>
  )

  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm dark:bg-surface-elevated/70">
      <div className="mb-1 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
        <h3 className="text-base font-semibold text-text-primary">A/B fokus-guruh</h3>
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        Ikki variantni bir xil AI auditoriyada sinang — qaysi biri ko&apos;proq qiziqish
        uyg&apos;otishini pul sarflashdan oldin biling.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <VariantInputs label="A" v={a} set={setA} />
        <VariantInputs label="B" v={b} set={setB} />
      </div>

      <button
        type="button"
        onClick={run}
        disabled={running || !canRun}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-lime disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className={`h-4 w-4 ${running ? 'animate-pulse' : ''}`} aria-hidden />
        {running ? 'Taqqoslanmoqda…' : 'A/B taqqoslash'}
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <VariantResult label="A" r={result.a} won={result.winner === 'A'} />
            <VariantResult label="B" r={result.b} won={result.winner === 'B'} />
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4 text-sm text-text-secondary">
            {result.recommendation}
          </div>
        </div>
      )}
    </div>
  )
}
