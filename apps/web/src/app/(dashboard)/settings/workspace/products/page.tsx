'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui'
import { agents, billing, meta } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Sparkles, Zap } from 'lucide-react'

export default function WorkspaceProductsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [plan, setPlan] = useState<unknown>(null)
  const [plans, setPlans] = useState<Array<{ plan: string; priceFormatted: string }>>([])
  const [spendMonth, setSpendMonth] = useState(0)
  const [orderUrl, setOrderUrl] = useState('')
  const [orderId, setOrderId] = useState('')
  const [orderState, setOrderState] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      agents.myPlan(),
      billing.getPlans(),
      currentWorkspace?.id ? meta.reporting(currentWorkspace.id, 30) : Promise.resolve({ data: null }),
    ]).then(([myPlanRes, planListRes, reportingRes]) => {
      if (cancelled) return
      if (myPlanRes.status === 'fulfilled') setPlan(myPlanRes.value.data)
      if (planListRes.status === 'fulfilled') setPlans((planListRes.value.data as any[]) ?? [])
      if (reportingRes.status === 'fulfilled') {
        const rows = ((reportingRes.value.data as any)?.rows ?? []) as Array<{ spend?: number }>
        setSpendMonth(rows.reduce((acc, r) => acc + Number(r.spend ?? 0), 0))
      }
      if (myPlanRes.status === 'rejected' && planListRes.status === 'rejected') {
        setErr(t('workspaceSettings.products.loadError', 'Failed to load product information'))
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [currentWorkspace?.id, t])

  async function openOrder(targetPlan: string) {
    if (!currentWorkspace?.id) return
    setOrdering(true)
    setErr('')
    try {
      const res = await billing.createOrder({ workspaceId: currentWorkspace.id, targetPlan })
      const paymeUrl = (res.data as any)?.paymeUrl
      const createdOrderId = (res.data as any)?.orderId
      if (paymeUrl) { setOrderUrl(paymeUrl); window.open(paymeUrl, '_blank', 'noopener,noreferrer') }
      if (createdOrderId) { setOrderId(createdOrderId); setOrderState('pending') }
    } catch (e: any) {
      setErr(e?.message ?? t('workspaceSettings.products.orderError', 'Order was not created'))
    } finally {
      setOrdering(false)
    }
  }

  async function checkOrderStatus() {
    if (!orderId) return
    setCheckingStatus(true)
    try {
      const res = await billing.getOrderStatus(orderId)
      const state = String((res.data as any)?.state ?? 'unknown')
      setOrderState(state === '2' ? 'paid' : state === '-1' ? 'cancelled' : 'pending')
    } catch (e: any) {
      setErr(e?.message ?? 'Order status olinmadi')
    } finally {
      setCheckingStatus(false)
    }
  }

  const planName = useMemo(() => {
    if (plan == null) return null
    return String((plan as any)?.planName ?? (plan as any)?.plan ?? 'Free')
  }, [plan])

  const connectedAccounts = plan != null ? Number((plan as any)?.usage?.connectedAccounts ?? 0) : 0
  const accountLimit = plan != null ? (plan as any)?.limits?.accounts : null
  const spendCap = 2500
  const spendBarPct = Math.min(100, spendMonth > 0 ? (spendMonth / spendCap) * 100 : 0)

  return (
    <div className="space-y-4">
      {/* Subscription card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="px-6 pt-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('workspaceSettings.products.subscriptionPackage', 'Subscription package')}
          </h2>
          <p className="mt-0.5 text-sm text-text-tertiary">
            {t('workspaceSettings.products.planSubtitle', 'Plan limits, billing, and usage for this workspace.')}
          </p>
        </div>

        <div className="px-6 pb-6">
          {loading && <p className="mt-6 text-sm text-text-tertiary">Loading…</p>}
          {!loading && err && <Alert className="mt-4" variant="warning">{err}</Alert>}

          {!loading && !err && plan == null && (
            <div className="mt-5 rounded-xl border border-border bg-surface-2/20 p-6">
              <p className="font-semibold text-text-primary">{t('workspaceSettings.products.freePlanTitle', 'Free workspace')}</p>
              <p className="mt-1.5 text-sm text-text-tertiary">
                {t('workspaceSettings.products.freePlanBody', 'Upgrade when you need higher spend limits, more ad accounts, and automation.')}
              </p>
            </div>
          )}

          {!loading && !err && plan != null && (
            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow">
                  P
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-text-primary">{planName}</h3>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      {t('workspaceSettings.products.trialBadge', 'Trial')}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-tertiary">
                    AdSpectr plans bundle reporting, automation, and workspace seats. Connect billing when you are ready to scale.
                  </p>
                  <button type="button" className="mt-2 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                    {t('workspaceSettings.products.seePlanDetails', 'See plan details')}
                  </button>

                  <div className="mt-5 space-y-3">
                    <ProgressRow
                      label={t('workspaceSettings.products.spendPlanLimit', 'Current ad spend plan limit')}
                      note={`Up to $${spendCap.toLocaleString()}`}
                      pct={0}
                      color="bg-border"
                    />
                    <ProgressRow
                      label={t('workspaceSettings.products.spendThisMonth', 'Ad spend this month')}
                      note={`${spendMonth >= 1000 ? `${(spendMonth / 1000).toFixed(2)}K` : `$${spendMonth.toFixed(0)}`} / ${(spendCap / 1000).toFixed(1)}K`}
                      pct={spendBarPct}
                      color="bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                  </div>

                  <p className="mt-4 text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">{t('workspaceSettings.products.accountsUsage', 'Ad accounts usage')}</span>
                    {': '}
                    <span className="font-medium tabular-nums text-text-primary">
                      {connectedAccounts}{accountLimit != null ? ` / ${String(accountLimit)}` : ''}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {t('workspaceSettings.products.accountsUsageDetail', 'Connected accounts from your plan and add-ons.')}
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-border bg-surface-2/20 p-4 text-sm lg:w-52">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {t('workspaceSettings.products.nextPayment', 'Next payment')}
                </p>
                <p className="mt-1 font-semibold text-text-primary">—</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {t('workspaceSettings.products.billingPeriodStarts', 'Billing period starts')}
                </p>
                <p className="mt-1 font-medium text-text-secondary">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button type="button" disabled
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-tertiary opacity-50">
            {t('workspaceSettings.products.cancelTrial', 'Cancel trial')}
          </button>
          <Button size="sm" type="button" loading={ordering}
            onClick={() => void openOrder('pro')} disabled={!currentWorkspace?.id}
            className="bg-emerald-600 text-white hover:bg-emerald-700">
            {t('workspaceSettings.products.manageSubscription', 'Manage subscription')}
          </Button>
        </div>

        {orderUrl && (
          <div className="mx-6 mb-5 space-y-2 rounded-xl border border-border bg-surface-2/20 p-3 text-sm">
            <p className="text-xs text-text-tertiary">
              {t('workspaceSettings.products.checkoutUrl', 'Checkout URL')}:{' '}
              <a href={orderUrl} className="break-all text-emerald-600 underline dark:text-emerald-400">{orderUrl}</a>
            </p>
            {orderId && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-tertiary">Order: {orderId}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  orderState === 'paid' ? 'bg-emerald-500/10 text-emerald-600' :
                  orderState === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600'
                }`}>{orderState || 'pending'}</span>
                <Button size="sm" variant="secondary" loading={checkingStatus} onClick={() => void checkOrderStatus()}>
                  {t('workspaceSettings.products.checkStatus', 'Check status')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add-ons */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-lg font-semibold text-text-primary">
            {t('workspaceSettings.products.recommendedAddons', 'Recommended add-ons')}
          </h3>
        </div>
        <div className="grid gap-4 px-6 pb-6 pt-4 sm:grid-cols-2">
          {plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-text-tertiary">
              Plans list loads from billing API.
            </div>
          ) : plans.map((item) => (
            <div key={item.plan}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/10 p-4 transition-colors hover:border-emerald-500/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold capitalize text-text-primary">{item.plan}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {item.priceFormatted} — server-side tracking and attribution add-ons.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" type="button"
                onClick={() => void openOrder(item.plan)}
                disabled={!currentWorkspace?.id || ordering || item.plan === 'free'}>
                {t('workspaceSettings.products.addonCta', 'Learn more')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProgressRow({ label, note, pct, color }: { label: string; note: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-text-tertiary">
        <span>{label}</span>
        <span className="font-medium text-text-secondary">{note}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
