'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Store } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type { VerticalId } from '@/lib/ai-agents/types'
import { cn } from '@/lib/utils'
import { StoreAgentCard } from '../_components/AgentCard'
import {
  DEMO_STORE_AGENTS,
  VERTICAL_LABELS_AGENTS,
} from '../_lib/mock-data'

type VerticalFilter = 'all' | VerticalId
type SortKey = 'top' | 'cheapest' | 'newest' | 'most_rented'

export default function AgentStorePage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [search, setSearch] = useState('')
  const [vertical, setVertical] = useState<VerticalFilter>('all')
  const [sort, setSort] = useState<SortKey>('top')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = [...DEMO_STORE_AGENTS]
    if (vertical !== 'all') {
      list = list.filter((a) => a.vertical === vertical)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    switch (sort) {
      case 'top':
        list.sort((a, b) => b.rating * b.rentersCount - a.rating * a.rentersCount)
        break
      case 'cheapest':
        list.sort((a, b) => a.priceMonthlyUsd - b.priceMonthlyUsd)
        break
      case 'newest':
        list.sort((a, b) => (a.status === 'testing' ? -1 : 1))
        break
      case 'most_rented':
        list.sort((a, b) => b.rentersCount - a.rentersCount)
        break
    }
    return list
  }, [search, vertical, sort])

  const rent = async (listingId: string) => {
    const wid = currentWorkspace?.id ?? 'demo_ws'
    setLoadingId(listingId)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/ai-agents/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, businessWorkspaceId: wid }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        message?: string
        revenueSplitMonthlyUsd?: { toTargetologist: number; toPlatform: number }
        listing?: { priceMonthlyUsd: number }
      }
      if (!res.ok || !j.ok) throw new Error(j.message || 'Xato')
      const rev = j.revenueSplitMonthlyUsd
      setMsg(
        `Ijara ulandi! Oyiga ~$${j.listing?.priceMonthlyUsd}: targetolog $${rev?.toTargetologist}, platforma $${rev?.toPlatform} (70/30).`,
      )
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setLoadingId(null)
    }
  }

  const verticalChips: { id: VerticalFilter; label: string }[] = [
    { id: 'all', label: 'Hammasi' },
    { id: 'ecommerce', label: VERTICAL_LABELS_AGENTS.ecommerce },
    { id: 'course', label: VERTICAL_LABELS_AGENTS.course },
    { id: 'restaurant', label: VERTICAL_LABELS_AGENTS.restaurant },
  ]

  const sortOptions: { id: SortKey; label: string }[] = [
    { id: 'top', label: 'Eng yaxshi' },
    { id: 'most_rented', label: "Ko'p ijaraga olingan" },
    { id: 'cheapest', label: 'Arzon' },
    { id: 'newest', label: 'Yangi (sinov)' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Store className="h-7 w-7 text-brand-mid dark:text-brand-lime" aria-hidden />
            Agent Store
          </span>
        }
        subtitle="Targetologlar tomonidan yaratilgan AI agentlarni ijaraga oling — 70/30 revenue share"
        actions={
          <Link
            href="/ai-agents"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Hub
          </Link>
        }
      />

      {err ? <Alert variant="error">{err}</Alert> : null}
      {msg ? <Alert variant="info">{msg}</Alert> : null}

      {/* Search + filters */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Agent nomi, muallif, tag yoki tavsif bo'yicha qidirish…"
            className="w-full rounded-xl border border-border bg-surface-2/60 py-2.5 pl-10 pr-3 text-sm placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
              Vertikal
            </p>
            <div className="flex flex-wrap gap-1.5">
              {verticalChips.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVertical(v.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    vertical === v.id
                      ? 'bg-[#1b2e06] text-white'
                      : 'border border-border bg-surface text-text-secondary hover:bg-surface-2',
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
              Tartiblash
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    sort === s.id
                      ? 'bg-[#1b2e06] text-white'
                      : 'border border-border bg-surface text-text-secondary hover:bg-surface-2',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <p className="mb-3 text-xs text-text-tertiary">
          {filtered.length} ta agent topildi
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-8 text-center">
            <Search
              className="mx-auto h-10 w-10 text-text-tertiary"
              aria-hidden
            />
            <p className="mt-3 text-base font-semibold text-text-primary">
              Bu so'rov bo'yicha agent topilmadi
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Filterlarni o'zgartiring yoki qidiruvni tozalang
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((a) => (
              <StoreAgentCard
                key={a.id}
                agent={a}
                onRent={() => void rent(a.id)}
                loading={loadingId === a.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Become a creator footer */}
      <div className="rounded-2xl border border-brand-mid/30 bg-brand-mid/[0.04] p-5 text-center dark:border-brand-lime/25 dark:bg-brand-lime/[0.04]">
        <p className="text-sm font-bold text-text-primary">
          Siz ham o'z agentingizni yaratib daromad qiling
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Studio'da agentingizni o'rgating va Store'ga qo'ying — 70% daromad sizniki
        </p>
        <Link
          href="/ai-agents/studio"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#1b2e06] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#243a12]"
        >
          Studio'ni ochish
        </Link>
      </div>
    </div>
  )
}
