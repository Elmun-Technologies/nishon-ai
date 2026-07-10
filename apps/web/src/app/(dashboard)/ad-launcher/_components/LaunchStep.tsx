'use client'

import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  Loader2,
  Megaphone,
  Rocket,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Alert, Button } from '@/components/ui'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AdLauncherController } from '../_lib/use-ad-launcher'
import type { AudiencePresetId, LaunchObjective } from '../_lib/types'

const OBJECTIVES: {
  id: LaunchObjective
  icon: React.ComponentType<{ className?: string }>
  labelKey: string
  labelFallback: string
  descKey: string
  descFallback: string
}[] = [
  {
    id: 'OUTCOME_SALES',
    icon: ShoppingCart,
    labelKey: 'adLauncher.objSales',
    labelFallback: 'Sotuvlar',
    descKey: 'adLauncher.objSalesDesc',
    descFallback: 'Xarid qilishi mumkin bo\'lgan odamlarga ko\'rsatish',
  },
  {
    id: 'OUTCOME_LEADS',
    icon: Users,
    labelKey: 'adLauncher.objLeads',
    labelFallback: 'Lidlar',
    descKey: 'adLauncher.objLeadsDesc',
    descFallback: 'Telefon/email to\'plash, forma to\'ldirtirish',
  },
  {
    id: 'OUTCOME_TRAFFIC',
    icon: TrendingUp,
    labelKey: 'adLauncher.objTraffic',
    labelFallback: 'Trafik',
    descKey: 'adLauncher.objTrafficDesc',
    descFallback: 'Saytingizga tashrif buyurtuvchilar',
  },
  {
    id: 'OUTCOME_ENGAGEMENT',
    icon: Target,
    labelKey: 'adLauncher.objEngagement',
    labelFallback: 'Engagement',
    descKey: 'adLauncher.objEngagementDesc',
    descFallback: 'Like, izoh, ulashish — brendga e\'tibor',
  },
  {
    id: 'OUTCOME_AWARENESS',
    icon: Megaphone,
    labelKey: 'adLauncher.objAwareness',
    labelFallback: 'Bilimdorlik',
    descKey: 'adLauncher.objAwarenessDesc',
    descFallback: 'Brendingizni ko\'proq odamga tanittirish',
  },
]

const BUDGET_PRESETS = [10, 25, 50, 100, 200]

const COUNTRY_OPTIONS: { code: string; labelKey: string; labelFallback: string }[] = [
  { code: 'UZ', labelKey: 'adLauncher.countryUZ', labelFallback: 'O\'zbekiston' },
  { code: 'KZ', labelKey: 'adLauncher.countryKZ', labelFallback: 'Qozog\'iston' },
  { code: 'RU', labelKey: 'adLauncher.countryRU', labelFallback: 'Rossiya' },
  { code: 'KG', labelKey: 'adLauncher.countryKG', labelFallback: 'Qirg\'iziston' },
  { code: 'TJ', labelKey: 'adLauncher.countryTJ', labelFallback: 'Tojikiston' },
  { code: 'TM', labelKey: 'adLauncher.countryTM', labelFallback: 'Turkmaniston' },
  { code: 'TR', labelKey: 'adLauncher.countryTR', labelFallback: 'Turkiya' },
  { code: 'US', labelKey: 'adLauncher.countryUS', labelFallback: 'AQSh' },
]

const GENDER_OPTIONS: { id: number | 'all'; labelKey: string; labelFallback: string }[] = [
  { id: 'all', labelKey: 'adLauncher.genderAll', labelFallback: 'Hammasi' },
  { id: 1, labelKey: 'adLauncher.genderMale', labelFallback: 'Erkak' },
  { id: 2, labelKey: 'adLauncher.genderFemale', labelFallback: 'Ayol' },
]

