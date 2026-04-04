'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { accessToken } = useWorkspaceStore()

  useEffect(() => {
    // If no token in store or localStorage, redirect to login
    const token =
      accessToken || (typeof window !== 'undefined'
        ? localStorage.getItem('performa_access_token')
        : null)

    if (!token) {
      router.push('/login')
    }
  }, [accessToken, router])

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}