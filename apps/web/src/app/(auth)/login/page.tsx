'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { auth, workspaces as workspacesApi } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@performa.ai',
  name: 'Demo User',
  plan: 'pro',
}

const DEMO_WORKSPACE = {
  id: 'demo-workspace-001',
  name: 'Demo Workspace',
  industry: 'ecommerce',
  monthlyBudget: 5000,
  goal: 'increase_roas',
  autopilotMode: 'assisted',
  isOnboardingComplete: true,
  aiStrategy: null,
  targetAudience: null,
  targetLocation: null,
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setAccessToken, setCurrentWorkspace } = useWorkspaceStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleDemoLogin() {
    localStorage.setItem('performa_access_token', 'demo-token-local-preview')
    setAccessToken('demo-token-local-preview')
    setUser(DEMO_USER)
    setCurrentWorkspace(DEMO_WORKSPACE)
    router.push('/dashboard')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await auth.login(form)
      const { accessToken, refreshToken, user } = res.data

      localStorage.setItem('performa_refresh_token', refreshToken)
      setAccessToken(accessToken)
      setUser(user)

      const wsRes = await workspacesApi.list()
      const ws = wsRes.data?.[0] ?? null

      if (ws) {
        setCurrentWorkspace(ws)
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email yoki parol noto\'g\'ri')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    window.location.href = auth.googleUrl()
  }

  function handleFacebookLogin() {
    window.location.href = auth.facebookUrl()
  }

  return (
    <div className="min-h-screen bg-surface-2 flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-elevated border-r border-border flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Performa <span className="text-text-secondary">AI</span>
          </h1>
        </div>

        <div>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-text-secondary text-sm font-medium">AI Agent Active</span>
            </div>
            <h2 className="text-4xl font-bold text-text-primary leading-tight mb-4">
              Reklamalaringiz<br />
              <span className="text-text-secondary">o'zi ishlaydi.</span>
            </h2>
            <p className="text-text-tertiary text-lg leading-relaxed">
              Performa Meta, Google va TikTok kampaniyalaringizni
              mustaqil boshqaradi — har 2 soatda optimallashtiradi, har kuni hisobot beradi.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: '3.2x', label: "O'rtacha ROAS" },
              { value: '−40%', label: "Past CPA" },
              { value: '24/7', label: "AI monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-2 rounded-xl p-4 border border-border">
                <p className="text-2xl font-bold text-text-secondary">{stat.value}</p>
                <p className="text-text-tertiary text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface-2 rounded-xl p-5 border border-border">
            <p className="text-text-secondary text-sm leading-relaxed mb-3">
              "Performa targetologimizni almashtirdi va birinchi oyda ROAS 2.8x oshdi.
              Endi kampaniya boshqarishga 0 soat sarflaymiz."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <span className="text-xs font-bold text-text-secondary">JT</span>
              </div>
              <div>
                <p className="text-text-primary text-xs font-medium">Jasur Toshmatov</p>
                <p className="text-text-tertiary text-xs">CEO, TechShop Uzbekistan</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-text-tertiary text-xs">© 2025 Performa. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              Performa <span className="text-text-secondary">AI</span>
            </h1>
          </div>

          <div className="bg-surface-elevated border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-6">Xush kelibsiz</h2>

            {/* Social login buttons */}
            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-surface-elevated hover:bg-surface-2 text-text-secondary font-medium py-2.5 px-4 rounded-lg border border-border transition-colors text-sm"
              >
                <GoogleIcon />
                Google orqali kirish
              </button>
              <button
                type="button"
                onClick={handleFacebookLogin}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-text-primary font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                <FacebookIcon />
                Facebook orqali kirish
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-surface-2" />
              <span className="text-text-tertiary text-xs">yoki email bilan</span>
              <div className="flex-1 h-px bg-surface-2" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="siz@kompaniya.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                leftIcon={<span className="text-sm">✉</span>}
              />

              <Input
                label="Parol"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                leftIcon={<span className="text-sm">🔒</span>}
              />

              {error && <Alert variant="error">{error}</Alert>}

              <Button type="submit" fullWidth loading={loading} size="lg">
                Kirish
              </Button>
            </form>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2 py-2.5 px-4 text-sm text-text-tertiary hover:border-text-secondary hover:text-text-secondary transition-colors"
              >
                <span>⚡</span>
                Demo kirish — hisob talab etilmaydi
              </button>
            </div>

            <p className="text-center text-text-tertiary text-sm mt-5">
              Hisobingiz yo'qmi?{' '}
              <Link href="/register" className="text-text-secondary hover:text-text-primary transition-colors font-medium">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
