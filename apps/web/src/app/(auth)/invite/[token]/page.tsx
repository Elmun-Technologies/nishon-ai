'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui'
import { team } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { getAccessToken } from '@/lib/auth-storage'

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = typeof params?.token === 'string' ? params.token : ''
  const { accessToken } = useWorkspaceStore()
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const tryAccept = useCallback(async () => {
    const tok = getAccessToken() || accessToken
    if (!tok) {
      setMsg('Avval tizimga kiring — shu email bilan.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      await team.acceptInvite({ token })
      setMsg("Qo'shildingiz! Jamoa sahifasiga o'ting.")
      setTimeout(() => router.push('/team'), 1500)
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
      setErr(m ?? (e as Error)?.message ?? 'Taklif qabul qilinmadi')
    } finally {
      setBusy(false)
    }
  }, [accessToken, router, token])

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-surface-2">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <h1 className="text-xl font-bold text-text-primary">Workspace taklifi</h1>
        <p className="text-sm text-text-secondary mt-2">
          Token orqali jamoaga qo‘shilasiz. Email taklifdagi bilan bir xil bo‘lishi kerak.
        </p>
        {err ? (
          <Alert variant="error" className="mt-4">
            {err}
          </Alert>
        ) : null}
        {msg ? (
          <Alert variant="success" className="mt-4">
            {msg}
          </Alert>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <Button className="rounded-xl" loading={busy} onClick={() => void tryAccept()}>
            Qabul qilish
          </Button>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Tizimga kirish</Link>
          </Button>
          <Link href="/" className="text-center text-sm text-text-tertiary hover:text-text-secondary">
            Bosh sahifa
          </Link>
        </div>
      </div>
    </main>
  )
}
