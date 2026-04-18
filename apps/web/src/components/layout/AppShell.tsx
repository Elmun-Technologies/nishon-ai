'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken } = useWorkspaceStore()

  useEffect(() => {
    const token =
      accessToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('performa_access_token') : null)

    if (!token) {
      router.push('/login')
    }
  }, [accessToken, router])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-2 text-text-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