const AUDIENCE_PRESETS: {
  id: AudiencePresetId
  emoji: string
  labelKey: string
  labelFallback: string
  whoKey: string
  whoFallback: string
}[] = [
  {
    id: 'prospecting',
    emoji: '🆕',
    labelKey: 'adLauncher.audNewLabel',
    labelFallback: 'Yangi odamlar',
    whoKey: 'adLauncher.audNewWho',
    whoFallback: 'Siz bilan hali tanish bo\'lmagan potentsial mijozlar',
  },
  {
    id: 'reengagement',
    emoji: '🔄',
    labelKey: 'adLauncher.audReturnLabel',
    labelFallback: 'Qaytish uchun',
    whoKey: 'adLauncher.audReturnWho',
    whoFallback: 'Saytga kirgan, lekin hali xarid qilmagan',
  },
  {
    id: 'retargeting',
    emoji: '🎯',
    labelKey: 'adLauncher.audRetargeting',
    labelFallback: 'Retargeting',
    whoKey: 'adLauncher.audRetargetWho',
    whoFallback: 'So\'nggi 30 kundagi faol foydalanuvchilar',
  },
  {
    id: 'retention',
    emoji: '💎',
    labelKey: 'adLauncher.audExistingLabel',
    labelFallback: 'Mavjud mijozlar',
    whoKey: 'adLauncher.audExistingWho',
    whoFallback: 'Avval xarid qilganlarni yana jalb qilish',
  },
]

const LAUNCH_STEPS: {
  key: string
  labelKey: string
  labelFallback: string
  subKey: string
  subFallback: string
}[] = [
  {
    key: 'creating_draft',
    labelKey: 'adLauncher.launchStepDraftLabel',
    labelFallback: 'Launch job yaratilmoqda',
    subKey: 'adLauncher.launchStepDraftSub',
    subFallback: 'Bizning serverda kampaniya konfiguratsiyasi saqlanmoqda',
  },
  {
    key: 'validating',
    labelKey: 'adLauncher.launchStepValidateLabel',
    labelFallback: 'Validatsiyadan o\'tmoqda',
    subKey: 'adLauncher.launchStepValidateSub',
    subFallback: 'Auditoriya, byudjet va targeting tekshirilmoqda',
  },
  {
    key: 'launching',
    labelKey: 'adLauncher.launchStepPushLabel',
    labelFallback: 'Meta API\'ga yuborilmoqda',
    subKey: 'adLauncher.launchStepPushSub',
    subFallback: 'Campaign + AdSets + Ads yaratilmoqda',
  },
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
      return t(
        'adLauncher.launchErrValidation',
        'Konfiguratsiya validatsiyadan o\'tmadi. Sozlamalarni tekshiring.',
      )
    case 'LAUNCH_FAILED':
      return t(
        'adLauncher.launchErrLaunch',
        'Meta\'ga yuborishda xato yuz berdi. Qayta urinib ko\'ring.',
      )
    case 'DEMO_LAUNCH_BLOCKED':
      return t('adLauncher.launchErrDemo', 'Demo rejimda haqiqiy launch yoqilmagan.')
    default:
      return code || t('adLauncher.errGeneric', 'Kutilmagan xato yuz berdi.')
  }
}

function SectionHeader({
  num,
  title,
  subtitle,
}: {
  num: number
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
        {num}
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>}
      </div>
    </div>
  )
}

