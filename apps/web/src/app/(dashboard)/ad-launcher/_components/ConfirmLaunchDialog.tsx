'use client'

import { AlertTriangle, Rocket } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import type { AdLauncherController } from '../_lib/use-ad-launcher'

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_SALES: 'Sales',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_TRAFFIC: 'Traffic',
  OUTCOME_ENGAGEMENT: 'Engagement',
  OUTCOME_AWARENESS: 'Awareness',
}

/**
 * Final confirmation step before we hit the launch-orchestrator.
 * Surface the exact contract: PAUSED in Meta, real money once activated.
 */
export function ConfirmLaunchDialog({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const cfg = ctl.launchConfig
  const currency = ctl.selectedAccount?.currency ?? 'USD'

  return (
    <Dialog
      open={ctl.confirmOpen}
      onClose={ctl.cancelLaunch}
      title={t('adLauncher.confirmTitle', 'Launchni tasdiqlash')}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            {ctl.isDemoMode
              ? t(
                  'adLauncher.confirmDemoNotice',
                  'Demo rejimda haqiqiy launch amalga oshmaydi. Faqat flow simulatsiyasi ko\'rsatiladi.',
                )
              : t(
                  'adLauncher.confirmRealNotice',
                  'Meta\'da yangi kampaniya PAUSED holatda yaratiladi. Faollashtirgandan so\'ng kunlik byudjet sarflanadi.',
                )}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-surface-2 p-3 text-sm dark:bg-surface">
          <dt className="text-text-tertiary">{t('adLauncher.confirmObjective', 'Maqsad')}</dt>
          <dd className="font-medium text-text-primary">
            {OBJECTIVE_LABEL[cfg.objective] ?? cfg.objective}
          </dd>

          <dt className="text-text-tertiary">{t('adLauncher.confirmBudget', 'Byudjet')}</dt>
          <dd className="font-medium text-text-primary">
            {cfg.dailyBudget} {currency}/{t('adLauncher.confirmBudgetDay', 'kun')} · {cfg.budgetType}
          </dd>

          <dt className="text-text-tertiary">{t('adLauncher.confirmAudiences', 'Auditoriya')}</dt>
          <dd className="font-medium text-text-primary">
            {cfg.audiences.length} ·{' '}
            {cfg.splitByFunnelStage
              ? t('adLauncher.confirmSplit', 'alohida adsetlar')
              : t('adLauncher.confirmSingle', 'bitta adset')}
          </dd>

          <dt className="text-text-tertiary">{t('adLauncher.confirmAds', 'Reklamalar')}</dt>
          <dd className="font-medium text-text-primary">{ctl.selectedCampaigns.length}</dd>
        </dl>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={ctl.cancelLaunch}>
          {t('common.cancel', 'Bekor qilish')}
        </Button>
        <Button type="button" onClick={ctl.launchNow}>
          <Rocket className="h-4 w-4" />
          {t('adLauncher.confirmLaunchCta', 'Tasdiqlash va ishga tushirish')}
        </Button>
      </div>
    </Dialog>
  )
}
