'use client'

import { AlertTriangle, Rocket } from 'lucide-react'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import type { AdLauncherController } from '../_lib/use-ad-launcher'

const OBJECTIVE_LABEL: Record<string, string> = {
  OUTCOME_SALES: 'Sotuvlar',
  OUTCOME_LEADS: 'Lidlar',
  OUTCOME_TRAFFIC: 'Trafik',
  OUTCOME_ENGAGEMENT: 'Engagement',
  OUTCOME_AWARENESS: 'Bilimdorlik',
}

const AUDIENCE_LABEL: Record<string, string> = {
  prospecting: 'Yangi odamlar',
  reengagement: 'Qaytish uchun',
  retargeting: 'Retargeting',
  retention: 'Mavjud mijozlar',
}

export function ConfirmLaunchDialog({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const cfg = ctl.launchConfig
  const currency = ctl.selectedAccount?.currency ?? 'USD'

  // Resource counts that the orchestrator will produce.
  const audienceCount = cfg.audiences.length
  const sourceAdCount = ctl.selectedCampaigns.length
  const adsCount = cfg.copyCreatives ? audienceCount * sourceAdCount : 0
  const perAdSetBudget =
    cfg.budgetType === 'ABO' && audienceCount > 0
      ? Math.max(1, Math.round(cfg.dailyBudget / audienceCount))
      : cfg.dailyBudget

  return (
    <Dialog
      open={ctl.confirmOpen}
      onClose={ctl.cancelLaunch}
      title="Ishga tushirishdan oldin tekshiring"
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-900 dark:text-amber-200">
            {ctl.isDemoMode
              ? 'Demo rejimda — haqiqiy kampaniya yaratilmaydi, faqat flow sinab ko\'riladi.'
              : 'Meta\'da yangi kampaniya yaratiladi. Dastlab to\'xtatilgan (PAUSED) holatda bo\'ladi — siz o\'zingiz faollashtirasiz.'}
          </p>
        </div>

        {/* Concrete resource breakdown */}
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
            Meta'da quyidagilar yaratiladi
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-primary/20 bg-surface p-2">
              <p className="text-2xl font-bold text-text-primary tabular-nums">1</p>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Campaign</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-surface p-2">
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {audienceCount}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Ad Set</p>
              {cfg.budgetType === 'ABO' && audienceCount > 0 && (
                <p className="mt-0.5 text-[10px] text-text-tertiary">
                  ${perAdSetBudget}/kun har biri
                </p>
              )}
            </div>
            <div className="rounded-lg border border-primary/20 bg-surface p-2">
              <p className="text-2xl font-bold text-text-primary tabular-nums">{adsCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Reklama</p>
              {!cfg.copyCreatives && (
                <p className="mt-0.5 text-[10px] text-text-tertiary">bo'sh</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-surface-2 p-4 dark:bg-surface">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Kampaniya xulasasi
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-text-tertiary">Reklamalar</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {ctl.selectedCampaigns.length} ta tanlangan
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-text-tertiary">Maqsad</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {OBJECTIVE_LABEL[cfg.objective] ?? cfg.objective}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-text-tertiary">Kunlik byudjet</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {cfg.dailyBudget} {currency}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-text-tertiary">Byudjet rejimi</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {cfg.budgetType === 'CBO' ? 'Avtomatik (CBO)' : 'Qo\'lda (ABO)'}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-sm text-text-tertiary">Auditoriya</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {cfg.audiences.map((a) => AUDIENCE_LABEL[a] ?? a).join(', ')}
              </span>
            </div>
            {cfg.audiences.length > 1 && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-text-tertiary">Adsetlar</span>
                <span className="text-right text-sm font-semibold text-text-primary">
                  {cfg.splitByFunnelStage
                    ? `${cfg.audiences.length} ta alohida adset`
                    : 'Bitta umumiy adset'}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-text-tertiary">Targeting</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {cfg.targeting.countries.join(', ')} · {cfg.targeting.ageMin}-{cfg.targeting.ageMax}{' '}
                yosh
                {cfg.targeting.genders.length > 0 &&
                  ` · ${cfg.targeting.genders.map((g) => (g === 1 ? 'Erkak' : 'Ayol')).join(', ')}`}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-text-tertiary">Kreativlar</span>
              <span className="text-right text-sm font-semibold text-text-primary">
                {cfg.copyCreatives
                  ? `${ctl.selectedCampaigns.length} manbadan nusxalanadi`
                  : 'Bo\'sh adset (keyin qo\'shasiz)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={ctl.cancelLaunch}>
          {t('common.cancel', 'Bekor qilish')}
        </Button>
        <Button type="button" onClick={ctl.launchNow}>
          <Rocket className="h-4 w-4" />
          Tasdiqlash va yaratish
        </Button>
      </div>
    </Dialog>
  )
}