export function LaunchStep({ ctl }: { ctl: AdLauncherController }) {
  const { t } = useI18n()
  const cfg = ctl.launchConfig
  const phase = ctl.launchPhase
  const currency = ctl.selectedAccount?.currency ?? 'USD'
  const dayUnit = t('adLauncher.confirmBudgetDay', 'kun')

  const isBusy =
    phase.state === 'creating_draft' ||
    phase.state === 'validating' ||
    phase.state === 'launching'

  const isDone = phase.state === 'success'

  const currentLaunchStepIndex = LAUNCH_STEPS.findIndex((s) => s.key === phase.state)

  const toggleAudience = (id: AudiencePresetId) => {
    const has = cfg.audiences.includes(id)
    const next = has ? cfg.audiences.filter((a) => a !== id) : [...cfg.audiences, id]
    ctl.updateLaunchConfig({ audiences: next })
  }

  const canLaunch =
    !isBusy &&
    ctl.selectedCampaigns.length > 0 &&
    cfg.audiences.length > 0 &&
    cfg.dailyBudget >= 1

  // What will actually be created on Meta when "Launch" fires.
  // The orchestrator: 1 Campaign + N AdSets (one per audience) + (copyCreatives ? M Ads : 0).
  const audienceCount = cfg.audiences.length
  const sourceAdCount = ctl.selectedCampaigns.length
  const willCreateAds = cfg.copyCreatives ? audienceCount * sourceAdCount : 0
  const perAdSetBudget =
    cfg.budgetType === 'ABO' && audienceCount > 0
      ? Math.max(1, Math.round(cfg.dailyBudget / audienceCount))
      : cfg.dailyBudget

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
      <header>
        <h2 className="text-lg font-semibold text-text-primary">
          {t('adLauncher.setupTitle', '3. Kampaniyani sozlang')}
        </h2>
        <p className="mt-0.5 text-sm text-text-tertiary">
          {t(
            'adLauncher.setupSubtitle',
            'Quyidagi 3 ta savolga javob bering — kampaniya avtomatik yaratiladi.',
          )}
        </p>
      </header>

      {/* Nima yaratiladi — preview of what the orchestrator will produce */}
      {!isDone && (
        <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 to-primary/3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t('adLauncher.previewHeading', 'Meta\'da nima yaratiladi')}
            </p>
            {audienceCount === 0 && (
              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                ⓘ {t('adLauncher.previewPickAudienceFirst', 'Avval auditoriya tanlang')}
              </span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                {t('adLauncher.previewCampaign', 'Campaign')}
              </p>
              <p className="text-base font-bold text-text-primary tabular-nums">1</p>
              <p className="text-[10px] text-text-tertiary truncate">
                {cfg.objective.replace('OUTCOME_', '').toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                {t('adLauncher.previewAdSet', 'Ad Set')}
              </p>
              <p className="text-base font-bold text-text-primary tabular-nums">
                {audienceCount || '—'}
              </p>
              <p className="text-[10px] text-text-tertiary">
                {cfg.budgetType === 'ABO'
                  ? `${perAdSetBudget} ${currency}/${dayUnit} ${t('adLauncher.each', 'har biri')}`
                  : `${cfg.dailyBudget} ${currency}/${dayUnit} (CBO)`}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                {t('adLauncher.previewAd', 'Reklama')}
              </p>
              <p className="text-base font-bold text-text-primary tabular-nums">
                {willCreateAds || '—'}
              </p>
              <p className="text-[10px] text-text-tertiary">
                {cfg.copyCreatives
                  ? `${sourceAdCount} ${t('adLauncher.creativeUnit', 'kreativ')} × ${audienceCount || 0} ${t('adLauncher.adsetUnit', 'adset')}`
                  : t('adLauncher.emptyAdsetNote', 'Bo\'sh adset (keyin qo\'shasiz)')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                {t('adLauncher.status', 'Holat')}
              </p>
              <p className="text-base font-bold text-text-primary">PAUSED</p>
              <p className="text-[10px] text-text-tertiary">
                {t('adLauncher.pausedManualNote', 'Meta\'da qo\'lda yoqasiz')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tanlangan reklamalar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-text-primary">
            {ctl.selectedCampaigns.length}{' '}
            {t('adLauncher.adsSelectedSuffix', 'ta reklama tanlangan')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => ctl.goToStep('pick')}
          className="text-xs text-primary hover:underline"
        >
          {t('adLauncher.change', 'O\'zgartirish')}
        </button>
      </div>

      <div className="space-y-0 divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
        {/* 1 — Maqsad */}
        <section className="p-5">
          <SectionHeader
            num={1}
            title={t('adLauncher.objectiveQuestion', 'Kampaniyadan nima kutyapsiz?')}
            subtitle={t(
              'adLauncher.objectiveQuestionHint',
              'Meta shu maqsadga qarab reklama ko\'rsatadi',
            )}
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OBJECTIVES.map((o) => {
              const Icon = o.icon
              const active = cfg.objective === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={active}
                  disabled={isBusy || isDone}
                  onClick={() => ctl.updateLaunchConfig({ objective: o.id })}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-50',
                    active
                      ? 'border-primary bg-primary/8 ring-1 ring-primary/25'
                      : 'border-border bg-surface-2 hover:border-primary/30 hover:bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      active ? 'bg-primary/15 text-primary' : 'bg-border/60 text-text-tertiary',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">
                      {t(o.labelKey, o.labelFallback)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                      {t(o.descKey, o.descFallback)}
                    </span>
                  </span>
                  {active && (
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* 2 — Byudjet */}
        <section className="p-5">
          <SectionHeader
            num={2}
            title={t('adLauncher.budgetQuestion', 'Kunlik byudjet qancha?')}
            subtitle={t(
              'adLauncher.budgetQuestionHint',
              'Bu boshlang\'ich qiymat — keyin Meta\'da o\'zgartirishingiz mumkin',
            )}
          />
          <div className="mt-4 space-y-3">
            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isBusy || isDone}
                  onClick={() => ctl.updateLaunchConfig({ dailyBudget: preset })}
                  className={cn(
                    'rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50',
                    cfg.dailyBudget === preset
                      ? 'border-primary bg-primary text-brand-ink'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-primary/40',
                  )}
                >
                  {preset} {currency}
                </button>
              ))}
              <span className="flex items-center text-xs text-text-tertiary">
                {t('adLauncher.orWord', 'yoki')}
              </span>
            </div>

            {/* Custom amount */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 transition-colors focus-within:border-primary/60 dark:bg-surface">
                <span className="text-sm text-text-tertiary">{currency}</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  disabled={isBusy || isDone}
                  value={cfg.dailyBudget}
                  onChange={(e) =>
                    ctl.updateLaunchConfig({
                      dailyBudget: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-24 bg-transparent text-sm tabular-nums outline-none"
                  placeholder={t('adLauncher.amountPlaceholder', 'Miqdor')}
                />
              </div>
              <span className="text-xs text-text-tertiary">
                {t('adLauncher.enterCustomAmount', 'o\'z miqdoringizni kiriting')}
              </span>
            </div>

            {/* Budget type */}
            <div className="rounded-xl border border-border bg-surface-2 p-3 dark:bg-surface">
              <p className="mb-2 text-xs font-semibold text-text-tertiary">
                {t('adLauncher.budgetDistribution', 'Byudjet taqsimlanishi')}
              </p>
              <div className="flex gap-2">
                {([
                  {
                    id: 'CBO' as const,
                    labelKey: 'adLauncher.budgetAutoLabel',
                    labelFallback: 'Avtomatik (CBO)',
                    descKey: 'adLauncher.budgetAutoDesc',
                    descFallback:
                      'Meta o\'zi eng yaxshi guruhga taqsimlaydi — tavsiya etiladi',
                  },
                  {
                    id: 'ABO' as const,
                    labelKey: 'adLauncher.budgetManualLabel',
                    labelFallback: 'Qo\'lda (ABO)',
                    descKey: 'adLauncher.budgetManualDesc',
                    descFallback: 'Har bir auditoriya uchun alohida byudjet belgilaysiz',
                  },
                ] as const).map((bt) => (
                  <button
                    key={bt.id}
                    type="button"
                    aria-pressed={cfg.budgetType === bt.id}
                    disabled={isBusy || isDone}
                    onClick={() => ctl.updateLaunchConfig({ budgetType: bt.id })}
                    className={cn(
                      'flex-1 rounded-lg border p-2.5 text-left transition-all disabled:opacity-50',
                      cfg.budgetType === bt.id
                        ? 'border-primary bg-primary/8 ring-1 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/30',
                    )}
                  >
                    <p className="text-xs font-semibold text-text-primary">
                      {t(bt.labelKey, bt.labelFallback)}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-text-tertiary">
                      {t(bt.descKey, bt.descFallback)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3 — Auditoriya */}
        <section className="p-5">
          <SectionHeader
            num={3}
            title={t(
              'adLauncher.audienceQuestion',
              'Kim ko\'rsin? (bir yoki bir nechtasini tanlang)',
            )}
            subtitle={t(
              'adLauncher.audienceQuestionHint',
              'Tanlagan har bir guruh uchun alohida adset yaratiladi',
            )}
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {AUDIENCE_PRESETS.map((a) => {
              const on = cfg.audiences.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={on}
                  disabled={isBusy || isDone}
                  onClick={() => toggleAudience(a.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-50',
                    on
                      ? 'border-primary bg-primary/8 ring-1 ring-primary/25'
                      : 'border-border bg-surface-2 hover:border-primary/30 hover:bg-surface',
                  )}
                >
                  <span className="text-xl leading-none">{a.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text-primary">
                      {t(a.labelKey, a.labelFallback)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                      {t(a.whoKey, a.whoFallback)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      on ? 'border-primary bg-primary text-brand-ink' : 'border-border bg-surface',
                    )}
                  >
                    {on && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                </button>
              )
            })}
          </div>

          {cfg.audiences.length > 1 && (
            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                disabled={isBusy || isDone}
                checked={cfg.splitByFunnelStage}
                onChange={(e) => ctl.updateLaunchConfig({ splitByFunnelStage: e.target.checked })}
                className="rounded border-border text-primary"
              />
              {t('adLauncher.splitPre', 'Har bir guruh uchun')}{' '}
              <strong>{t('adLauncher.splitStrong', 'alohida adset')}</strong>{' '}
              {t('adLauncher.splitPost', 'yaratish (tavsiya etiladi)')}
            </label>
          )}
        </section>

        {/* 4 — Targeting */}
        <section className="p-5">
          <SectionHeader
            num={4}
            title={t('adLauncher.targetingTitle', 'Targeting — kimga ko\'rsatish')}
            subtitle={t(
              'adLauncher.targetingSubtitle',
              'Davlat, yosh va jins. Meta shu chegaralarda reklama tarqatadi.',
            )}
          />
          <div className="mt-4 space-y-4">
            {/* Countries */}
            <div>
              <p className="mb-2 text-xs font-semibold text-text-tertiary">
                {t('adLauncher.countriesLabel', 'Davlatlar')}
              </p>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_OPTIONS.map((c) => {
                  const on = cfg.targeting.countries.includes(c.code)
                  return (
                    <button
                      key={c.code}
                      type="button"
                      aria-pressed={on}
                      disabled={isBusy || isDone}
                      onClick={() => {
                        const next = on
                          ? cfg.targeting.countries.filter((x) => x !== c.code)
                          : [...cfg.targeting.countries, c.code]
                        ctl.updateLaunchConfig({
                          targeting: { ...cfg.targeting, countries: next.length ? next : [c.code] },
                        })
                      }}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                        on
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface-2 text-text-secondary hover:border-primary/40',
                      )}
                    >
                      {t(c.labelKey, c.labelFallback)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Age range */}
            <div>
              <p className="mb-2 text-xs font-semibold text-text-tertiary">
                {t('adLauncher.ageRangeLabel', 'Yosh oralig\'i')}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 dark:bg-surface">
                  <span className="text-xs text-text-tertiary">
                    {t('adLauncher.ageFrom', 'dan')}
                  </span>
                  <input
                    type="number"
                    min={13}
                    max={65}
                    disabled={isBusy || isDone}
                    value={cfg.targeting.ageMin}
                    onChange={(e) => {
                      const v = Math.max(13, Math.min(65, Number(e.target.value) || 18))
                      ctl.updateLaunchConfig({
                        targeting: {
                          ...cfg.targeting,
                          ageMin: v,
                          ageMax: Math.max(v, cfg.targeting.ageMax),
                        },
                      })
                    }}
                    className="w-14 bg-transparent text-sm tabular-nums outline-none"
                  />
                </div>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 dark:bg-surface">
                  <span className="text-xs text-text-tertiary">
                    {t('adLauncher.ageTo', 'gacha')}
                  </span>
                  <input
                    type="number"
                    min={13}
                    max={65}
                    disabled={isBusy || isDone}
                    value={cfg.targeting.ageMax}
                    onChange={(e) => {
                      const v = Math.max(13, Math.min(65, Number(e.target.value) || 65))
                      ctl.updateLaunchConfig({
                        targeting: {
                          ...cfg.targeting,
                          ageMax: Math.max(cfg.targeting.ageMin, v),
                        },
                      })
                    }}
                    className="w-14 bg-transparent text-sm tabular-nums outline-none"
                  />
                </div>
                <span className="text-xs text-text-tertiary">
                  {t('adLauncher.ageYears', 'yosh')}
                </span>
              </div>
            </div>

            {/* Genders */}
            <div>
              <p className="mb-2 text-xs font-semibold text-text-tertiary">
                {t('adLauncher.genderLabel', 'Jins')}
              </p>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => {
                  const isAll = g.id === 'all'
                  const on = isAll
                    ? cfg.targeting.genders.length === 0
                    : cfg.targeting.genders.includes(g.id as number)
                  return (
                    <button
                      key={String(g.id)}
                      type="button"
                      aria-pressed={on}
                      disabled={isBusy || isDone}
                      onClick={() => {
                        if (isAll) {
                          ctl.updateLaunchConfig({
                            targeting: { ...cfg.targeting, genders: [] },
                          })
                          return
                        }
                        const gid = g.id as number
                        const next = cfg.targeting.genders.includes(gid)
                          ? cfg.targeting.genders.filter((x) => x !== gid)
                          : [...cfg.targeting.genders, gid]
                        ctl.updateLaunchConfig({
                          targeting: { ...cfg.targeting, genders: next },
                        })
                      }}
                      className={cn(
                        'rounded-lg border px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                        on
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface-2 text-text-secondary hover:border-primary/40',
                      )}
                    >
                      {t(g.labelKey, g.labelFallback)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 5 — Creative copying */}
        <section className="p-5">
          <SectionHeader
            num={5}
            title={t('adLauncher.creativeSectionTitle', 'Reklama kreativlari')}
            subtitle={t(
              'adLauncher.creativeSectionSubtitle',
              'Tanlangan manba kampaniyalardan kreativlarni yangi adset\'larga ko\'chirish',
            )}
          />
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-2 p-3">
            <input
              type="checkbox"
              disabled={isBusy || isDone}
              checked={cfg.copyCreatives}
              onChange={(e) => ctl.updateLaunchConfig({ copyCreatives: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text-primary">
                {t('adLauncher.copyCreativesLabel', 'Manba kampaniyadagi reklamalarni nusxalash')}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                {t('adLauncher.copyCreativesBodyPre', 'Belgilangach, tanlangan')}{' '}
                {ctl.selectedCampaigns.length}{' '}
                {t(
                  'adLauncher.copyCreativesBodyPost',
                  'kampaniya ichidagi har bir kreativ yangi adset\'larda paydo bo\'ladi. Aks holda adset bo\'sh — keyinroq Meta\'da qo\'lda kreativ qo\'shasiz.',
                )}
              </span>
            </span>
          </label>
        </section>
      </div>

      {/* Launch progress */}
      {isBusy && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="space-y-3">
            {LAUNCH_STEPS.map((s, i) => {
              const done = i < currentLaunchStepIndex
              const active = i === currentLaunchStepIndex
              return (
                <div key={s.key} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                      done && 'bg-emerald-500 text-white',
                      active && 'bg-primary text-brand-ink',
                      !done && !active && 'bg-border text-text-tertiary',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm',
                        active && 'font-semibold text-text-primary',
                        done && 'text-text-secondary',
                        !done && !active && 'text-text-tertiary',
                      )}
                    >
                      {t(s.labelKey, s.labelFallback)}
                    </p>
                    {active && (
                      <p className="mt-0.5 text-[11px] text-text-tertiary">
                        {t(s.subKey, s.subFallback)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error states */}
      {phase.state === 'error' &&
        (phase.message === 'DEMO_LAUNCH_BLOCKED' ? (
          <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-50 to-amber-50/40 p-5 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-transparent">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                <Lock className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  {t('adLauncher.demoBlockedTitle', 'Demo rejimda haqiqiy launch o\'chirilgan')}
                </h3>
                <p className="mt-0.5 text-sm text-amber-800/85 dark:text-amber-200/80">
                  {t(
                    'adLauncher.demoBlockedBody',
                    'Bepul ro\'yxatdan o\'ting va Meta hisobingizni ulang — keyin xuddi shu sozlamalar bilan haqiqiy kampaniya yaratiladi.',
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
              <span className="flex-1">{launchErrorMessage(phase.message, t)}</span>
            </div>
          </Alert>
        ))}

      {/* Success */}
      {phase.state === 'success' && (
        <div className="rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-50 to-emerald-50/40 p-5 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-transparent">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                  {t('adLauncher.launchSuccess', 'Kampaniya yaratildi!')}
                </h3>
                <p className="mt-0.5 text-sm text-emerald-800/85 dark:text-emerald-200/80">
                  {t('adLauncher.successBodyPre', 'Meta\'da')}{' '}
                  <strong>PAUSED</strong>{' '}
                  {t(
                    'adLauncher.successBodyPost',
                    'holatda turibdi — siz u yerda ko\'rib, faollashtirish tugmasini bosasiz.',
                  )}
                </p>
              </div>

              {/* Real result summary: counts + Meta deeplink */}
              {phase.result && (
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-emerald-300/30 bg-white/60 p-3 text-xs dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-800/60 dark:text-emerald-300/60">
                      {t('adLauncher.previewCampaign', 'Campaign')}
                    </p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">1</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-800/60 dark:text-emerald-300/60">
                      {t('adLauncher.previewAdSet', 'Ad Set')}
                    </p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      {phase.result.adSetIds?.length ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-800/60 dark:text-emerald-300/60">
                      {t('adLauncher.previewAd', 'Reklama')}
                    </p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      {phase.result.adIds?.length ?? 0}
                    </p>
                  </div>
                </div>
              )}

              {phase.metaCampaignId && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-900 dark:text-emerald-200">
                    {t('adLauncher.metaIdLabel', 'Meta ID')}:{' '}
                    <code className="font-mono">{phase.metaCampaignId}</code>
                  </span>
                  <a
                    href={`https://business.facebook.com/adsmanager/manage/campaigns?selected_campaign_ids=${encodeURIComponent(phase.metaCampaignId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline dark:text-emerald-300"
                  >
                    {t('adLauncher.openInMetaAdsManager', 'Meta Ads Manager\'da ochish')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Partial failure warnings (some ad sets / ads couldn't be created) */}
              {phase.result?.adSetErrors && phase.result.adSetErrors.length > 0 && (
                <div className="rounded-md border border-amber-300/40 bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <p className="font-semibold">
                    {phase.result.adSetErrors.length}{' '}
                    {t('adLauncher.adSetsFailedSuffix', 'ta adset yaratilmadi:')}
                  </p>
                  <ul className="mt-1 list-disc pl-4">
                    {phase.result.adSetErrors.slice(0, 3).map((e, i) => (
                      <li key={i}>
                        {e.audience}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {phase.result?.adErrors && phase.result.adErrors.length > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠ {phase.result.adErrors.length}{' '}
                  {t(
                    'adLauncher.adsNotCopiedSuffix',
                    'ta reklama nusxalanmadi. Meta Ads Manager\'da qo\'lda qo\'shishingiz mumkin.',
                  )}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/campaigns">
                  <Button size="sm">
                    {t('adLauncher.seeCampaigns', 'Kampaniyalarni ko\'rish')}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex items-center gap-3">
            {/* Inline validation hints */}
            {cfg.audiences.length === 0 && !isBusy && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                ↑ {t('adLauncher.pickMinAudience', 'Kamida 1 auditoriya tanlang')}
              </span>
            )}
            {phase.state === 'error' && phase.message !== 'DEMO_LAUNCH_BLOCKED' ? (
              <Button type="button" size="sm" onClick={ctl.requestLaunch}>
                {t('common.retry', 'Qayta urinish')}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!canLaunch}
                onClick={ctl.requestLaunch}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {t('adLauncher.createCampaignBtn', 'Kampaniyani yaratish')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
