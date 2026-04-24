'use client'

import { useMemo, useState } from 'react'
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
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_SUMMARY = { start: 12, pause: 4, up: 7, down: 2 } as const
const DEMO_TRENDS  = { start: '+3', pause: '+1', up: '+2', down: '0' } as const

function buildChartData(locale: string) {
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'uz' ? 'uz-UZ' : 'en-US'
  const starts  = [1, 2, 1, 3, 2, 3, 1, 4, 3, 2, 4, 3, 2, 4]
  const pauses  = [0, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 2, 2, 3]
  const ups     = [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2]
  const downs   = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  return starts.map((s, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return {
      date: d.toLocaleDateString(tag, { month: 'short', day: 'numeric' }),
      'Старт':             s,
      'Пауза':             pauses[i],
      'Рост бюджета':      ups[i],
      'Снижение бюджета':  downs[i],
    }
  })
}

const DEMO_TACTICS = [
  {
    id: '1',
    name: 'Пауза кампаний при CPA выше цели',
    status: 'draft' as const,
    author: 'Демо воркспейс',
    lastRun: null,
    actions: 0,
    active: false,
  },
  {
    id: '2',
    name: 'Масштабирование топ-групп при стабильном ROAS',
    status: 'active' as const,
    author: 'Демо воркспейс',
    lastRun: '2 часа назад',
    actions: 7,
    active: true,
  },
  {
    id: '3',
    name: 'Ограничение бюджета на выходные',
    status: 'paused' as const,
    author: 'Демо воркспейс',
    lastRun: '3 дня назад',
    actions: 2,
    active: false,
  },
]

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

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-900 border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-text-secondary">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
          <span>{p.name}:</span>
          <span className="font-medium text-text-primary ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { t, language } = useI18n()
  const router = useRouter()

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<string>('all')
  const [authorFilter, setAuthorFilter]   = useState<string>('all')
  const [metricFilter, setMetricFilter]   = useState<string | null>(null)
  const [tactics, setTactics]             = useState(DEMO_TACTICS)

  const chartData = useMemo(() => buildChartData(language), [language])

  const summary = [
    {
      key: 'start',
      label: 'запущено кампаний',
      count: DEMO_SUMMARY.start,
      trend: DEMO_TRENDS.start,
      icon: Play,
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600',
    },
    {
      key: 'pause',
      label: 'поставлено на паузу',
      count: DEMO_SUMMARY.pause,
      trend: DEMO_TRENDS.pause,
      icon: Pause,
      bg: 'bg-amber-50/80 dark:bg-amber-950/30',
      iconColor: 'text-amber-600',
    },
    {
      key: 'up',
      label: 'увеличение бюджета',
      count: DEMO_SUMMARY.up,
      trend: DEMO_TRENDS.up,
      icon: TrendingUp,
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
      iconColor: 'text-emerald-500',
    },
    {
      key: 'down',
      label: 'снижение бюджета',
      count: DEMO_SUMMARY.down,
      trend: DEMO_TRENDS.down,
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

  function toggleTactic(id: string) {
    setTactics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active, status: !t.active ? 'active' : 'paused' } : t)),
    )
  }

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
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" strokeOpacity={0.6} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #94a3b8)' }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #94a3b8)' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="Старт"            stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Пауза"            stackId="a" fill="#f59e0b" />
            <Bar dataKey="Рост бюджета"     stackId="a" fill="#3b82f6" />
            <Bar dataKey="Снижение бюджета" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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

        {filteredTactics.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-surface-2 mb-4">
              <Zap className="h-8 w-8 text-text-tertiary" />
            </div>
            <p className="text-base font-semibold text-text-primary mb-1">Нет правил автоматизации</p>
            <p className="text-sm text-text-tertiary mb-4">Создайте первое правило, чтобы автоматизировать работу с кампаниями</p>
            <Button type="button" onClick={() => router.push('/automation/wizard')}>
              <Plus className="h-4 w-4" />
              Создать правило
            </Button>
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
                          onDelete={() => setTactics((prev) => prev.filter((t) => t.id !== row.id))}
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
