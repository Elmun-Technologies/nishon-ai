'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { getAccessToken } from '@/lib/auth-storage'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken } = useWorkspaceStore()

  useEffect(() => {
    const token = accessToken || (typeof window !== 'undefined' ? getAccessToken() : null)

    if (!token) {
      router.push('/login')
    }
  }, [accessToken, router])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-brand-white via-[#f2faeb] to-brand-lime/25 text-text-primary dark:from-brand-ink dark:via-[#1f3510] dark:to-brand-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  )
}
