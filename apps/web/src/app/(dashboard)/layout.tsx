'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { getAccessToken } from '@/lib/auth-storage'
import AppShell from '@/components/layout/AppShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken } = useWorkspaceStore()

  useEffect(() => {
    const token = accessToken || (typeof window !== 'undefined' ? getAccessToken() : null)
    if (!token) router.push('/login')
  }, [accessToken, router])

  return (
    <AppShell>{children}</AppShell>
  )
}
