'use client'

import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  Loader2,
  Rocket,
  Sparkles,
} from 'lucide-react'
import { Alert, Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AdLauncherController } from '../_lib/use-ad-launcher'
import type {
  AudiencePresetId,
  LaunchObjective,
} from '../_lib/types'

const OBJECTIVES: { id: LaunchObjective; labelKey: string; fallback: string; hintKey: string; hintFallback: string }[] = [
  { id: 'OUTCOME_SALES', labelKey: 'adLauncher.objSales', fallback: 'Sotuvlar', hintKey: 'adLauncher.objSalesHint', hintFallback: 'Konversiyaga optimizatsiya' },
  { id: 'OUTCOME_LEADS', labelKey: 'adLauncher.objLeads', fallback: 'Lidlar', hintKey: 'adLauncher.objLeadsHint', hintFallback: 'Lid forma yoki messaging' },
  { id: 'OUTCOME_TRAFFIC', labelKey: 'adLauncher.objTraffic', fallback: 'Trafik', hintKey: 'adLauncher.objTrafficHint', hintFallback: 'Saytga tashriflar' },
  { id: 'OUTCOME_ENGAGEMENT', labelKey: 'adLauncher.objEngagement', fallback: 'Engagement', hintKey: 'adLauncher.objEngagementHint', hintFallback: 'Reaksiya, izoh, ulashish' },
  { id: 'OUTCOME_AWARENESS', labelKey: 'adLauncher.objAwareness', fallback: 'Bilimdorlik', hintKey: 'adLauncher.objAwarenessHint', hintFallback: 'Erish va brendni eslab qolish' },
]

const AUDIENCE_PRESETS: { id: AudiencePresetId; labelKey: string; fallback: string; hintKey: string; hintFallback: string }[] = [
  { id: 'prospecting', labelKey: 'adLauncher.audProspecting', fallback: 'Prospecting (sovuq)', hintKey: 'adLauncher.audProspectingHint', hintFallback: 'Yangi auditoriya — keng kirish' },
  { id: 'reengagement', labelKey: 'adLauncher.audReengagement', fallback: 'Re-engagement', hintKey: 'adLauncher.audReengagementHint', hintFallback: 'Saytga kirgan, lekin xarid qilmagan' },
  { id: 'retargeting', labelKey: 'adLauncher.audRetargeting', fallback: 'Retargeting', hintKey: 'adLauncher.audRetargetingHint', hintFallback: '30 kunlik faol auditoriya' },
  { id: 'retention', labelKey: 'adLauncher.audRetention', fallback: 'Retention', hintKey: 'adLauncher.audRetentionHint', hintFallback: 'Mavjud mijozlar uchun' },
]

function launchErrorMessage(
  code: string,
  t: (key: string, fallback?: string) => string,
): string {
  switch (code) {
    case 'NO_WORKSPACE':
      return t('adLauncher.errNoWorkspace', 'Workspace topilmadi. Qaytadan login qiling.')
    case 'NO_AUDIENCE':
      return t('adLauncher.errNoAudience', 'Kamida bitta auditoriya tanlang.')
    case 'VALIDATION_FAILED':
      return t('adLauncher.errValidation', 'Konfiguratsiya validatsiyadan o\'tmadi.')
    case 'LAUNCH_FAILED':
      return t('adLauncher.errLaunch', 'Meta\'ga yuborishda xato yuz berdi.')
    case 'DEMO_LAUNCH_BLOCKED':
      return t(
        'adLauncher.errDemoBlocked',
        'Demo rejimda haqiqiy launch yoqilmagan. Bepul ro\'yxatdan o\'ting va Meta\'ni ulang.',
      )
    case 'UNEXPECTED_ERROR':
      return t('adLauncher.errGeneric', 'Kutilmagan xato.')
    default:
      return code || t('adLauncher.errGeneric', 'Kutilmagan xato.')
  }
}

