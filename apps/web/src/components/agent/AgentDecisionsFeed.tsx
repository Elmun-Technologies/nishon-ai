'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bot } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { aiDecisions as aiDecisionsApi } from '@/lib/api-client'

/**
 * Live "AI Decisions Log" as a chat feed — the transparency surface. Shows,
 * in plain language with a status dot, what the agent did and why:
 *
 *   10:15  🟢  Google Ads keywords checked — weekly budget raised to $50…
 *   12:30  🟡  Instagram Reels CTR below 0.5% — new creative suggested…
 *   15:00  🔴  Telegram post spent $30 with 0 conversions — paused.
 *
 * Reads real decisions from the API. When none exist yet (fresh agent), shows
 * a clearly-labelled sample so the user understands what will stream in.
 */

interface AiDecision {
  id: string
  // Nullable server-side (informational decisions may carry no action type).
  actionType: string | null
  reason: string
  isApproved: boolean | null
  isExecuted: boolean
  createdAt: string
}

type DotStatus = 'done' | 'attention' | 'stopped'

const DOT_CLASS: Record<DotStatus, string> = {
  done: 'bg-emerald-500',
  attention: 'bg-amber-400',
  stopped: 'bg-red-500',
}

function statusOf(d: AiDecision): DotStatus {
  const a = (d.actionType ?? '').toLowerCase()
  if (a.includes('pause') || a.includes('stop') || a.includes('off')) return 'stopped'
  if (d.isApproved === null && !d.isExecuted) return 'attention'
  return 'done'
}

function hhmm(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function demoDecisions(): AiDecision[] {
  const now = Date.now()
  return [
    {
      id: 'demo-1',
      actionType: 'increase_budget',
      reason:
        'Google Ads: "kiyim sotib olish" keyword CPC is low — weekly budget raised to $50.',
      isApproved: true,
      isExecuted: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'demo-2',
      actionType: 'refresh_creative',
      reason:
        'Instagram Reels CTR under 0.5% — a fresh-image suggestion was prepared for review.',
      isApproved: null,
      isExecuted: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 2.5).toISOString(),
    },
    {
      id: 'demo-3',
      actionType: 'pause_adset',
      reason:
        'Telegram "Kiyimlar kanali" post spent $30 with zero conversions — paused (Hard Stop-Loss).',
      isApproved: true,
      isExecuted: true,
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
  ]
}

export function AgentDecisionsFeed({ workspaceId }: { workspaceId?: string }) {
  const { t } = useI18n()
  const [items, setItems] = useState<AiDecision[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) {
      setItems(demoDecisions())
      setIsDemo(true)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    aiDecisionsApi
      .list(workspaceId)
      .then((res) => {
        if (cancelled) return
        const raw = res.data as unknown
        const list = Array.isArray(raw) ? (raw as AiDecision[]) : []
        if (list.length > 0) {
          setItems(list)
          setIsDemo(false)
        } else {
          setItems(demoDecisions())
          setIsDemo(true)
        }
      })
      .catch(() => {
        if (cancelled) return
        setItems(demoDecisions())
        setIsDemo(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const shown = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
            <Bot className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-text-primary">
            {t('agent.decisions.title', 'AI Agent — qarorlar jurnali')}
          </h2>
          {isDemo && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              {t('agent.decisions.sample', 'Namuna')}
            </span>
          )}
        </div>
        <Link
          href="/ai-decisions"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t('agent.decisions.viewAll', 'Barchasi')}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2/40" />
            ))}
          </div>
        ) : (
          shown.map((d) => {
            const status = statusOf(d)
            return (
              <div key={d.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <span className={cn('h-2.5 w-2.5 rounded-full', DOT_CLASS[status])} />
                </div>
                <div className="min-w-0 flex-1 rounded-xl bg-surface-2/40 px-3 py-2">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-text-primary">
                      {hhmm(d.createdAt)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
                      {(d.actionType ?? 'agent').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm leading-snug text-text-secondary">{d.reason}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AgentDecisionsFeed
