'use client'

import Link from 'next/link'
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { CreativeAuditResult } from '@/lib/creative-audit/types'
import { cn } from '@/lib/utils'

function ringStyle(score: number): string {
  if (score >= 90) return 'text-emerald-500'
  if (score >= 70) return 'text-brand-mid dark:text-brand-lime'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

export function CreativeAuditScorecard({
  result,
  previewUrl,
  onReupload,
}: {
  result: CreativeAuditResult
  previewUrl: string | null
  onReupload: () => void
}) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c * (1 - result.score / 100)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface-1 p-8 md:flex-row md:items-center md:justify-center md:gap-12">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-40 w-40 rounded-2xl border border-border object-cover shadow-md md:h-48 md:w-48"
            />
          ) : null}
          <div className="flex flex-col items-center">
            <div className="relative h-32 w-32">
              <svg className="-rotate-90" width="128" height="128" viewBox="0 0 128 128" aria-hidden>
                <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
                <circle
                  cx="64"
                  cy="64"
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={c}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={ringStyle(result.score)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-text-primary">{result.score}</span>
                <span className="text-xs text-text-tertiary">/100</span>
              </div>
            </div>
            <p className="mt-4 text-center text-lg font-semibold text-text-primary">{result.bandLabelUz}</p>
            {result.usedOpenAi ? (
              <p className="mt-1 text-center text-xs text-text-tertiary">GPT-4o vision tahlili</p>
            ) : (
              <p className="mt-1 text-center text-xs text-amber-600 dark:text-amber-400">
                Demo rejim — OPENAI_API_KEY qo‘shing
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">7 ta ustun</h3>
          {result.criteria.map((row) => (
            <div key={row.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-text-primary">
                  {row.labelUz}{' '}
                  <span className="text-text-tertiary">({Math.round(row.weight * 100)}%)</span>
                </span>
                <span className="font-mono text-text-secondary">{Math.round(row.score)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    row.score >= 80 ? 'bg-emerald-500' : row.score >= 60 ? 'bg-brand-mid dark:bg-brand-lime' : 'bg-amber-500',
                  )}
                  style={{ width: `${Math.min(100, row.score)}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-text-tertiary">{row.checks}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-text-primary">Muammolar</h3>
          <ul className="mt-3 space-y-2">
            {result.issues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                {issue.severity === 'error' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                ) : issue.severity === 'warning' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                )}
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface-1 p-5">
          <h3 className="text-sm font-semibold text-text-primary">Tavsiyalar</h3>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-text-secondary">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/creative-hub/image-ads"
            className={cn(
              'inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium',
              'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink hover:opacity-95',
            )}
          >
            Creative Hub da tuzatish
          </Link>
          <Link
            href="/creative-hub/media"
            className={cn(
              'inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium',
              'bg-white/80 text-text-primary hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900',
            )}
          >
            O‘xshash yaxshi kreativlar
          </Link>
          <button
            type="button"
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2"
            onClick={onReupload}
          >
            Qayta yuklash
          </button>
        </div>
      </div>
    </div>
  )
}
