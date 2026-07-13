'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Pause,
  Play,
  TrendingDown,
  TrendingUp,
  Search,
  Settings2,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Check,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
// recharts is ~90 kB gzip. Load the activity chart lazily so it code-splits out
// of the automation route bundle and only downloads when it renders.
const AutomationActivityChart = nextDynamic(
  () => import('./_components/AutomationActivityChart'),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-lg bg-white/5" /> },
)
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button, Alert } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { triggersets as triggersetsApi, type TriggersetItem } from '@/lib/api-client'

// ─── Demo data ──────────────────────────────────────────────────────────────

type TacticRow = {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused'
  author: string
  lastRun: string | null
  actions: number
  active: boolean
}

/** Maps a TriggersetItem (API shape) to the row shape this page renders. */
function tacticFromTriggerset(ts: TriggersetItem): TacticRow {
  const status: TacticRow['status'] = !ts.enabled
    ? 'paused'
    : ts.lastRunAt
      ? 'active'
      : 'draft'
  return {
    id: ts.id,
    name: ts.name,
    status,
    author: 'Workspace',
    lastRun: ts.lastRunAt ? relativeTime(ts.lastRunAt) : null,
    actions: ts.totalFires ?? 0,
    active: ts.enabled,
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!then || Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'hozir'
  if (min < 60) return `${min} daqiqa oldin`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} soat oldin`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} kun oldin`
  return new Date(iso).toLocaleDateString()
}

