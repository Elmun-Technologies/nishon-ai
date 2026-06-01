'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Bot,
  DollarSign,
  Plus,
  RefreshCw,
  Sparkles,
  Store,
} from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { PageHeader } from '@/components/ui/PageHeader'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { cn } from '@/lib/utils'
import { MyAgentCard } from '../_components/AgentCard'
import { DemoBanner } from '../_components/DemoBanner'
import { MetricTile } from '../_components/MetricTile'
import { RecommendationCard } from '../_components/RecommendationCard'
import { useAgents } from '../_lib/use-agents'

type Filter = 'all' | 'active' | 'paused' | 'testing'

export default function MyAgentsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const {
    agents,
    loading,
    error,
    isDemo,
    refresh,
    approve,
    reject,
    optimizing,
    optimize,
  } = useAgents()
  const [filter, setFilter] = useState<Filter>('all')

  const totalImpact = useMemo(
    () => agents.reduce((s, a) => s + a.impactUsd, 0),
    [agents],
  )
  const activeCount = useMemo(
    () => agents.filter((a) => a.status === 'active').length,
    [agents],
  )
  const approvalRate = useMemo(() => {
    const total = agents.reduce((s, a) => s + a.recommendationsCount, 0)
    const approved = agents.reduce((s, a) => s + a.approvedCount, 0)
    if (total === 0) return 0
    return Math.round((approved / total) * 100)
  }, [agents])

  const pendingRecs = useMemo(
    () =>
      agents.flatMap((a) =>
        a.recent.filter((r) => r.approvalStatus === 'pending'),
      ),
    [agents],
  )

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return agents
    return agents.filter((a) => a.status === filter)
  }, [filter, agents])

  const filterChips: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Hammasi', count: agents.length },
    { id: 'active', label: 'Aktiv', count: activeCount },
    {
      id: 'testing',
      label: 'Sinov',
      count: agents.filter((a) => a.status === 'testing').length,
    },
    {
      id: 'paused',
      label: "To'xtatilgan",
      count: agents.filter((a) => a.status === 'paused').length,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Bot className="h-7 w-7 text-brand-mid dark:text-brand-lime" aria-hidden />
            Mening agentlarim
          </span>
        }
        subtitle={
          isDemo
            ? "Demo ko'rinish — real AI tavsiyalarni olish uchun pastdagi tugmani bosing"
            : "Sizning kampaniyalaringiz uchun real AI tavsiyalar"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              aria-label="Yangilash"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden />
              Yangilash
            </button>
            {currentWorkspace?.id && (
              <button
                type="button"
                onClick={() => void optimize()}
                disabled={optimizing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime px-4 py-2 text-sm font-semibold text-brand-ink shadow-[0_4px_12px_-2px_rgba(132,204,22,0.5)] transition-all hover:brightness-105 disabled:opacity-50"
              >
                <Sparkles
                  className={cn('h-3.5 w-3.5', optimizing && 'animate-spin')}
                  aria-hidden
                />
                {optimizing ? 'AI tahlil qilmoqda…' : 'AI tahlil ishga tushirish'}
              </button>
            )}
            <Link
              href="/ai-agents/studio"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Yangi
            </Link>
            <Link
              href="/ai-agents/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2"
            >
              <Store className="h-3.5 w-3.5" aria-hidden />
              Store
            </Link>
          </div>
        }
      />

      {error && (
        <Alert variant="error">
          API xatolik: {error} — demo ma'lumotlar ko'rsatilmoqda
        </Alert>
      )}

      {isDemo && (
        <DemoBanner
          onOptimize={() => void optimize()}
          optimizing={optimizing}
          hasWorkspace={!!currentWorkspace?.id}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Aktiv agentlar"
          value={String(activeCount)}
          icon={Activity}
          accent="#16a34a"
        />
        <MetricTile
          label="Jami foyda"
          value={`+$${totalImpact.toLocaleString('uz-UZ')}`}
          icon={DollarSign}
          accent="#0284c7"
        />
        <MetricTile
          label="Tasdiq foizi"
          value={`${approvalRate}%`}
          icon={Bot}
          accent="#7c3aed"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filterChips.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                  filter === f.id
                    ? 'bg-[#1b2e06] text-white shadow-sm'
                    : 'border border-border bg-surface text-text-secondary hover:bg-surface-2',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px]',
                    filter === f.id
                      ? 'bg-white/15'
                      : 'bg-surface-2/80 text-text-tertiary',
                  )}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {loading && agents.length === 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl bg-surface-2/40"
                />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-8 text-center">
              <Bot
                className="mx-auto h-10 w-10 text-text-tertiary"
                aria-hidden
              />
              <p className="mt-3 text-base font-semibold text-text-primary">
                Bu filterda agent topilmadi
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Filterni o'zgartiring yoki yangi tahlilni ishga tushiring
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredAgents.map((a) => (
                <MyAgentCard key={a.id} agent={a} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Kutilayotgan tavsiyalar
                </p>
                <p className="text-[11px] text-text-tertiary">
                  Approve / Reject — har biri sizning tasdig'ingizni kutmoqda
                </p>
              </div>
              {pendingRecs.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  {pendingRecs.length} ta
                </span>
              )}
            </div>

            {pendingRecs.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                  <span className="text-2xl" aria-hidden>
                    ✓
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-text-primary">
                  Hammasi tasdiqlandi
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  {isDemo
                    ? 'Real tavsiyalar uchun AI tahlilni boshlang'
                    : "Yangi tavsiyalar tez orada"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRecs.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    rec={r}
                    onApprove={(id) => void approve(id)}
                    onReject={(id) => void reject(id)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
