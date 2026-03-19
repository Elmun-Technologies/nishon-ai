'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { auth, workspaces as workspacesApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setAccessToken, setCurrentWorkspace } = useWorkspaceStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await auth.login(form)
      const { accessToken, refreshToken, user } = res.data

      localStorage.setItem('nishon_refresh_token', refreshToken)
      setAccessToken(accessToken)
      setUser(user)

      // Load user's workspaces so dashboard/competitor analysis can work immediately
      const wsRes = await workspacesApi.list()
      const ws = wsRes.data?.[0] ?? null

      setError('')
      if (ws) {
        setCurrentWorkspace(ws)
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    setError('')
    // Simulate short loading
    await new Promise((r) => setTimeout(r, 600))

    const mockUser = {
      id: 'demo-user-1',
      email: 'demo@nishon.ai',
      name: 'Demo User',
      plan: 'pro',
    }
    const mockToken = 'demo_mock_token_nishon_ai'
    const mockWorkspace = {
      id: 'demo-workspace-1',
      name: 'Demo Shop',
      industry: 'E-commerce',
      monthlyBudget: 5000,
      goal: 'increase_sales',
      autopilotMode: 'assisted',
      isOnboardingComplete: true,
      aiStrategy: {
        summary:
          'Focus 60% budget on Meta retargeting high-intent audiences. Allocate 30% to Google Shopping targeting bottom-funnel keywords. Reserve 10% for TikTok awareness.',
        budgetAllocation: { meta: 60, google: 30, tiktok: 10 },
      },
    }

    localStorage.setItem('nishon_access_token', mockToken)
    localStorage.setItem('nishon_refresh_token', 'demo_refresh_token')
    setAccessToken(mockToken)
    setUser(mockUser)
    setCurrentWorkspace(mockWorkspace)
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">

      {/* Left side — branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#13131A] border-r border-[#2A2A3A] flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Nishon <span className="text-[#7C3AED]">AI</span>
          </h1>
        </div>

        <div>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#A78BFA] text-sm font-medium">AI Agent Active</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Your ads run
              <br />
              <span className="text-[#7C3AED]">themselves.</span>
            </h2>
            <p className="text-[#6B7280] text-lg leading-relaxed">
              Nishon AI manages your Meta, Google, and TikTok campaigns
              autonomously — optimizing every 2 hours, reporting daily.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: '3.2x', label: 'Average ROAS' },
              { value: '−40%', label: 'Lower CPA' },
              { value: '24/7', label: 'AI Monitoring' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#1C1C27] rounded-xl p-4 border border-[#2A2A3A]">
                <p className="text-2xl font-bold text-[#A78BFA]">{stat.value}</p>
                <p className="text-[#6B7280] text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-[#1C1C27] rounded-xl p-5 border border-[#2A2A3A]">
            <p className="text-[#D1D5DB] text-sm leading-relaxed mb-3">
              "Nishon AI replaced our targetologist and improved ROAS by 2.8x
              in the first month. We now spend 0 hours on campaign management."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
                <span className="text-xs font-bold text-[#A78BFA]">JT</span>
              </div>
              <div>
                <p className="text-white text-xs font-medium">Jasur Toshmatov</p>
                <p className="text-[#6B7280] text-xs">CEO, TechShop Uzbekistan</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[#4B5563] text-xs">
          © 2025 Nishon AI. All rights reserved.
        </p>
      </div>

      {/* Right side — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-white">
              Nishon <span className="text-[#7C3AED]">AI</span>
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">Autonomous Advertising Agent</p>
          </div>

          {/* Demo banner */}
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div className="flex-1">
                <p className="text-white font-medium text-sm mb-1">
                  See it in action — no signup needed
                </p>
                <p className="text-[#6B7280] text-xs mb-3 leading-relaxed">
                  The demo account has real campaigns, AI decisions,
                  and a complete strategy pre-loaded.
                </p>
                <Button
                  fullWidth
                  loading={loading}
                  onClick={handleDemoLogin}
                >
                  ✨ Try Demo Account
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2A2A3A]" />
            <span className="text-[#4B5563] text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-[#2A2A3A]" />
          </div>

          {/* Login form */}
          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Welcome back
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                leftIcon={<span className="text-sm">✉</span>}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                leftIcon={<span className="text-sm">🔒</span>}
              />

              {error && (
                <Alert variant="error">{error}</Alert>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
              >
                Sign in
              </Button>
            </form>

            <p className="text-center text-[#6B7280] text-sm mt-5">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-[#A78BFA] hover:text-white transition-colors font-medium"
              >
                Create one free
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <p className="text-center text-[#4B5563] text-xs mt-4">
            Demo: demo@nishon.ai / demo1234
          </p>
        </div>
      </div>
    </div>
  )
}
