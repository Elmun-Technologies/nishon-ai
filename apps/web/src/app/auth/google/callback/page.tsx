'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, workspaces as workspacesApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { setRefreshToken } from '@/lib/auth-storage'

/**
 * After successful Google OAuth, the API redirects here with tokens in the query:
 * `/auth/google/callback?accessToken=...&refreshToken=...&isNew=...`
 *
 * If you see raw JSON with status 500, the browser never reached this page —
 * Google sent you to the **API** callback and the server crashed before redirect.
 */
function GoogleOAuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setAccessToken, setCurrentWorkspace } = useWorkspaceStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const next = searchParams.get('next')
    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') ? next : null

    if (!accessToken || !refreshToken) {
      setError(
        'Tokenlar URLda yo‘q. Agar sahifada API JSON (500) ko‘rsangiz, muammo serverda — ' +
          'Render log va JWT / DB migratsiyasini tekshiring.',
      )
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setRefreshToken(refreshToken)
        setAccessToken(accessToken)

        const meRes = await auth.me()
        if (cancelled) return
        setUser(meRes.data as any)

        const wsRes = await workspacesApi.list()
        if (cancelled) return
        const list = (wsRes.data as any[]) ?? []
        const ws = list[0] ?? null

        if (ws) {
          setCurrentWorkspace(ws)
          router.replace(safeNext ?? '/dashboard')
        } else {
          router.replace(safeNext ?? '/onboarding')
        }
      } catch (e: any) {
        if (cancelled) return
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Kirishni yakunlab bo‘lmadi. Qayta urinib ko‘ring.'
        setError(typeof msg === 'string' ? msg : 'Xato')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, searchParams, setAccessToken, setCurrentWorkspace, setUser])

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-2 px-4 text-center text-text-primary">
        <p className="max-w-md text-sm text-text-secondary">{error}</p>
        <Link href="/login" className="text-sm font-medium text-accent underline">
          Login sahifasiga qaytish
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 text-text-secondary">
      <p className="text-sm">Google orqali kirish…</p>
    </main>
  )
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-surface-2 text-text-secondary">
          <p className="text-sm">Yuklanmoqda…</p>
        </main>
      }
    >
      <GoogleOAuthCallbackInner />
    </Suspense>
  )
}
