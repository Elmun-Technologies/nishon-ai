'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui'
import { Alert } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  SUBSCRIPTION_PLANS,
  formatUzs,
  getPlan,
  uzsToPaymeTiyin,
  type SubscriptionPlanId,
} from '@/lib/subscription-plans'
import {
  applySuccessfulPayment,
  campaignCap,
  clientCap,
  loadLocalSubscription,
  saveLocalSubscription,
  type LocalSubscriptionState,
} from '@/lib/local-subscription'
import { useWorkspaceStore } from '@/stores/workspace.store'

const KNOWN_PROMOS: Record<string, number> = {
  ISHONCH10: 10,
  START10: 10,
}

function formatNextPayment(iso: string | null) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatPaidAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function BillingPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [sub, setSub] = useState<LocalSubscriptionState>(() => loadLocalSubscription())
  const [promoInput, setPromoInput] = useState('')
  const [promoMsg, setPromoMsg] = useState('')
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlanId | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [amountTiyin, setAmountTiyin] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setSub(loadLocalSubscription())
  }, [])

  const currentPlan = getPlan(sub.planId)
  const capC = campaignCap(sub.planId)
  const capCl = clientCap(sub.planId)

  const discountPct = sub.promoCodeApplied ? KNOWN_PROMOS[sub.promoCodeApplied.toUpperCase()] ?? 0 : 0

  const openCheckout = useCallback((planId: SubscriptionPlanId) => {
    if (planId === 'free') return
    setCheckoutPlan(planId)
    setOrderId(null)
    setAmountTiyin(null)
  }, [])

  const startPayment = useCallback(
    async (method: 'payme' | 'click' | 'uzum') => {
      if (!checkoutPlan || checkoutPlan === 'free') return
      setBusy(true)
      setToast('')
      try {
        const res = await fetch('/api/billing/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: checkoutPlan, method }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          orderId?: string
          amountTiyin?: number
          message?: string
        }
        if (!res.ok || !data.ok || !data.orderId) {
          setToast(data.message ?? t('billing.createFailed', 'Buyurtma yaratilmadi'))
          return
        }
        setOrderId(data.orderId)
        setAmountTiyin(data.amountTiyin ?? null)
        if (method === 'payme') {
          setToast(
            t(
              'billing.paymeHint',
              "Payme: checkout merchant URL ulanishi kerak. Hozir demo — «To'lov qabul qilindi» bosing.",
            ),
          )
        } else {
          setToast(t('billing.clickHint', "Click: webhook ulanadi. Demo — «To'lov qabul qilindi»."))
        }
      } catch {
        setToast(t('billing.networkError', 'Tarmoq xatosi'))
      } finally {
        setBusy(false)
      }
    },
    [checkoutPlan, t],
  )

  const confirmDemoPayment = useCallback(async () => {
    if (!orderId) return
    setBusy(true)
    try {
      const res = await fetch('/api/billing/complete-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        result?: { planId: SubscriptionPlanId; amountUzs: number; transactionId: string; method: 'payme' | 'click' | 'uzum' }
      }
      if (!res.ok || !data.ok || !data.result) {
        setToast(t('billing.completeFailed', 'Tasdiqlanmadi'))
        return
      }
      const next = applySuccessfulPayment({
        planId: data.result.planId,
        method: data.result.method,
        transactionId: data.result.transactionId,
        amountUzs: data.result.amountUzs,
      })
      setSub(next)
      await fetch('/api/billing/order-ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      }).catch(() => {})
      setCheckoutPlan(null)
      setOrderId(null)
      setToast(t('billing.paymentOk', "To'lov qabul qilindi — plan yangilandi."))
      setTimeout(() => setToast(''), 4000)
    } catch {
      setToast(t('billing.networkError', 'Tarmoq xatosi'))
    } finally {
      setBusy(false)
    }
  }, [orderId, t])

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/billing/order-status?orderId=${encodeURIComponent(orderId)}`)
        const data = (await res.json()) as {
          ok?: boolean
          status?: string
          result?: { planId: SubscriptionPlanId; amountUzs: number; transactionId: string; method: 'payme' | 'click' | 'uzum' }
        }
        if (cancelled || !data.ok || data.status !== 'paid' || !data.result) return
        const next = applySuccessfulPayment({
          planId: data.result.planId,
          method: data.result.method,
          transactionId: data.result.transactionId,
          amountUzs: data.result.amountUzs,
        })
        setSub(next)
        await fetch('/api/billing/order-ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        }).catch(() => {})
        setCheckoutPlan(null)
        setOrderId(null)
        setToast(t('billing.paymentOk', "To'lov qabul qilindi — plan yangilandi."))
        setTimeout(() => setToast(''), 4000)
      } catch {
        /* ignore */
      }
    }, 2500)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [orderId, t])

  const applyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    if (!(code in KNOWN_PROMOS)) {
      setPromoMsg(t('billing.promoInvalid', 'Promo kod topilmadi'))
      return
    }
    setSub((prev) => {
      const next = { ...prev, promoCodeApplied: code }
      saveLocalSubscription(next)
      return next
    })
    setPromoMsg(t('billing.promoOk', 'Qo‘llandi — keyingi to‘lovda chegirma hisoblanadi (UI).'))
    setPromoInput('')
  }, [promoInput, t])

  const checkoutPlanDef = checkoutPlan ? getPlan(checkoutPlan) : null

  const paymeDeepLink = useMemo(() => {
    if (!orderId || !checkoutPlanDef || checkoutPlanDef.priceUzs <= 0) return null
    const tiyin = amountTiyin ?? uzsToPaymeTiyin(checkoutPlanDef.priceUzs)
    return `payme://checkout?order_id=${encodeURIComponent(orderId)}&amount=${tiyin}`
  }, [orderId, checkoutPlanDef, amountTiyin])

  if (!currentWorkspace) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center text-text-secondary text-sm">
        {t('billing.needWorkspace', 'Avvalo workspace tanlang.')}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 pt-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-violet-500" aria-hidden />
          {t('billing.title', 'Billing')}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {t('billing.subtitle', "O‘zbekiston: Payme / Click / Uzum — so'mda, oylik tariflar.")}
        </p>
      </div>

      {toast ? <Alert variant="success">{toast}</Alert> : null}

      {/* Hozirgi plan */}
      <Card className="p-5 md:p-6 border-border/80">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-tertiary font-medium">
              {t('billing.currentPlan', 'Hozirgi plan')}
            </p>
            <p className="text-2xl font-bold text-text-primary mt-1">{currentPlan?.name ?? sub.planId}</p>
            <p className="text-sm text-text-secondary mt-1">
              {sub.planId === 'free'
                ? t('billing.freeHint', 'Cheksiz sinov — 1 kampaniya, 7 kun data.')
                : t('billing.nextCharge', 'Keyingi to‘lov (oyning 1-kuni): {date}')
                    .replace('{date}', formatNextPayment(sub.currentPeriodEnd))}
            </p>
            {discountPct > 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                {t('billing.promoActive', 'Promo: {pct}% chegirma (keyingi to‘lov UI)')
                  .replace('{pct}', String(discountPct))}
              </p>
            ) : null}
          </div>
          <Button
            variant="secondary"
            className="rounded-xl shrink-0"
            onClick={() => document.getElementById('billing-plans')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('billing.changePlan', 'Plan o‘zgartirish')}
          </Button>
        </div>
      </Card>

      {/* Usage */}
      <Card className="p-5 border-border/80">
        <h2 className="text-sm font-semibold text-text-primary mb-3">{t('billing.usage', 'Usage')}</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-surface-2/60 border border-border/60 px-4 py-3">
            <p className="text-text-tertiary text-xs">{t('billing.usageCampaigns', 'Kampaniyalar')}</p>
            <p className="font-semibold text-text-primary mt-1">
              {sub.usageCampaigns} / {capC == null ? '∞' : capC}
            </p>
          </div>
          <div className="rounded-xl bg-surface-2/60 border border-border/60 px-4 py-3">
            <p className="text-text-tertiary text-xs">{t('billing.usageClients', 'Client accountlar (Agency)')}</p>
            <p className="font-semibold text-text-primary mt-1">
              {sub.usageClientAccounts} / {capCl}
            </p>
          </div>
        </div>
      </Card>

      {/* Tariflar */}
      <div id="billing-plans">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" aria-hidden />
          {t('billing.plansTitle', 'Tariflar (so‘m / oy)')}
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SUBSCRIPTION_PLANS.map((p) => (
            <Card
              key={p.id}
              className={cn(
                'p-4 flex flex-col border-border/80 h-full',
                p.popular && 'ring-2 ring-violet-500/40 shadow-md',
                sub.planId === p.id && 'bg-violet-500/5',
              )}
            >
              {p.popular ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-2">
                  {t('billing.popular', 'Ommabop')}
                </span>
              ) : (
                <span className="h-4 block" />
              )}
              <h3 className="text-lg font-bold text-text-primary">{p.name}</h3>
              <p className="text-2xl font-bold mt-2 text-text-primary">
                {p.priceUzs === 0 ? '0' : formatUzs(p.priceUzs)}
              </p>
              {p.approxUsd > 0 ? (
                <p className="text-xs text-text-tertiary">~${p.approxUsd} USD</p>
              ) : (
                <p className="text-xs text-text-tertiary h-4" />
              )}
              <p className="text-xs text-text-secondary mt-2">{p.tagline}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-text-secondary flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {p.id === 'free' ? (
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl"
                    disabled={sub.planId === 'free'}
                    onClick={() => {
                      setSub((prev) => {
                        const n = { ...prev, planId: 'free' as const, currentPeriodEnd: null }
                        saveLocalSubscription(n)
                        return n
                      })
                    }}
                  >
                    {sub.planId === 'free' ? t('billing.current', 'Joriy') : t('billing.downgrade', 'Free ga')}
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl"
                    variant={sub.planId === p.id ? 'secondary' : 'default'}
                    onClick={() => openCheckout(p.id)}
                    disabled={sub.planId === p.id}
                  >
                    {sub.planId === p.id ? t('billing.current', 'Joriy') : t('billing.select', 'Tanlash')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Promo */}
      <Card className="p-5 border-border/80">
        <h2 className="text-sm font-semibold text-text-primary mb-3">{t('billing.promoTitle', 'Promo kod')}</h2>
        <div className="flex flex-col sm:flex-row gap-2 max-w-md">
          <Input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="ISHONCH10"
            className="rounded-xl"
          />
          <Button type="button" variant="secondary" className="rounded-xl shrink-0" onClick={applyPromo}>
            {t('billing.promoApply', 'Qo‘llash')}
          </Button>
        </div>
        {promoMsg ? <p className="text-xs text-text-secondary mt-2">{promoMsg}</p> : null}
      </Card>

      {/* Tarix */}
      <Card className="p-5 border-border/80">
        <h2 className="text-sm font-semibold text-text-primary mb-4">{t('billing.historyTitle', "To'lov tarixi")}</h2>
        <ul className="divide-y divide-border/60">
          {sub.transactions.map((tx) => (
            <li key={tx.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{formatUzs(tx.amountUzs)}</p>
                <p className="text-xs text-text-tertiary">
                  {formatPaidAt(tx.paidAt)} · {tx.method === 'payme' ? 'Payme' : tx.method === 'click' ? 'Click' : 'Uzum'} ·{' '}
                  {tx.planId}
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                {tx.status === 'success' ? '✓' : tx.status}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Modal checkout */}
      {checkoutPlan && checkoutPlanDef ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog">
          <Card className="w-full max-w-md p-6 shadow-xl border-border">
            <h3 className="text-xl font-bold text-text-primary">{t('billing.checkoutTitle', "To'lov")}</h3>
            <p className="text-sm text-text-secondary mt-2">
              {checkoutPlanDef.name} — {formatUzs(checkoutPlanDef.priceUzs)}
            </p>
            {orderId ? (
              <p className="text-xs font-mono text-text-tertiary mt-1 break-all">
                order: {orderId} · Payme tiyin: {amountTiyin ?? uzsToPaymeTiyin(checkoutPlanDef.priceUzs)}
              </p>
            ) : null}
            <div className="mt-5 space-y-3">
              <Button
                className="w-full rounded-xl py-5 justify-between"
                disabled={busy}
                onClick={() => void startPayment('payme')}
              >
                <span className="font-semibold">Payme</span>
                <span className="text-xs opacity-80">Click, Uzcard, Humo</span>
              </Button>
              {paymeDeepLink && orderId ? (
                <p className="text-center text-[10px] font-mono text-text-tertiary break-all">{paymeDeepLink}</p>
              ) : null}
              <Button
                variant="secondary"
                className="w-full rounded-xl py-5 justify-between"
                disabled={busy}
                onClick={() => void startPayment('click')}
              >
                <span className="font-semibold">Click</span>
                <span className="text-xs opacity-80">Uzcard</span>
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-xl py-5 justify-between"
                disabled={busy}
                onClick={() => void startPayment('uzum')}
              >
                <span className="font-semibold">Uzum</span>
                <span className="text-xs opacity-80">Pay</span>
              </Button>
            </div>
            {orderId ? (
              <Button className="w-full mt-4 rounded-xl" variant="default" disabled={busy} onClick={() => void confirmDemoPayment()}>
                {t('billing.demoPaid', "To'lov qabul qilindi (demo)")}
              </Button>
            ) : null}
            <Button variant="ghost" className="w-full mt-2 rounded-xl" onClick={() => setCheckoutPlan(null)}>
              {t('billing.cancel', 'Bekor qilish')}
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
