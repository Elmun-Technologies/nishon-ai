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
  label: string
  description: string
}[] = [
  {
    id: 'OUTCOME_SALES',
    icon: ShoppingCart,
    label: 'Sotuvlar',
    description: 'Xarid qilishi mumkin bo\'lgan odamlarga ko\'rsatish',
  },
  {
    id: 'OUTCOME_LEADS',
    icon: Users,
    label: 'Lidlar',
    description: 'Telefon/email to\'plash, forma to\'ldirtirish',
  },
  {
    id: 'OUTCOME_TRAFFIC',
    icon: TrendingUp,
    label: 'Trafik',
    description: 'Saytingizga tashrif buyurtuvchilar',
  },
  {
    id: 'OUTCOME_ENGAGEMENT',
    icon: Target,
    label: 'Engagement',
    description: 'Like, izoh, ulashish — brendga e\'tibor',
  },
  {
    id: 'OUTCOME_AWARENESS',
    icon: Megaphone,
    label: 'Bilimdorlik',
    description: 'Brendingizni ko\'proq odamga tanittirish',
  },
]

const BUDGET_PRESETS = [10, 25, 50, 100, 200]

const AUDIENCE_PRESETS: {
  id: AudiencePresetId
  emoji: string
  label: string
  who: string
}[] = [
  {
    id: 'prospecting',
    emoji: '🆕',
    label: 'Yangi odamlar',
    who: 'Siz bilan hali tanish bo\'lmagan potentsial mijozlar',
  },
  {
    id: 'reengagement',
    emoji: '🔄',
    label: 'Qaytish uchun',
    who: 'Saytga kirgan, lekin hali xarid qilmagan',
  },
  {
    id: 'retargeting',
    emoji: '🎯',
    label: 'Retargeting',
    who: 'So\'nggi 30 kundagi faol foydalanuvchilar',
  },
  {
    id: 'retention',
    emoji: '💎',
    label: 'Mavjud mijozlar',
    who: 'Avval xarid qilganlarni yana jalb qilish',
  },
]

const LAUNCH_STEPS: { key: string; label: string }[] = [
  { key: 'creating_draft', label: 'Kampaniya tayyorlanmoqda...' },
  { key: 'validating', label: 'Meta bilan tekshirilmoqda...' },
  { key: 'launching', label: 'Meta\'ga yuborilmoqda...' },
]

