'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowLeft,
  Brain,
  Check,
  Pause,
  Play,
  Settings2,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/lib/utils'
import { AgentAvatar } from '../_components/AgentAvatar'
import { RecommendationCard } from '../_components/RecommendationCard'
import { StatusBadge } from '../_components/StatusBadge'
import {
  ACTION_LABELS,
  DEMO_MY_AGENTS,
  VERTICAL_LABELS_AGENTS,
  formatRelativeTime,
  getPendingRecommendations,
} from '../_lib/mock-data'

export default function AgentRuntimePage() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_MY_AGENTS[0].id)
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set())

  const selected = useMemo(
    () => DEMO_MY_AGENTS.find((a) => a.id === selectedId) ?? DEMO_MY_AGENTS[0],
    [selectedId],
  )

  const pendingForSelected = useMemo(
    () =>
      selected.recent.filter(
        (r) => r.approvalStatus === 'pending' && !handledIds.has(r.id),
      ),
    [selected, handledIds],
  )

  const allRecsForSelected = useMemo(
    () => selected.recent.filter((r) => !handledIds.has(r.id)),
    [selected, handledIds],
  )

  const handleApprove = (id: string) => setHandledIds((s) => new Set(s).add(id))
  const handleReject = (id: string) => setHandledIds((s) => new Set(s).add(id))

  const totalPending = getPendingRecommendations().length

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Activity className="h-7 w-7 text-brand-mid dark:text-brand-lime" aria-hidden />
            Runtime
          </span>
        }
        subtitle={`Aktiv agentlar real vaqtda — ${totalPending} ta tavsiya sizni kutmoqda`}
        actions={
          <Link
            href="/ai-agents/mine"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Mening agentlarim
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* Left: agent list */}
        <aside className="space-y-2">
          <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
            Agentlar
          </p>
          {DEMO_MY_AGENTS.map((a) => {
            const isSelected = a.id === selectedId
            const pendingCount = a.recent.filter(
              (r) => r.approvalStatus === 'pending' && !handledIds.has(r.id),
            ).length
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  isSelected
                    ? 'border-primary/40 bg-primary/[0.06]'
                    : 'border-border bg-surface hover:bg-surface-2',
                )}
              >
                <AgentAvatar
                  emoji={a.emoji}
                  accent={a.accent}
                  size="md"
                  pulse={a.status === 'active'}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {a.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">
                    {VERTICAL_LABELS_AGENTS[a.vertical]}
                  </p>
                </div>
                {pendingCount > 0 && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </aside>

        {/* Center: selected agent detail */}
        <div className="min-w-0 space-y-4">
          {/* Agent header */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <AgentAvatar
                  emoji={selected.emoji}
                  accent={selected.accent}
                  size="xl"
                  pulse={selected.status === 'active'}
                />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-text-primary">
                    {selected.name}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {VERTICAL_LABELS_AGENTS[selected.vertical]} ·{' '}
                    {selected.source === 'platform'
                      ? 'Platforma agenti'
                      : selected.source === 'rented'
                        ? `Ijara — $${selected.monthlyCostUsd}/oy`
                        : "O'z agentim"}{' '}
                    · Boshlangan {formatRelativeTime(selected.startedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {selected.autoApprove && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <Zap className="h-3 w-3" aria-hidden />
                        Auto-approve
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {selected.status === 'active' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-2"
                  >
                    <Pause className="h-3 w-3" aria-hidden />
                    Pauza
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-2"
                  >
                    <Play className="h-3 w-3" aria-hidden />
                    Yoqish
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-2"
                >
                  <Settings2 className="h-3 w-3" aria-hidden />
                  Sozlamalar
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                  Jami foyda
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                  +${selected.impactUsd}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                  Tavsiyalar
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
                  {selected.recommendationsCount}
                </p>
                <p className="text-[11px] text-text-tertiary">
                  {selected.approvedCount} tasdiqlangan
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                  Tasdiq foizi
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
                  {selected.recommendationsCount > 0
                    ? Math.round(
                        (selected.approvedCount / selected.recommendationsCount) *
                          100,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Pending recommendations */}
          {pendingForSelected.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-text-primary">
                  Kutilayotgan tavsiyalar
                </p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                  {pendingForSelected.length} ta
                </span>
              </div>
              {pendingForSelected.map((r) => (
                <RecommendationCard
                  key={r.id}
                  rec={r}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}

          {/* Auto-approved / history */}
          {allRecsForSelected.filter(
            (r) => r.approvalStatus !== 'pending',
          ).length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-text-primary">
                Avtomatik tasdiqlar
              </p>
              {allRecsForSelected
                .filter((r) => r.approvalStatus !== 'pending')
                .map((r) => (
                  <RecommendationCard key={r.id} rec={r} compact />
                ))}
            </div>
          )}

          {allRecsForSelected.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-8 text-center">
              <Check className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <p className="mt-3 text-base font-semibold text-text-primary">
                Hozircha yangi tavsiya yo'q
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Agent kuzatuvda — yangi tavsiyalar tez orada paydo bo'ladi
              </p>
            </div>
          )}
        </div>

        {/* Right: memory + action history */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-text-tertiary" aria-hidden />
              <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
                Agent xotirasi
              </p>
            </div>
            <p className="text-xs text-text-secondary">
              Agent shu narsalarni eslab qoladi va vaqt o'tishi bilan yaxshilanadi:
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                '9:16 vertikal video format yaxshi ishlaydi',
                'Seshanba kuni CPA past — byudjet oshirish',
                'Tashkent radius 5km eng konvert qiladi',
                'Krossovka kategoriyasi — yosh 25-34 ustun',
              ].map((m) => (
                <div
                  key={m}
                  className="rounded-lg bg-surface-2/60 p-2 text-[11px] leading-relaxed text-text-secondary dark:bg-surface-elevated/30"
                >
                  💡 {m}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
              Oxirgi harakatlar
            </p>
            <div className="mt-3 space-y-2.5">
              {selected.recent.slice(0, 4).map((r) => {
                const a = ACTION_LABELS[r.action]
                return (
                  <div
                    key={r.id}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs"
                      style={{ background: `${a.color}1a`, color: a.color }}
                    >
                      {a.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">
                        {a.title}
                      </p>
                      <p className="truncate text-text-tertiary">
                        {formatRelativeTime(r.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