function buildChartData(
  daily: Array<{ date: string; start: number; pause: number; up: number; down: number }> | null,
  locale: string,
) {
  if (!daily || daily.length === 0) return []
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'uz' ? 'uz-UZ' : 'en-US'
  return daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString(tag, { month: 'short', day: 'numeric' }),
    'Старт': d.start,
    'Пауза': d.pause,
    'Рост бюджета': d.up,
    'Снижение бюджета': d.down,
  }))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:  { label: 'Черновик',  classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  active: { label: 'Активна',   classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  paused: { label: 'На паузе',  classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
} as const

function StatusPill({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const { label, classes } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}

interface MetricCardProps {
  icon: React.ElementType
  label: string
  count: number
  trend: string
  bg: string
  iconColor: string
  active: boolean
  onClick: () => void
}

function MetricFilterCard({ icon: Icon, label, count, trend, bg, iconColor, active, onClick }: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Нажмите чтобы фильтровать"
      className={`relative group w-full text-left rounded-2xl border p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        active
          ? 'border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/20'
          : 'border-border/70 hover:border-primary/30 hover:shadow-sm'
      } ${bg}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${iconColor} bg-white/60 dark:bg-black/20`}>
          <Icon className="h-4 w-4" />
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
      </div>
      <p className="text-2xl font-bold text-text-primary tabular-nums mb-0.5">{count}</p>
      <p className="text-xs text-text-secondary font-medium leading-tight">{label}</p>
      <p className="text-[11px] text-text-tertiary mt-1.5">{trend} за неделю</p>
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-text-tertiary bg-surface-2 border border-border/60 rounded-md px-1.5 py-0.5 whitespace-nowrap">
          фильтр
        </span>
      </div>
    </button>
  )
}

interface RowMenuProps {
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function RowMenu({ onEdit, onDuplicate, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 rounded-lg hover:bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => { onEdit(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Редактировать
            </button>
            <button
              type="button"
              onClick={() => { onDuplicate(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-2 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Дублировать
            </button>
            <button
              type="button"
              onClick={() => { onDelete(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Удалить
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { t, language } = useI18n()
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<string>('all')
  const [authorFilter, setAuthorFilter]   = useState<string>('all')
  const [metricFilter, setMetricFilter]   = useState<string | null>(null)
  const [tactics, setTactics]             = useState<TacticRow[]>([])
  const [summaryData, setSummaryData]     = useState<{
    totals: { start: number; pause: number; up: number; down: number }
    trends: { start: number; pause: number; up: number; down: number }
    daily: Array<{ date: string; start: number; pause: number; up: number; down: number }>
  } | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [listRes, summaryRes] = await Promise.all([
        triggersetsApi.list(workspaceId),
        triggersetsApi.summary(workspaceId, 14).catch(() => ({ data: null } as any)),
      ])
      const list = Array.isArray(listRes.data) ? listRes.data : []
      setTactics(list.map(tacticFromTriggerset))
      setSummaryData(summaryRes.data ?? null)
    } catch (e: any) {
      setError(e?.message ?? "Avtomatizatsiya ma'lumotlarini yuklab bo'lmadi.")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  const chartData = useMemo(
    () => buildChartData(summaryData?.daily ?? null, language),
    [summaryData, language],
  )

  const formatTrend = (n: number) => (n > 0 ? `+${n}` : `${n}`)

  const summary = [
    {
      key: 'start',
      label: 'запущено кампаний',
      count: summaryData?.totals.start ?? 0,
      trend: formatTrend(summaryData?.trends.start ?? 0),
      icon: Play,
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600',
    },
    {
      key: 'pause',
      label: 'поставлено на паузу',
      count: summaryData?.totals.pause ?? 0,
      trend: formatTrend(summaryData?.trends.pause ?? 0),
      icon: Pause,
      bg: 'bg-amber-50/80 dark:bg-amber-950/30',
      iconColor: 'text-amber-600',
    },
    {
      key: 'up',
      label: 'увеличение бюджета',
      count: summaryData?.totals.up ?? 0,
      trend: formatTrend(summaryData?.trends.up ?? 0),
      icon: TrendingUp,
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-500',
    },
    {
      key: 'down',
      label: 'снижение бюджета',
      count: summaryData?.totals.down ?? 0,
      trend: formatTrend(summaryData?.trends.down ?? 0),
      icon: TrendingDown,
      bg: 'bg-orange-50/80 dark:bg-orange-950/30',
      iconColor: 'text-orange-500',
    },
  ] as const

  const filteredTactics = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tactics.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q) && !row.author.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (authorFilter !== 'all' && row.author !== authorFilter) return false
      return true
    })
  }, [search, statusFilter, authorFilter, tactics])

  const toggleTactic = useCallback(
    async (id: string) => {
      // Optimistic update so the switch feels instant, then reconcile on error.
      const before = tactics
      setTactics((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, active: !t.active, status: !t.active ? 'active' : 'paused' }
            : t,
        ),
      )
      try {
        const next = !before.find((t) => t.id === id)?.active
        await triggersetsApi.update(id, { enabled: next })
      } catch (e: any) {
        setTactics(before)
        setError(e?.message ?? "Holatni o'zgartirib bo'lmadi")
      }
    },
    [tactics],
  )

  const deleteTactic = useCallback(
    async (id: string) => {
      const before = tactics
      setTactics((prev) => prev.filter((t) => t.id !== id))
      try {
        await triggersetsApi.remove(id)
      } catch (e: any) {
        setTactics(before)
        setError(e?.message ?? "O'chirib bo'lmadi")
      }
    },
    [tactics],
  )

  const onboardingSteps = [
    { done: false, label: 'Подключите Meta Ads', action: () => router.push('/settings/meta'), cta: 'Подключить' },
    { done: false, label: 'Откройте автооптимизацию', action: () => router.push('/auto-optimization'), cta: 'Открыть' },
    { done: true,  label: 'Создайте первое правило', action: () => router.push('/automation/wizard'), cta: 'Готово' },
  ]

  return (
    <div className="space-y-5 max-w-7xl pb-8">
      {/* ── Header ── */}
      <PageHeader
        title="Обзор автоматизаций"
        subtitle="Настраивайте правила в мастере, затем применяйте политики в авто-оптимизации."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCcw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
              Yangilash
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push('/auto-optimization')}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Настройки автооптимизации
            </Button>
            <Button
              type="button"
              size="md"
              className="gap-1.5 shadow-sm"
              onClick={() => router.push('/automation/wizard')}
            >
              <Plus className="h-4 w-4" />
              Новое правило
            </Button>
          </div>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {/* ── Metric filter cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((m) => (
          <MetricFilterCard
            key={m.key}
            icon={m.icon}
            label={m.label}
            count={m.count}
            trend={m.trend}
            bg={m.bg}
            iconColor={m.iconColor}
            active={metricFilter === m.key}
            onClick={() => setMetricFilter((prev) => (prev === m.key ? null : m.key))}
          />
        ))}
      </div>

      {/* ── Stacked bar chart ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-text-primary">Всего действий по времени</p>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            {(['Старт', 'Пауза', 'Рост бюджета', 'Снижение бюджета'] as const).map((name, i) => {
              const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#f97316']
              return (
                <span key={name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: colors[i] }} />
                  {name}
                </span>
              )
            })}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-text-tertiary">
              {loading ? 'Yuklanmoqda…' : "Hali avtomatizatsiya aktiv harakati yo'q"}
            </p>
            {!loading && (
              <p className="text-xs text-text-tertiary/80">
                Qoida ishlay boshlagach, kunlik faollik bu yerda paydo bo&apos;ladi.
              </p>
            )}
          </div>
        ) : (
        <AutomationActivityChart data={chartData} />
        )}
      </Card>

      {/* ── Tactics table ── */}
      <Card>
        {/* Table toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск тактики"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface py-2 px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">Статус: Все</option>
              <option value="active">Активна</option>
              <option value="paused">На паузе</option>
              <option value="draft">Черновик</option>
            </select>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface py-2 px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">Автор: Все</option>
              <option value="Демо воркспейс">Демо воркспейс</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-tertiary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">Avtomatizatsiya qoidalari yuklanmoqda…</p>
          </div>
        ) : filteredTactics.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-surface-2 mb-4">
              <Zap className="h-8 w-8 text-text-tertiary" />
            </div>
            <p className="text-base font-semibold text-text-primary mb-1">
              {tactics.length === 0
                ? 'Нет правил автоматизации'
                : 'Filter natijasi bo\'sh'}
            </p>
            <p className="text-sm text-text-tertiary mb-4">
              {tactics.length === 0
                ? 'Создайте первое правило, чтобы автоматизировать работу с кампаниями'
                : 'Filterlarni o\'zgartirib qayta urinib ko\'ring'}
            </p>
            {tactics.length === 0 && (
              <Button type="button" onClick={() => router.push('/automation/wizard')}>
                <Plus className="h-4 w-4" />
                Создать правило
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-surface-2/60 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <tr>
                  <th className="px-4 py-3">Тактика</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Автор</th>
                  <th className="px-4 py-3">Последний запуск</th>
                  <th className="px-4 py-3 text-right">Действий</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filteredTactics.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-border/80 last:border-0 hover:bg-surface-2/40 cursor-pointer transition-colors"
                    onClick={() => router.push('/automation/wizard')}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary group-hover:text-primary transition-colors">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-text-tertiary text-xs">{row.author}</td>
                    <td className="px-4 py-3 text-text-tertiary text-xs">
                      {row.lastRun ?? <span className="text-text-tertiary/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-text-secondary">{row.actions}</td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={row.active}
                          onChange={() => toggleTactic(row.id)}
                          id={`tactic-toggle-${row.id}`}
                        />
                        <RowMenu
                          onEdit={() => router.push('/automation/wizard')}
                          onDuplicate={() => {}}
                          onDelete={() => void deleteTactic(row.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Onboarding checklist ── */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Дальше</h3>
        <div className="space-y-2 mb-6">
          {onboardingSteps.map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2/40 px-4 py-3"
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                  step.done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-border bg-surface'
                }`}
              >
                {step.done && <Check className="h-3 w-3" />}
              </div>
              <span className={`flex-1 text-sm ${step.done ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                {step.label}
              </span>
              {!step.done && (
                <button
                  type="button"
                  onClick={step.action}
                  className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
                >
                  {step.cta}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-1.5" onClick={() => router.push('/automation/wizard')}>
            <Plus className="h-4 w-4" />
            Мастер правил
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/auto-optimization')}>
            <Settings2 className="h-3.5 w-3.5" />
            Настройки автооптимизации
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/settings/meta')}>
            Подключить Meta Ads
          </Button>
        </div>
      </Card>
    </div>
  )
}
