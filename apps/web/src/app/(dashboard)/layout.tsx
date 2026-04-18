'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/layout/Sidebar'

const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: false,
  loading: () => <div className="h-16 bg-surface-2" />,
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken } = useWorkspaceStore()

  useEffect(() => {
    const token = accessToken || (typeof window !== 'undefined'
      ? localStorage.getItem('performa_access_token')
      : null)
    if (!token) router.push('/login')
  }, [accessToken, router])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--c-surface-2)', color: 'var(--c-text-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--c-surface-2)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
