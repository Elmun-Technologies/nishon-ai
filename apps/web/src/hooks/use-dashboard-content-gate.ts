'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { auth, platforms } from '@/lib/api-client'

export type DashboardContentGateMode =
  | 'none'
  | 'trial_expired'
  | 'onboarding'
  | 'ad_account'
  | 'loading'

function isDemoSession(params: {
  accessToken?: string | null
  email?: string | null
  workspaceId?: string | null
}): boolean {
  const token = (params.accessToken || '').toLowerCase()
  const email = (params.email || '').toLowerCase()
  const workspaceId = (params.workspaceId || '').toLowerCase()
  return (
    token.startsWith('demo-token') ||
    email === 'demo@adspectr.com' ||
    workspaceId.includes('demo-workspace')
  )
}

function isActiveAdAccountRow(a: {
  isActive?: boolean
  externalAccountId?: string | null
}): boolean {
  if (a.isActive !== true) return false
  const id = a.externalAccountId
  if (!id || typeof id !== 'string') return false
  return id.toLowerCase() !== 'pending'
}

/** FREE + explicit trial end in the past → paywall (admins and paid plans bypass). */
export function isFreeTrialExpiredForGate(user: {
  plan?: string | null
  isAdmin?: boolean
  trialEndsAt?: string | null
} | null): boolean {
  if (!user) return false
  if (user.isAdmin) return false
  if ((user.plan || 'free') !== 'free') return false
  const iso = user.trialEndsAt
  if (!iso) return false
  const end = new Date(iso).getTime()
  if (Number.isNaN(end)) return false
  return Date.now() >= end
}

/**
 * Blur / lock main dashboard content for: expired FREE trial, incomplete onboarding,
 * or missing active ad account. Exempt routes stay interactive.
 */
export function useDashboardContentGate(): {
  mode: DashboardContentGateMode
  showBlur: boolean
} {
  const pathname = usePathname() || ''
  const { currentWorkspace, accessToken, user, patchUser } = useWorkspaceStore()
  const [hasAdAccount, setHasAdAccount] = useState<boolean | null>(null)
  const [accountsLoading, setAccountsLoading] = useState(false)

  const workspaceId = currentWorkspace?.id
  const onboardingComplete = currentWorkspace?.isOnboardingComplete !== false
  const demoBypass = isDemoSession({
    accessToken,
    email: user?.email,
    workspaceId,
  })

  /** Keep plan / trial / admin in sync after Payme or clock crossing trial end. */
  useEffect(() => {
    if (!accessToken || demoBypass) return

    let cancelled = false

    const sync = () => {
      auth
        .me()
        .then(({ data }) => {
          if (cancelled || !data) return
          const u = data as Record<string, unknown>
          patchUser({
            plan: String(u.plan ?? 'free'),
            trialEndsAt: u.trialEndsAt != null ? String(u.trialEndsAt) : null,
            isAdmin: Boolean(u.isAdmin),
            ...(typeof u.email === 'string' ? { email: u.email } : {}),
            ...(typeof u.name === 'string' ? { name: u.name } : {}),
          })
        })
        .catch(() => {})
    }

    sync()
    const interval = setInterval(sync, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [accessToken, demoBypass, patchUser])

  useEffect(() => {
    if (!workspaceId || !accessToken || !onboardingComplete || demoBypass) {
      setHasAdAccount(null)
      setAccountsLoading(false)
      return
    }

    if (isFreeTrialExpiredForGate(user)) {
      setHasAdAccount(null)
      setAccountsLoading(false)
      return
    }

    let cancelled = false
    setAccountsLoading(true)

    platforms
      .getAccounts(workspaceId)
      .then((res) => {
        const raw = res.data as unknown
        const list = Array.isArray(raw) ? raw : []
        const ok = list.some((row) => isActiveAdAccountRow(row as { isActive?: boolean; externalAccountId?: string | null }))
        if (!cancelled) setHasAdAccount(ok)
      })
      .catch(() => {
        if (!cancelled) setHasAdAccount(false)
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [workspaceId, onboardingComplete, accessToken, user?.plan, user?.trialEndsAt, user?.isAdmin, demoBypass])

  return useMemo(() => {
    if (!workspaceId) {
      return { mode: 'none' as const, showBlur: false }
    }

    if (demoBypass) {
      return { mode: 'none' as const, showBlur: false }
    }

    const trialExempt = pathname.startsWith('/settings/workspace/payments')
    if (isFreeTrialExpiredForGate(user) && !trialExempt) {
      return { mode: 'trial_expired' as const, showBlur: true }
    }

    const onboardingExempt =
      pathname.startsWith('/settings/workspace') || pathname.startsWith('/onboarding')

    if (!onboardingComplete) {
      if (onboardingExempt) {
        return { mode: 'none' as const, showBlur: false }
      }
      return { mode: 'onboarding' as const, showBlur: true }
    }

    if (accountsLoading || hasAdAccount === null) {
      return { mode: 'loading' as const, showBlur: true }
    }

    const adExempt = pathname.startsWith('/settings/meta')
    if (hasAdAccount === false && !adExempt) {
      return { mode: 'ad_account' as const, showBlur: true }
    }

    return { mode: 'none' as const, showBlur: false }
  }, [
    workspaceId,
    demoBypass,
    pathname,
    user,
    onboardingComplete,
    accountsLoading,
    hasAdAccount,
  ])
}