export function LaunchStep({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const cfg = ctl.launchConfig
  const phase = ctl.launchPhase
  const currency = ctl.selectedAccount?.currency ?? 'USD'

  const isBusy =
    phase.state === 'creating_draft' ||
    phase.state === 'validating' ||
    phase.state === 'launching'

  const isDone = phase.state === 'success'

  const toggleAudience = (id: AudiencePresetId) => {
    const has = cfg.audiences.includes(id)
    const next = has ? cfg.audiences.filter((a) => a !== id) : [...cfg.audiences, id]
    ctl.updateLaunchConfig({ audiences: next })
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
      <header>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('adLauncher.launchTitle', '3. Ishga tushirish')}
        </h2>
        <p className="mt-0.5 text-sm text-text-tertiary">
          {t(
            'adLauncher.launchSubtitle',
            'Tanlangan reklamalar asosida yangi Meta kampaniya yaratiladi. Avval PAUSED holatda — siz Meta\'da yakuniy tasdiqlaysiz.',
          )}
        </p>
      </header>

      {/* Selected ads summary */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            {t('adLauncher.summarySelected', 'Tanlangan reklamalar')} ({ctl.selectedCampaigns.length})
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => ctl.goToStep('pick')}>
            {t('adLauncher.editSelection', 'Tahrirlash')}
          </Button>
        </div>
        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
          {ctl.selectedCampaigns.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2 py-1.5 dark:bg-surface-elevated"
            >
              <span className="truncate text-text-secondary">{c.name}</span>
              <span className="shrink-0 text-xs text-text-tertiary">{c.status}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Configure */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        {/* Objective */}
        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('adLauncher.objective', 'Maqsad')}
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OBJECTIVES.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={isBusy || isDone}
                onClick={() => ctl.updateLaunchConfig({ objective: o.id })}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-60',
                  cfg.objective === o.id
                    ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                    : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-2',
                )}
              >
                <p className="text-sm font-semibold text-text-primary">{t(o.labelKey, o.fallback)}</p>
                <p className="text-xs text-text-tertiary">{t(o.hintKey, o.hintFallback)}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Budget */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('adLauncher.budgetType', 'Byudjet rejimi')}
            </label>
            <div className="mt-2 flex gap-1 rounded-lg border border-border bg-surface-2 p-1 dark:bg-surface">
              {(['CBO', 'ABO'] as const).map((bt) => (
                <button
                  key={bt}
                  type="button"
                  disabled={isBusy || isDone}
                  onClick={() => ctl.updateLaunchConfig({ budgetType: bt })}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                    cfg.budgetType === bt
                      ? 'bg-primary text-brand-ink'
                      : 'text-text-secondary hover:bg-surface',
                  )}
                >
                  {bt}
                  <span className="ml-1 font-normal opacity-70">
                    {bt === 'CBO'
                      ? t('adLauncher.cboHint', '(kampaniya darajasida)')
                      : t('adLauncher.aboHint', '(adset darajasida)')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('adLauncher.dailyBudget', 'Kunlik byudjet')} ({currency})
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 transition-colors focus-within:border-primary/60 dark:bg-surface">
              <span className="text-text-tertiary">$</span>
              <input
                type="number"
                min={1}
                step={1}
                disabled={isBusy || isDone}
                value={cfg.dailyBudget}
                onChange={(e) =>
                  ctl.updateLaunchConfig({ dailyBudget: Math.max(1, Number(e.target.value) || 0) })
                }
                className="w-full bg-transparent text-sm tabular-nums outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              {t('adLauncher.budgetHint', 'Boshlang\'ich byudjet — keyin Meta\'da o\'zgartirishingiz mumkin.')}
            </p>
          </div>
        </section>

        {/* Audiences */}
        <section>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('adLauncher.audiences', 'Auditoriya')}
            <span className="ml-2 font-normal lowercase text-text-tertiary">
              {t('adLauncher.audiencesHint', '(birdan ko\'pini tanlash mumkin)')}
            </span>
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {AUDIENCE_PRESETS.map((a) => {
              const on = cfg.audiences.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={isBusy || isDone}
                  onClick={() => toggleAudience(a.id)}
                  className={cn(
                    'flex items-start gap-2 rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-60',
                    on
                      ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                      : 'border-border bg-surface hover:border-primary/30 hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      on ? 'border-primary bg-primary text-brand-ink' : 'border-border',
                    )}
                  >
                    {on && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">
                      {t(a.labelKey, a.fallback)}
                    </span>
                    <span className="block text-xs text-text-tertiary">{t(a.hintKey, a.hintFallback)}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              disabled={isBusy || isDone}
              checked={cfg.splitByFunnelStage}
              onChange={(e) => ctl.updateLaunchConfig({ splitByFunnelStage: e.target.checked })}
              className="rounded border-border text-primary"
            />
            {t(
              'adLauncher.splitByStage',
              'Har bir auditoriya uchun alohida adset yaratish (funnel stage bo\'yicha)',
            )}
          </label>
        </section>
      </div>

      {/* Status / feedback */}
      {phase.state === 'creating_draft' && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('adLauncher.phaseDraft', 'Launch job yaratilmoqda...')}</span>
          </div>
        </Alert>
      )}
      {phase.state === 'validating' && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('adLauncher.phaseValidate', 'Validatsiya...')}</span>
          </div>
        </Alert>
      )}
      {phase.state === 'launching' && (
        <Alert variant="info">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('adLauncher.phaseLaunch', 'Meta\'ga yuborilmoqda...')}</span>
          </div>
        </Alert>
      )}
      {phase.state === 'error' &&
        (phase.message === 'DEMO_LAUNCH_BLOCKED' ? (
          <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-50 to-amber-50/40 p-5 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-transparent">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                <Lock className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  {t('adLauncher.demoBlockedTitle', 'Demo rejimda yakuniy launch o\'chirilgan')}
                </h3>
                <p className="mt-0.5 text-sm text-amber-800/85 dark:text-amber-200/80">
                  {t(
                    'adLauncher.demoBlockedBody',
                    'Bepul ro\'yxatdan o\'ting va Meta hisobingizni ulang — keyin xuddi shu konfiguratsiya bilan haqiqiy kampaniya yaratiladi.',
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/register">
                    <Button size="sm">
                      <Sparkles className="h-4 w-4" />
                      {t('adLauncher.demoBlockedCta', 'Bepul boshlash')}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" variant="secondary">
                      {t('adLauncher.demoBlockedLogin', 'Akkauntim bor')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="error">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">
                <strong>{t('adLauncher.launchFailed', 'Ishga tushirilmadi')}: </strong>
                {launchErrorMessage(phase.message, t)}
              </span>
            </div>
          </Alert>
        ))}
      {phase.state === 'success' && (
        <div className="rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50 to-emerald-50/40 p-5 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-transparent">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                {t('adLauncher.launchSuccess', 'Kampaniya yaratildi!')}
              </h3>
              <p className="mt-0.5 text-sm text-emerald-800/85 dark:text-emerald-200/80">
                {t(
                  'adLauncher.launchSuccessHint',
                  'Meta\'da PAUSED holatda. Tasdiqlash uchun Meta Ads Manager\'ga o\'ting yoki bizning Campaigns sahifasiga.',
                )}
              </p>
              {phase.metaCampaignId && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-900 dark:text-emerald-200">
                  Meta ID: <code className="font-mono">{phase.metaCampaignId}</code>
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/campaigns">
                  <Button size="sm">
                    {t('adLauncher.viewCampaigns', 'Campaigns sahifasi')}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={ctl.resetLaunch}>
                  {t('adLauncher.startNew', 'Yangi launch')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isDone && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isBusy}
            onClick={() => ctl.goToStep('pick')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('adLauncher.backToPick', 'Tanlovga qaytish')}
          </Button>
          {phase.state === 'error' && phase.message !== 'DEMO_LAUNCH_BLOCKED' ? (
            <Button type="button" size="sm" onClick={ctl.requestLaunch}>
              {t('common.retry', 'Qayta urinish')}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={
                isBusy ||
                ctl.selectedCampaigns.length === 0 ||
                cfg.audiences.length === 0
              }
              onClick={ctl.requestLaunch}
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {t('adLauncher.launchNow', 'Hozir ishga tushirish')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
