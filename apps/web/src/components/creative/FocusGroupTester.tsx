'use client'

import { useState } from 'react'
import { Sparkles, Users } from 'lucide-react'
import { aiAgent } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

type FocusResult = {
  personas: Array<{
    label: string
    clickProbability: number
    emotion: string
    objection: string
    whatWouldMakeMeClick: string
  }>
  avgClickProbability: number
  predictedCtrRange: string
  verdict: 'ready' | 'needs_work' | 'not_ready'
  topObjections: string[]
  topImprovements: string[]
  winningPersona: string | null
}

const VERDICT_META: Record<
  FocusResult['verdict'],
  { label: string; cls: string }
> = {
  ready: { label: 'Tayyor', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  needs_work: { label: "Ishlash kerak", cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  not_ready: { label: 'Tayyor emas', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
}

/**
 * Synthetic focus group — pre-test a creative against AI personas built from the
 * workspace's real audience BEFORE spending. Self-contained (own inputs), so it
 * can be dropped onto the creative scorer, the launch creative step, or the
 * image-ads flow.
 */
export function FocusGroupTester({
  defaultHeadline = '',
  defaultBody = '',
  imageBase64,
  mimeType,
}: {
  defaultHeadline?: string
  defaultBody?: string
  imageBase64?: string
  mimeType?: string
}) {
  const { currentWorkspace } = useWorkspaceStore()
  const [headline, setHeadline] = useState(defaultHeadline)
  const [body, setBody] = useState(defaultBody)
  const [cta, setCta] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<FocusResult | null>(null)

  const canRun = Boolean(headline.trim() || body.trim() || imageBase64)

  const run = async () => {
    if (!canRun) return
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await aiAgent.focusGroup({
        workspaceId: currentWorkspace?.id ?? '',
        headline: headline.trim() || undefined,
        adCopy: body.trim() || undefined,
        cta: cta.trim() || undefined,
        imageBase64,
        mimeType,
        platform: 'meta',
      })
      setResult(res.data)
    } catch (err: any) {
      const status = err?.response?.status
      setError(
        status === 503
          ? 'AI hali sozlanmagan — administrator serverda kalitni qo\'shsin.'
          : err?.response?.data?.message ||
              err?.message ||
              'Test bajarilmadi. Qayta urinib ko\'ring.',
      )
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm dark:bg-surface-elevated/70">
      <div className="mb-1 flex items-center gap-2">
        <Users className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
        <h3 className="text-base font-semibold text-text-primary">Sintetik fokus-guruh</h3>
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        Reklamani efirga chiqarmasdan, auditoriyangizdan qurilgan AI personalar test qiladi —
        bashoratli CTR va e&apos;tirozlarni ko&apos;rasiz. Pul tejaladi.
      </p>

      {!imageBase64 && (
        <div className="space-y-3">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Sarlavha (masalan: Yangi qishki krossovka — 30% chegirma)"
            className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reklama matni…"
            rows={3}
            className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
          />
          <input
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="CTA (masalan: Hozir xarid qiling)"
            className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-mid/25"
          />
        </div>
      )}

      <button
        type="button"
        onClick={run}
        disabled={running || !canRun}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-lime disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className={`h-4 w-4 ${running ? 'animate-pulse' : ''}`} aria-hidden />
        {running ? 'Test qilinmoqda…' : 'Fokus-guruhda sinab ko\'r'}
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          {/* Aggregate */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-surface-2/40 p-4">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${VERDICT_META[result.verdict].cls}`}
            >
              {VERDICT_META[result.verdict].label}
            </span>
            <div className="text-sm">
              <span className="text-text-tertiary">Bashoratli CTR (taxminiy): </span>
              <span className="font-semibold text-text-primary">{result.predictedCtrRange}</span>
            </div>
            <div className="text-sm">
              <span className="text-text-tertiary">O&apos;rtacha qiziqish: </span>
              <span className="font-semibold text-text-primary">
                {Math.round(result.avgClickProbability * 100)}%
              </span>
            </div>
            {result.winningPersona && (
              <div className="text-sm">
                <span className="text-text-tertiary">Eng qiziqqan: </span>
                <span className="font-semibold text-text-primary">{result.winningPersona}</span>
              </div>
            )}
          </div>

          {/* Personas */}
          <div className="grid gap-3 sm:grid-cols-2">
            {result.personas.map((p, i) => (
              <div key={i} className="rounded-xl border border-border/70 bg-surface p-4 dark:bg-surface-elevated/60">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">{p.label}</p>
                  <span className="shrink-0 text-sm font-bold text-brand-mid dark:text-brand-lime">
                    {Math.round(p.clickProbability * 100)}%
                  </span>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-mid to-brand-lime"
                    style={{ width: `${Math.round(p.clickProbability * 100)}%` }}
                  />
                </div>
                {p.emotion && <p className="text-xs text-text-secondary">💭 {p.emotion}</p>}
                {p.objection && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">⚠️ {p.objection}</p>}
                {p.whatWouldMakeMeClick && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✅ {p.whatWouldMakeMeClick}</p>
                )}
              </div>
            ))}
          </div>

          {/* Objections + improvements */}
          {(result.topObjections.length > 0 || result.topImprovements.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.topObjections.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Asosiy e&apos;tirozlar
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-text-secondary">
                    {result.topObjections.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.topImprovements.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    Tavsiya etilgan tuzatishlar
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-text-secondary">
                    {result.topImprovements.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
