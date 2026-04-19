'use client'

import { useState } from 'react'
import { Plus, Pause, Play, TrendingDown, TrendingUp, Workflow } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/use-i18n'
import { PageHeader, Button } from '@/components/ui'

export default function AutomationPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [author, setAuthor] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  const summary = [
    {
      key: 'start',
      label: t('automation.metricStart', 'Start'),
      count: 0,
      icon: Play,
      tone: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      key: 'pause',
      label: t('automation.metricPause', 'Pause'),
      count: 0,
      icon: Pause,
      tone: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    },
    {
      key: 'up',
      label: t('automation.metricBudgetUp', 'Increase budget'),
      count: 0,
      icon: TrendingUp,
      tone: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      key: 'down',
      label: t('automation.metricBudgetDown', 'Decrease budget'),
      count: 0,
      icon: TrendingDown,
      tone: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
    },
  ] as const

  return (
    <div className="space-y-5 max-w-7xl pb-8">
      <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <PageHeader
          className="mb-0 border-0 bg-transparent p-2 shadow-none"
          title={t('automation.overviewTitle', 'Automation overview')}
          subtitle={t('automation.overviewSubtitle', 'What your automations did for you — tactics, triggers, and last activity.')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => router.push('/automation/wizard')}>
                {t('automation.openWizard', 'Rule wizard')}
              </Button>
              <Button type="button" className="shadow-sm gap-1.5" onClick={() => router.push('/auto-optimization')}>
                <Plus className="h-4 w-4" />
                {t('automation.newAutomation', 'New automation')}
              </Button>
            </div>
          }
        />
      </section>

      <section className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm dark:bg-slate-900/75">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          {t('automation.summaryHeading', 'What your automations did for you')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {summary.map((m) => (
            <div
              key={m.key}
              className={`rounded-xl border p-4 flex flex-col gap-2 ${m.tone}`}
            >
              <div className="flex items-center justify-between">
                <m.icon className="h-5 w-5 opacity-90" />
                <span className="text-xs text-text-tertiary">+</span>
              </div>
              <p className="text-xs font-medium text-text-secondary">{m.label}</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{m.count}</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide">
                {t('automation.actionsTriggered', 'Actions triggered')}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-surface-2/30 dark:bg-slate-950/40 p-4">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            {t('automation.totalActionsChart', 'Total actions over time')}
          </p>
          <div className="h-40 flex items-end gap-1 px-2 border-b border-border/50 pb-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-500/15 to-violet-500/5 dark:from-violet-400/20 dark:to-transparent min-h-[4px]"
                style={{ height: `${8 + (i % 5) * 6}px` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-text-tertiary mt-1 px-1">
            <span>03/04</span>
            <span>09/04</span>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-border/70 bg-white/95 p-3 shadow-sm flex flex-wrap items-center gap-2 dark:bg-slate-900/75">
        <div className="relative flex-1 min-w-[180px]">
          <Workflow className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('automation.searchTactic', 'Search tactic')}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm outline-none focus:border-violet-500/50"
          />
        </div>
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary min-w-[140px]"
        >
          <option value="all">{t('automation.viewAllAuthors', 'View: All authors')}</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary min-w-[140px]"
        >
          <option value="all">{t('automation.showAllStatuses', 'Show: All statuses')}</option>
        </select>
      </div>

      <section className="rounded-2xl border border-dashed border-violet-300/60 bg-violet-500/[0.03] dark:border-violet-800/50 dark:bg-violet-950/20 px-6 py-14 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300 mb-4">
          <Workflow className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {t('automation.emptyTitle', 'Stop doing it manually')}
        </h3>
        <p className="text-sm text-text-tertiary max-w-md mx-auto mb-6">
          {t(
            'automation.emptyDescription',
            'Create tactics that start, pause, and scale budgets from live performance. Connect Meta and enable governed automation when you are ready.',
          )}
        </p>
        <Button type="button" onClick={() => router.push('/auto-optimization')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('automation.startAutomating', 'Start automating')}
        </Button>
      </section>
    </div>
  )
}
