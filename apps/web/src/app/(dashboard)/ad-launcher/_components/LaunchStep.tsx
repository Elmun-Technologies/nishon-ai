'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Rocket } from 'lucide-react'
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

export function LaunchStep({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const cfg = ctl.launchConfig
  const phase = ctl.launchPhase

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
    <div className="space-y-4">
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
        <h3 className="text-sm font-semibold text-text-primary">
          {t('adLauncher.summarySelected', 'Tanlangan reklamalar')} ({ctl.selectedCampaigns.length})
        </h3>
        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
          {ctl.selectedCampaigns.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2 py-1.5 dark:bg-surface-elevated">
              <span className="truncate text-text-secondary">{c.name}</span>
              <span className="shrink-0 text-xs text-text-tertiary">{c.status}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Configure */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
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
                  'rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-60',
                  cfg.objective === o.id
                    ? 'border-primary bg-primary/8'
                    : 'border-border bg-surface hover:bg-surface-2',
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
              {t('adLauncher.dailyBudget', 'Kunlik byudjet (USD)')}
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 dark:bg-surface">
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
                    'flex items-start gap-2 rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-60',
                    on ? 'border-primary bg-primary/8' : 'border-border bg-surface hover:bg-surface-2',
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
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('adLauncher.phaseDraft', 'Launch job yaratilmoqda...')}
        </Alert>
      )}
      {phase.state === 'validating' && (
        <Alert variant="info">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('adLauncher.phaseValidate', 'Validatsiya...')}
        </Alert>
      )}
      {phase.state === 'launching' && (
        <Alert variant="info">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('adLauncher.phaseLaunch', 'Meta\'ga yuborilmoqda...')}
        </Alert>
      )}
      {phase.state === 'error' && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <span className="flex-1">
            <strong>{t('adLauncher.launchFailed', 'Ishga tushirilmadi')}: </strong>
            {phase.message}
          </span>
        </Alert>
      )}
      {phase.state === 'success' && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <div className="flex-1">
            <p className="font-semibold">
              {t('adLauncher.launchSuccess', 'Kampaniya yaratildi!')}
            </p>
            <p className="text-xs">
              {t(
                'adLauncher.launchSuccessHint',
                'Meta\'da PAUSED holatda. Tasdiqlash uchun Meta Ads Manager\'ga o\'ting yoki bizning Campaigns sahifasiga.',
              )}
              {phase.metaCampaignId && (
                <>
                  {' '}
                  <code className="rounded bg-surface-2 px-1 text-[11px]">{phase.metaCampaignId}</code>
                </>
              )}
            </p>
          </div>
        </Alert>
      )}

      {/* Footer */}
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

        {isDone ? (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={ctl.resetLaunch}>
              {t('adLauncher.startNew', 'Yangi launch')}
            </Button>
            <Link href="/campaigns">
              <Button type="button" size="sm">
                {t('adLauncher.viewCampaigns', 'Campaigns sahifasi')}
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={
              isBusy ||
              ctl.selectedCampaigns.length === 0 ||
              cfg.audiences.length === 0
            }
            onClick={ctl.launchNow}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {t('adLauncher.launchNow', 'Hozir ishga tushirish')}
          </Button>
        )}
      </div>
    </div>
  )
}
