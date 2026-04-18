'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert, PageHeader } from '@/components/ui'
import { agents, billing, meta } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'

export default function WorkspaceProductsPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [plan, setPlan] = useState<unknown>(null)
  const [plans, setPlans] = useState<Array<{ plan: string; priceFormatted: string }>>([])
  const [spendMonth, setSpendMonth] = useState(0)
  const [orderUrl, setOrderUrl] = useState('')
  const [orderId, setOrderId] = useState('')
  const [orderState, setOrderState] = useState<string>('')
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
    ])
      .then((results) => {
        if (cancelled) return
        const [myPlanRes, planListRes, reportingRes] = results
        if (myPlanRes.status === 'fulfilled') setPlan(myPlanRes.value.data)
        if (planListRes.status === 'fulfilled') {
          setPlans((planListRes.value.data as any[]) ?? [])
        }
        if (reportingRes.status === 'fulfilled') {
          const rows = ((reportingRes.value.data as any)?.rows ?? []) as Array<{ spend?: number }>
          const sum = rows.reduce((acc, row) => acc + Number(row.spend ?? 0), 0)
          setSpendMonth(sum)
        }
        if (
          myPlanRes.status === 'rejected' &&
          planListRes.status === 'rejected'
        ) {
          setErr(t('workspaceSettings.products.loadError', 'Failed to load product information'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentWorkspace?.id])

  async function openOrder(targetPlan: string) {
    if (!currentWorkspace?.id) return
    setOrdering(true)
    setErr('')
    try {
      const res = await billing.createOrder({
        workspaceId: currentWorkspace.id,
        targetPlan,
      })
      const paymeUrl = (res.data as any)?.paymeUrl
      const createdOrderId = (res.data as any)?.orderId
      if (paymeUrl) {
        setOrderUrl(paymeUrl)
        window.open(paymeUrl, '_blank', 'noopener,noreferrer')
      }
      if (createdOrderId) {
        setOrderId(createdOrderId)
        setOrderState('pending')
      }
    } catch (e: any) {
      setErr(e?.message ?? t('workspaceSettings.products.orderError', 'Order was not created'))
    } finally {
      setOrdering(false)
    }
  }

  async function checkOrderStatus() {
    if (!orderId) return
    setCheckingStatus(true)
    setErr('')
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('workspaceSettings.tabs.products', 'Products')}
        subtitle={currentWorkspace?.name ?? t('workspaceSettings.title', 'Workspace settings')}
      />
      <Card>
        <h2 className="text-lg font-semibold text-text-primary">Obuna va foydalanish</h2>
        <p className="mt-1 text-sm text-text-tertiary">
          Reja, trial, keyingi to'lov sanasi va spend limitlari (Madgicx &quot;Products &amp; Usage&quot; analogi).
        </p>
        {loading && (
          <p className="mt-4 text-sm text-text-tertiary">Yuklanmoqda…</p>
        )}
        {!loading && err && <Alert className="mt-4" variant="warning">{err}</Alert>}
        {!loading && !err && plan != null && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2/30 p-3">
              <p className="text-xs text-text-tertiary">Joriy reja</p>
              <p className="mt-1 text-base font-semibold text-text-primary">
                {(plan as any)?.planName ?? (plan as any)?.plan ?? 'Free'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/30 p-3">
              <p className="text-xs text-text-tertiary">30 kunlik spend</p>
              <p className="mt-1 text-base font-semibold text-text-primary">${spendMonth.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2/30 p-3">
              <p className="text-xs text-text-tertiary">Account usage</p>
              <p className="mt-1 text-base font-semibold text-text-primary">
                {(plan as any)?.usage?.connectedAccounts ?? 0} / {(plan as any)?.limits?.accounts ?? '∞'}
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" type="button" disabled>
            Cancel trial
          </Button>
          <Button
            size="sm"
            type="button"
            loading={ordering}
            onClick={() => void openOrder('pro')}
            disabled={!currentWorkspace?.id}
          >
            Manage subscription
          </Button>
        </div>
        {orderUrl && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-text-tertiary">
              Checkout URL: <a href={orderUrl} className="text-violet-400 underline">{orderUrl}</a>
            </p>
            {orderId && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2/20 px-3 py-2">
                <span className="text-xs text-text-tertiary">Order: {orderId}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${orderState === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : orderState === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {orderState || 'pending'}
                </span>
                <Button size="sm" variant="secondary" loading={checkingStatus} onClick={() => void checkOrderStatus()}>
                  Check status
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-text-primary">Tavsiya etilgan qo'shimchalar</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {plans.map((item) => (
            <div key={item.plan} className="rounded-xl border border-border bg-surface-2/20 p-3">
              <p className="text-sm font-semibold text-text-primary capitalize">{item.plan}</p>
              <p className="mt-1 text-xs text-text-tertiary">{item.priceFormatted}</p>
              <Button
                size="sm"
                className="mt-3"
                type="button"
                variant="secondary"
                onClick={() => void openOrder(item.plan)}
                disabled={!currentWorkspace?.id || ordering || item.plan === 'free'}
              >
                Tanlash
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
