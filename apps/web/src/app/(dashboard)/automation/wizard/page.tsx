'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui'

type WizardStep = 1 | 2 | 3

export default function AutomationWizardPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(2)
  const [dateMode, setDateMode] = useState<'continuous' | 'range'>('continuous')

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => router.push('/automation')}>
          <ChevronLeft className="h-4 w-4" />
          {t('common.back', 'Back')}
        </Button>
        <Button type="button" size="sm" className="gap-1" onClick={() => setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s))}>
          {t('common.next', 'Next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <h1 className="text-center text-lg font-semibold text-text-primary">{t('automationWizard.setupTitle', 'Set up')}</h1>

      <div className="flex items-center justify-center gap-2 text-sm">
        {(
          [
            { n: 1 as const, label: t('automationWizard.stepPick', 'Pick') },
            { n: 2 as const, label: t('automationWizard.stepSettings', 'Settings') },
            { n: 3 as const, label: t('automationWizard.stepSummary', 'Summary') },
          ] as const
        ).map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-tertiary text-xs">»</span>}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                step === s.n
                  ? 'bg-violet-500 text-white'
                  : step > s.n
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-surface-2 text-text-tertiary border border-border'
              }`}
            >
              {step > s.n ? <Check className="h-3.5 w-3.5" /> : <span className="tabular-nums">{s.n}</span>}
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {step === 2 && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border/70 bg-white/95 dark:bg-slate-900/80 shadow-sm p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  {t('automationWizard.selectTask', 'Select the task')}
                </p>
                <p className="text-sm font-semibold text-text-primary mt-1 flex items-center gap-2">
                  {t('automationWizard.taskPause', 'Pause ad for today')}
                  <span className="inline-flex gap-1 text-text-tertiary">
                    <Pencil className="h-3.5 w-3.5 cursor-pointer hover:text-text-primary" />
                    <Trash2 className="h-3.5 w-3.5 cursor-pointer hover:text-red-500" />
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-0 rounded-xl border border-border overflow-hidden">
              <div className="w-9 shrink-0 bg-blue-500/10 border-r border-border flex flex-col items-center py-3">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 [writing-mode:vertical-rl] rotate-180">
                  AND
                </span>
              </div>
              <div className="flex-1 divide-y divide-border bg-surface-2/30 dark:bg-slate-950/30">
                {[
                  { metric: 'Outbound clicks', scope: 'Ad', op: 'Equals', val: '0' },
                  { metric: 'Amount spent', scope: 'Ad set', op: 'Greater than', val: '$ 0.75' },
                ].map((row) => (
                  <div key={row.metric} className="flex flex-wrap items-center gap-2 p-3 text-xs">
                    <select className="rounded-md border border-border bg-surface px-2 py-1.5 min-w-[140px]">
                      <option>{row.metric}</option>
                    </select>
                    <select className="rounded-md border border-border bg-surface px-2 py-1.5">
                      <option>{row.scope}</option>
                    </select>
                    <select className="rounded-md border border-border bg-surface px-2 py-1.5">
                      <option>Today</option>
                    </select>
                    <select className="rounded-md border border-border bg-surface px-2 py-1.5">
                      <option>{row.op}</option>
                    </select>
                    <input defaultValue={row.val} className="w-20 rounded-md border border-border bg-surface px-2 py-1.5 tabular-nums" />
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-dashed border-violet-500/50 py-2 text-xs font-semibold text-violet-700 dark:text-violet-200 hover:bg-violet-500/5"
            >
              + {t('automationWizard.addAction', 'Action')}
            </button>
          </section>

          <section className="rounded-2xl border border-border/70 bg-white/95 dark:bg-slate-900/80 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-text-primary">{t('automationWizard.dateSchedule', 'Date schedule')}</p>
            <p className="text-xs text-text-tertiary">{t('automationWizard.dateHint', 'Uses your ad account timezone when the rule runs.')}</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="dateMode"
                checked={dateMode === 'continuous'}
                onChange={() => setDateMode('continuous')}
                className="text-violet-600"
              />
              {t('automationWizard.runContinuously', 'Run continuously')}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="dateMode"
                checked={dateMode === 'range'}
                onChange={() => setDateMode('range')}
                className="text-violet-600"
              />
              {t('automationWizard.betweenDates', 'Between specific dates')}
            </label>
            <div className={`flex gap-2 ${dateMode !== 'range' ? 'opacity-40 pointer-events-none' : ''}`}>
              <input type="date" className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs flex-1" disabled={dateMode !== 'range'} />
              <span className="self-center text-text-tertiary">—</span>
              <input type="date" className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs flex-1" disabled={dateMode !== 'range'} />
            </div>
          </section>
        </div>
      )}

      {step !== 2 && (
        <div className="rounded-2xl border border-border/70 bg-white/95 dark:bg-slate-900/80 p-10 text-center text-sm text-text-tertiary shadow-sm">
          {step === 1
            ? t('automationWizard.pickPlaceholder', 'Pick a tactic template — connect your playbook catalog here.')
            : t('automationWizard.summaryPlaceholder', 'Summary of conditions and schedule will appear here before publish.')}
        </div>
      )}
    </div>
  )
}