function launchErrorMessage(code: string): string {
  switch (code) {
    case 'NO_WORKSPACE':
      return 'Workspace topilmadi. Qaytadan login qiling.'
    case 'NO_AUDIENCE':
      return 'Kamida bitta auditoriya tanlang.'
    case 'VALIDATION_FAILED':
      return 'Konfiguratsiya validatsiyadan o\'tmadi. Sozlamalarni tekshiring.'
    case 'LAUNCH_FAILED':
      return 'Meta\'ga yuborishda xato yuz berdi. Qayta urinib ko\'ring.'
    case 'DEMO_LAUNCH_BLOCKED':
      return 'Demo rejimda haqiqiy launch yoqilmagan.'
    default:
      return code || 'Kutilmagan xato yuz berdi.'
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300">
      <header>
        <h2 className="text-lg font-semibold text-text-primary">3. Kampaniyani sozlang</h2>
        <p className="mt-0.5 text-sm text-text-tertiary">
          Quyidagi 3 ta savolga javob bering — kampaniya avtomatik yaratiladi.
        </p>
      </header>

      {/* Tanlangan reklamalar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-text-primary">
            {ctl.selectedCampaigns.length} ta reklama tanlangan
          </span>
        </div>
        <button
          type="button"
          onClick={() => ctl.goToStep('pick')}
          className="text-xs text-primary hover:underline"
        >
          O'zgartirish
        </button>
      </div>

      <div className="space-y-0 divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
        {/* 1 — Maqsad */}
        <section className="p-5">
          <SectionHeader
            num={1}
            title="Kampaniyadan nima kutyapsiz?"
            subtitle="Meta shu maqsadga qarab reklama ko'rsatadi"
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
                    <span className="block text-sm font-semibold text-text-primary">{o.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                      {o.description}
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
            title="Kunlik byudjet qancha?"
            subtitle="Bu boshlang'ich qiymat — keyin Meta'da o'zgartirishingiz mumkin"
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
              <span className="flex items-center text-xs text-text-tertiary">yoki</span>
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
                  placeholder="Miqdor"
                />
              </div>
              <span className="text-xs text-text-tertiary">o'z miqdoringizni kiriting</span>
            </div>

            {/* Budget type */}
            <div className="rounded-xl border border-border bg-surface-2 p-3 dark:bg-surface">
              <p className="mb-2 text-xs font-semibold text-text-tertiary">Byudjet taqsimlanishi</p>
              <div className="flex gap-2">
                {([
                  {
                    id: 'CBO' as const,
                    label: 'Avtomatik (CBO)',
                    desc: 'Meta o\'zi eng yaxshi guruhga taqsimlaydi — tavsiya etiladi',
                  },
                  {
                    id: 'ABO' as const,
                    label: 'Qo\'lda (ABO)',
                    desc: 'Har bir auditoriya uchun alohida byudjet belgilaysiz',
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
                    <p className="text-xs font-semibold text-text-primary">{bt.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-text-tertiary">{bt.desc}</p>
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
            title="Kim ko'rsin? (bir yoki bir nechtasini tanlang)"
            subtitle="Tanlagan har bir guruh uchun alohida adset yaratiladi"
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
                    <span className="block text-sm font-semibold text-text-primary">{a.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                      {a.who}
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
              Har bir guruh uchun <strong>alohida adset</strong> yaratish (tavsiya etiladi)
            </label>
          )}
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
                <div key={s.key} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                      done && 'bg-emerald-500 text-white',
                      active && 'bg-primary text-brand-ink',
                      !done && !active && 'bg-border text-text-tertiary',
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      active && 'font-medium text-text-primary',
                      done && 'text-text-secondary line-through',
                      !done && !active && 'text-text-tertiary',
                    )}
                  >
                    {s.label}
                  </span>
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
                  Demo rejimda haqiqiy launch o'chirilgan
                </h3>
                <p className="mt-0.5 text-sm text-amber-800/85 dark:text-amber-200/80">
                  Bepul ro'yxatdan o'ting va Meta hisobingizni ulang — keyin xuddi shu sozlamalar bilan haqiqiy kampaniya yaratiladi.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/register">
                    <Button size="sm">
                      <Sparkles className="h-4 w-4" />
                      Bepul boshlash
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" variant="secondary">
                      Akkauntim bor
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
              <span className="flex-1">{launchErrorMessage(phase.message)}</span>
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
            <div className="flex-1">
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                Kampaniya yaratildi!
              </h3>
              <p className="mt-0.5 text-sm text-emerald-800/85 dark:text-emerald-200/80">
                Meta'da <strong>PAUSED</strong> holatda turibdi — siz u yerda ko'rib, faollashtirish tugmasini bosasiz.
              </p>
              {phase.metaCampaignId && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-900 dark:text-emerald-200">
                  Meta ID: <code className="font-mono">{phase.metaCampaignId}</code>
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/campaigns">
                  <Button size="sm">
                    Kampaniyalarni ko'rish
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={ctl.resetLaunch}>
                  Yangi launch
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
            Tanlovga qaytish
          </Button>

          <div className="flex items-center gap-3">
            {/* Inline validation hints */}
            {cfg.audiences.length === 0 && !isBusy && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                ↑ Kamida 1 auditoriya tanlang
              </span>
            )}
            {phase.state === 'error' && phase.message !== 'DEMO_LAUNCH_BLOCKED' ? (
              <Button type="button" size="sm" onClick={ctl.requestLaunch}>
                Qayta urinish
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
                Kampaniyani yaratish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
