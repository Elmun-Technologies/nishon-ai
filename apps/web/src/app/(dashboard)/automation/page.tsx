'use client'

import { useMemo, useState } from 'react'
import { Plus, Pause, Play, TrendingDown, TrendingUp, Workflow } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

/** Sample totals until automation execution API is wired. */
const DEMO_SUMMARY = { start: 12, pause: 4, up: 7, down: 2 } as const
/** Relative action volume per day (last 14 days). */
const DEMO_SERIES = [2, 3, 2, 5, 4, 6, 3, 7, 5, 4, 8, 6, 5, 9]

function chartLabels(locale: string): string[] {
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'uz' ? 'uz-UZ' : 'en-US'
  const out: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d.toLocaleDateString(tag, { month: 'short', day: 'numeric' }))
  }
  return out
}

export default function AutomationPage() {
  const { t, language } = useI18n()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const labels = useMemo(() => chartLabels(language), [language])
  const maxBar = Math.max(...DEMO_SERIES, 1)

  const demoTactics = useMemo(
    () => [
      {
        id: '1',
        name: t('automation.sampleTactic1', 'Pause campaigns when CPA exceeds target'),
        status: t('automation.statusDraft', 'Draft'),
        author: t('automation.sampleAuthor', 'Demo workspace'),
      },
      {
        id: '2',
        name: t('automation.sampleTactic2', 'Scale top ad sets when ROAS is stable'),
        status: t('automation.statusActive', 'Active'),
        author: t('automation.sampleAuthor', 'Demo workspace'),
      },
      {
        id: '3',
        name: t('automation.sampleTactic3', 'Weekend budget guardrail'),
        status: t('automation.statusPaused', 'Paused'),
        author: t('automation.sampleAuthor', 'Demo workspace'),
      },
    ],
    [t],
  )

  const filteredTactics = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return demoTactics
    return demoTactics.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.author.toLowerCase().includes(q),
    )
  }, [search, demoTactics])

  const summary = [
    {
      key: 'start',
      label: t('automation.metricStart', 'Start'),
      count: DEMO_SUMMARY.start,
      icon: Play,
      tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      key: 'pause',
      label: t('automation.metricPause', 'Pause'),
      count: DEMO_SUMMARY.pause,
      icon: Pause,
      tone: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    },
    {
      key: 'up',
      label: t('automation.metricBudgetUp', 'Increase budget'),
      count: DEMO_SUMMARY.up,
      icon: TrendingUp,
      tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      key: 'down',
      label: t('automation.metricBudgetDown', 'Decrease budget'),
      count: DEMO_SUMMARY.down,
      icon: TrendingDown,
      tone: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
    },
  ] as const

  return (
    <div className="space-y-5 max-w-7xl pb-8">
      <PageHeader
        title={t('automation.overviewTitle', 'Automation overview')}
        subtitle={t(
          'automation.overviewSubtitle',
          'Design rules in the wizard, then apply policies under Auto-optimization.',
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push('/auto-optimization')}
            >
              {t('automation.openAutoOptimizationSettings', 'Auto-optimization settings')}
            </Button>
            <Button type="button" size="sm" className="gap-1.5 shadow-sm" onClick={() => router.push('/automation/wizard')}>
              <Plus className="h-4 w-4" />
              {t('automation.newRule', 'New rule')}
            </Button>
          </div>
        }
      />

      <Alert variant="info">{t('automation.demoNotice', 'Sample metrics until the API is connected.')}</Alert>

      <Card>
        <p className="text-sm text-text-secondary leading-relaxed">
          {t(
            'automation.flowHint',
            'Use the rule wizard to define when to start, pause, or change budgets. Use Auto-optimization to turn policies on or off for your workspace.',
          )}
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          {t('automation.summaryHeading', 'What your automations did for you')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {summary.map((m) => (
            <div key={m.key} className={`rounded-xl border p-4 flex flex-col gap-2 ${m.tone}`}>
              <div className="flex items-center justify-between">
                <m.icon className="h-5 w-5 opacity-90" />
              </div>
              <p className="text-xs font-medium text-text-secondary">{m.label}</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{m.count}</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide">
                {t('automation.actionsTriggered', 'Actions triggered')}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-4">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            {t('automation.totalActionsChart', 'Total actions over time')}
          </p>
          <div className="h-40 flex items-end gap-1 px-2 border-b border-border/50 pb-1">
            {DEMO_SERIES.map((v, i) => (
              <div
                key={i}
                className="flex-1 min-h-[6px] rounded-t bg-gradient-to-t from-primary/25 to-primary/10 dark:from-brand-lime/30 dark:to-brand-lime/10"
                style={{ height: `${Math.max(8, (v / maxBar) * 100)}%` }}
                title={`${labels[i] ?? ''}: ${v}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-text-tertiary mt-1.5 px-1">
            <span>{labels[0]}</span>
            <span>{labels[labels.length - 1]}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Workflow className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('automation.searchTactic', 'Search tactic')}
              className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <p className="text-xs text-text-tertiary sm:max-w-xs">
            {t(
              'automation.filtersHint',
              'Author and status filters will appear when tactics sync from the server.',
            )}
          </p>
        </div>

        <h3 className="mt-6 text-sm font-semibold text-text-primary">
          {t('automation.tacticsSampleTitle', 'Sample tactics')}
        </h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2/60 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-3 py-2">{t('automation.tacticName', 'Tactic')}</th>
                <th className="px-3 py-2">{t('automation.tacticStatus', 'Status')}</th>
                <th className="px-3 py-2">{t('automation.tacticAuthor', 'Author')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTactics.map((row) => (
                <tr key={row.id} className="border-b border-border/80 last:border-0 hover:bg-surface-2/40">
                  <td className="px-3 py-2.5 text-text-primary">{row.name}</td>
                  <td className="px-3 py-2.5 text-text-secondary">{row.status}</td>
                  <td className="px-3 py-2.5 text-text-tertiary">{row.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTactics.length === 0 && (
          <p className="mt-2 text-xs text-text-tertiary">{t('automation.noSearchMatches', 'No tactics match your search.')}</p>
        )}
      </Card>

      <Card>
        <h3 className="text-heading-sm font-semibold text-text-primary mb-2">
          {t('automation.nextStepsTitle', 'Next steps')}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {t(
            'automation.nextStepsBody',
            'Connect Meta, open Auto-optimization to choose how aggressive automation should be, then create your first rule in the wizard.',
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-1.5" onClick={() => router.push('/automation/wizard')}>
            <Plus className="h-4 w-4" />
            {t('automation.openWizard', 'Rule wizard')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/auto-optimization')}>
            {t('automation.openAutoOptimizationSettings', 'Auto-optimization settings')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/settings/meta')}>
            {t('reporting.connectMeta', 'Connect Meta Ads')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
