'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  LineChart as LineChartIcon,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { PerformanceChart } from '@/components/marketplace/PerformanceChart'
import { filterTargetologists } from '@/lib/marketplace/filter-targetologists'
import { calculateMarketplaceScores } from '@/lib/marketplace/scoring'
import { parseSmartMarketplaceQuery } from '@/lib/marketplace/smart-search'
import type { MarketplaceFilters, TargetologistProfile } from '@/lib/marketplace/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const defaultFilters: MarketplaceFilters = {
  niche: '',
  platform: '',
  budget: '',
  language: '',
  location: '',
  verifiedOnly: false,
  consistencyOnly: false,
  healthyAccountOnly: false,
}

export function MarketplaceLiveDiscovery() {
  const [all, setAll] = useState<TargetologistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MarketplaceFilters>(defaultFilters)
  const [smartQuery, setSmartQuery] = useState('')
  const [smartPatch, setSmartPatch] = useState<Partial<MarketplaceFilters>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chartRange, setChartRange] = useState<'30d' | '90d' | '1y'>('90d')
  const [verifyState, setVerifyState] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'err'>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/targetologists', { cache: 'no-store' })
      const json = (await res.json()) as { targetologists?: TargetologistProfile[] }
      setAll(json.targetologists ?? [])
      if (json.targetologists?.[0]) setSelectedId(json.targetologists[0].id)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () => filterTargetologists(all, filters, smartPatch),
    [all, filters, smartPatch],
  )

  const scored = useMemo(
    () => all.map((t) => ({ t, s: calculateMarketplaceScores(t) })),
    [all],
  )

  const topStable = useMemo(
    () => [...scored].sort((a, b) => b.s.stability - a.s.stability).slice(0, 3),
    [scored],
  )
  const topGrowth = useMemo(
    () => [...scored].sort((a, b) => b.s.growth - a.s.growth).slice(0, 3),
    [scored],
  )
  const rising = useMemo(
    () => scored.filter((x) => x.s.total >= 90 && x.t.accountAgeDays < 180).slice(0, 3),
    [scored],
  )
  const nicheKing = useMemo(() => {
    const kiyim = scored.filter((x) => x.t.niche.some((n) => n.includes('kiyim')))
    return kiyim.sort((a, b) => b.s.total - a.s.total)[0]
  }, [scored])

  const active = filtered.find((t) => t.id === selectedId) ?? filtered[0]

  const sliceForRange = (perf: TargetologistProfile['performance']) => {
    if (chartRange === '30d') return perf.slice(-30)
    if (chartRange === '90d') return perf.slice(-90)
    return perf
  }

  const applySmart = () => {
    setSmartPatch(parseSmartMarketplaceQuery(smartQuery))
  }

  const verifyCase = async (specialistId: string, caseId: string) => {
    const key = `${specialistId}:${caseId}`
    setVerifyState((m) => ({ ...m, [key]: 'loading' }))
    try {
      const res = await fetch('/api/marketplace/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialistId, caseId }),
      })
      if (!res.ok) throw new Error('verify failed')
      setVerifyState((m) => ({ ...m, [key]: 'ok' }))
    } catch {
      setVerifyState((m) => ({ ...m, [key]: 'err' }))
    }
  }

  return (
    <section className="border-y border-border bg-surface py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#84cc16]/40 bg-[#84cc16]/10 px-3 py-1 text-xs font-semibold text-[#3f6212] dark:text-[#d9f99d]">
              <LineChartIcon className="h-3.5 w-3.5" />
              Live performance
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              CV emas — API dan kelgan chart
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Reyting: 40% Performance + 30% Stability + 20% Growth + 10% Trust. Meta Audit verified + haqiqiy
              spend/ROAS oqimi (demo ma’lumot).
            </p>
          </div>
          <Link
            href="/marketplace/search"
            className="text-sm font-medium text-[#65a30d] underline-offset-4 hover:underline"
          >
            Keng qidiruv →
          </Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MiniRank title="Top Stable" subtitle="pastbarqarorlik" items={topStable} onPick={setSelectedId} />
          <MiniRank title="Top Growth" subtitle="o‘sish" items={topGrowth} onPick={setSelectedId} />
          <MiniRank title="Rising Stars" subtitle="90+ yangi" items={rising} onPick={setSelectedId} />
          <div className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Niche king</p>
            <p className="mt-1 text-sm text-text-secondary">kiyim</p>
            {nicheKing ? (
              <button
                type="button"
                onClick={() => setSelectedId(nicheKing.t.id)}
                className="mt-3 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-left text-sm font-semibold text-text-primary hover:border-[#84cc16]/50"
              >
                {nicheKing.t.name}
                <span className="ml-2 text-emerald-600">{nicheKing.s.total}</span>
              </button>
            ) : (
              <p className="mt-2 text-xs text-text-tertiary">—</p>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-white p-4 dark:bg-slate-950">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
              <input
                value={smartQuery}
                onChange={(e) => setSmartQuery(e.target.value)}
                placeholder='Masalan: "ayollar kiyimi 3 ROAS $2k Toshkent"'
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-400/60"
              />
            </div>
            <Button type="button" variant="secondary" className="shrink-0" onClick={applySmart}>
              AI filter
            </Button>
          </div>
          <p className="mt-2 text-xs text-text-tertiary">
            Matndan oddiy qoidalar chiqadi; keyinroq backend LLM bilan almashtiriladi.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <FilterSelect
            label="Niche"
            value={filters.niche}
            onChange={(niche) => setFilters((f) => ({ ...f, niche }))}
            options={[
              ['', 'Hammasi'],
              ['kiyim', 'Kiyim'],
              ['kurs', 'Kurs'],
              ['restoran', 'Restoran'],
              ['e-commerce', 'E-commerce'],
              ['med', 'Med'],
            ]}
          />
          <FilterSelect
            label="Budget"
            value={filters.budget}
            onChange={(budget) => setFilters((f) => ({ ...f, budget: budget as MarketplaceFilters['budget'] }))}
            options={[
              ['', 'Hammasi'],
              ['0-1k', '$0–1k'],
              ['1-5k', '$1–5k'],
              ['5k+', '$5k+'],
            ]}
          />
          <FilterSelect
            label="Platform"
            value={filters.platform}
            onChange={(platform) => setFilters((f) => ({ ...f, platform }))}
            options={[
              ['', 'Hammasi'],
              ['meta', 'Meta'],
              ['google', 'Google'],
              ['tiktok', 'TikTok'],
              ['yandex', 'Yandex'],
              ['telegram', 'Telegram'],
            ]}
          />
          <FilterSelect
            label="Til"
            value={filters.language}
            onChange={(language) => setFilters((f) => ({ ...f, language }))}
            options={[
              ['', 'Hammasi'],
              ['uz', "O'zbek"],
              ['ru', 'Rus'],
              ['en', 'Ingliz'],
            ]}
          />
          <FilterSelect
            label="Joylashuv"
            value={filters.location}
            onChange={(location) => setFilters((f) => ({ ...f, location }))}
            options={[
              ['', 'Hammasi'],
              ['Toshkent', 'Toshkent'],
              ['Samarqand', 'Samarqand'],
              ['Remote', 'Remote'],
            ]}
          />
          <div className="flex flex-col justify-end gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs">
            <ToggleRow
              label="Faqat verified"
              checked={filters.verifiedOnly}
              onChange={(v) => setFilters((f) => ({ ...f, verifiedOnly: v }))}
            />
            <ToggleRow
              label="Consistency (8 hafta ROAS≥2)"
              checked={filters.consistencyOnly}
              onChange={(v) => setFilters((f) => ({ ...f, consistencyOnly: v }))}
            />
            <ToggleRow
              label="Account health"
              checked={filters.healthyAccountOnly}
              onChange={(v) => setFilters((f) => ({ ...f, healthyAccountOnly: v }))}
            />
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-text-secondary">Yuklanmoqda…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="space-y-3 lg:max-h-[720px] lg:overflow-y-auto lg:pr-1">
              {filtered.map((t) => {
                const s = calculateMarketplaceScores(t)
                const risk =
                  (t.roasWeekOverWeekDropPct ?? 0) > 40 ||
                  (t.banHistoryMonthsAgo != null && t.banHistoryMonthsAgo < 12)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      'w-full rounded-2xl border bg-white p-4 text-left transition dark:bg-slate-950',
                      selectedId === t.id
                        ? 'border-[#84cc16] ring-2 ring-[#84cc16]/30'
                        : 'border-border hover:border-[#84cc16]/40',
                    )}
                  >
                    <div className="flex gap-3">
                      <img
                        src={t.avatar}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-full border border-border bg-surface-2 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-text-primary">{t.name}</span>
                          {t.verified ? (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                              <ShieldCheck className="h-3 w-3" />
                              Meta
                            </span>
                          ) : null}
                          {risk ? (
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label="Risk" />
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-text-tertiary">
                          {t.location} · {t.niche.join(', ')}
                        </p>
                        <div className="mt-2 h-[72px]">
                          <PerformanceChart data={t.performance.slice(-30)} height={72} compact />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-600">{s.total}</span>
                          <span className="text-text-tertiary">score</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-secondary">
                  Natija yo‘q — filtrlarni yumshating.
                </p>
              ) : null}
            </div>

            {active ? (
              <DetailPanel
                t={active}
                chartSlice={sliceForRange(active.performance)}
                chartRange={chartRange}
                onRange={setChartRange}
                onVerify={verifyCase}
                verifyState={verifyState}
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

function MiniRank({
  title,
  subtitle,
  items,
  onPick,
}: {
  title: string
  subtitle: string
  items: Array<{ t: TargetologistProfile; s: ReturnType<typeof calculateMarketplaceScores> }>
  onPick: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{title}</p>
      <p className="text-[11px] text-text-tertiary">{subtitle}</p>
      <ul className="mt-3 space-y-2">
        {items.map(({ t, s }) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className="flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-1.5 text-left text-sm hover:border-border hover:bg-surface-2"
            >
              <span className="truncate font-medium">{t.name}</span>
              <span className="shrink-0 text-emerald-600">{s.total}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-text-tertiary">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-surface px-2 py-2 text-sm text-text-primary"
      >
        {options.map(([v, lab]) => (
          <option key={v || 'all'} value={v}>
            {lab}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      <span>{label}</span>
    </label>
  )
}

function DetailPanel({
  t,
  chartSlice,
  chartRange,
  onRange,
  onVerify,
  verifyState,
}: {
  t: TargetologistProfile
  chartSlice: TargetologistProfile['performance']
  chartRange: '30d' | '90d' | '1y'
  onRange: (r: '30d' | '90d' | '1y') => void
  onVerify: (sid: string, cid: string) => void
  verifyState: Record<string, 'idle' | 'loading' | 'ok' | 'err'>
}) {
  const s = calculateMarketplaceScores(t)
  const last = chartSlice[chartSlice.length - 1]
  const riskMsg =
    (t.roasWeekOverWeekDropPct ?? 0) > 40
      ? `ROAS oxirgi haftada ~${t.roasWeekOverWeekDropPct}% tushgan`
      : t.banHistoryMonthsAgo != null
        ? `Hisob ${t.banHistoryMonthsAgo} oy oldin ban olgan`
        : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 dark:bg-slate-950">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-text-primary">{t.name}</h3>
            <p className="text-sm text-text-secondary">
              {t.location} · {t.platforms.join(', ')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <ScorePill k="Perf" v={s.performance} />
            <ScorePill k="Stab" v={s.stability} />
            <ScorePill k="Growth" v={s.growth} />
            <ScorePill k="Trust" v={s.trust} />
          </div>
        </div>

        {riskMsg ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {riskMsg}
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-2">
          {(['30d', '90d', '1y'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRange(r)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                chartRange === r
                  ? 'bg-[#84cc16] text-[#1a2e05]'
                  : 'border border-border bg-surface-2 text-text-secondary hover:bg-surface',
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="h-[300px] w-full">
          <PerformanceChart data={chartSlice} height={300} />
        </div>
        {last ? (
          <p className="mt-3 text-xs text-text-tertiary">
            Oxirgi nuqta: spend ${last.spend.toFixed(0)}, ROAS {last.roas.toFixed(2)}×, CPA{' '}
            {Math.round(last.cpa).toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 dark:bg-slate-950">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-tertiary" />
          <h4 className="font-semibold text-text-primary">Live portfolio</h4>
        </div>
        {t.portfolio.length === 0 ? (
          <p className="text-sm text-text-tertiary">Portfolio hali ulangan emas.</p>
        ) : (
          <div className="space-y-4">
            {t.portfolio.map((c) => {
              const key = `${t.id}:${c.id}`
              const st = verifyState[key] ?? 'idle'
              const imp = Math.round(((c.startCpa - c.endCpa) / c.startCpa) * 100)
              return (
                <div key={c.id} className="rounded-xl border border-border p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-text-primary">{c.client}</p>
                      <p className="text-xs text-text-tertiary">{c.niche}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={st === 'loading' || st === 'ok'}
                      onClick={() => onVerify(t.id, c.id)}
                    >
                      {st === 'loading' ? '…' : st === 'ok' ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  <div className="h-[140px]">
                    <PerformanceChart data={c.chart} height={140} />
                  </div>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
                    <div>
                      CPA: <b>{c.startCpa.toLocaleString()}</b> → <b className="text-emerald-600">{c.endCpa.toLocaleString()}</b>
                    </div>
                    <div>Spend: ${c.spend.toLocaleString()}</div>
                    <div className="text-emerald-600">-{imp}%</div>
                    <div>Kreativlar: {c.creativesUsed}</div>
                  </div>
                  {st === 'ok' ? (
                    <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Meta API tasdiqlash (demo)
                    </p>
                  ) : null}
                  {st === 'err' ? <p className="mt-2 text-xs text-red-600">Tasdiqlash xatosi</p> : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/marketplace/specialists/${t.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e293b] px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
        >
          <Search className="h-4 w-4" />
          Profil / Hire
        </Link>
        <p className="self-center text-xs text-text-tertiary">
          Keyingi bosqich: escrow, live co-pilot, AI match — backend bilan.
        </p>
      </div>
    </div>
  )
}

function ScorePill({ k, v }: { k: string; v: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-2 py-1.5">
      <p className="text-[10px] text-text-tertiary">{k}</p>
      <p className="text-sm font-bold text-text-primary">{v}</p>
    </div>
  )
}
