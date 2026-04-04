'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { workspaces as workspacesApi, auth } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Landing page after Google OAuth redirect.
 * Backend redirects here with ?accessToken=...&refreshToken=...
 * We store the tokens and forward the user to the right page.
 */
export default function GoogleCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { setUser, setAccessToken, setCurrentWorkspace } = useWorkspaceStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const accessToken  = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (!accessToken || !refreshToken) {
      setError("Google orqali kirishda xato yuz berdi. Qayta urinib ko'ring.")
      return
    }

    async function finish() {
      try {
        // Store tokens
        localStorage.setItem('performa_access_token', accessToken!)
        localStorage.setItem('performa_refresh_token', refreshToken!)
        setAccessToken(accessToken!)

        // Fetch current user (apiClient reads token from localStorage automatically)
        const meRes = await auth.me()
        setUser((meRes as any).data)

        // Check if workspace exists
        const wsRes = await workspacesApi.list()
        const ws = (wsRes as any).data?.[0] ?? null

        if (ws) {
          setCurrentWorkspace(ws)
          router.replace('/dashboard')
        } else {
          router.replace('/onboarding')
        }
      } catch {
        setError("Serverga ulanishda xato. Sahifani yangilang.")
      }
    }

    finish()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-slate-50 text-sm underline"
          >
            Loginga qaytish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-4">
      <Spinner />
      <p className="text-slate-500 dark:text-slate-400 text-sm">Google orqali kirilmoqda...</p>
    </div>
  )
}
