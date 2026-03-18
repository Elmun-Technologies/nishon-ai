'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from 'components/ui'
import { Input } from 'components/ui'
import { Alert } from 'components/ui'
import { auth } from 'lib/api-client'
import { useWorkspaceStore } from 'stores/workspace.store'

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setAccessToken } = useWorkspaceStore()
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!form.password || form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError('')

    try {
      const res = await auth.register({
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
      })
      const { accessToken, refreshToken, user } = res.data
      localStorage.setItem('nishon_refresh_token', refreshToken)
      setAccessToken(accessToken)
      setUser(user)
      // New users go to onboarding first
      router.push('/onboarding')
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  function getPasswordStrength(password: string): {
    level: number
    label: string
    color: string
  } {
    if (!password) return { level: 0, label: '', color: '' }
    if (password.length < 6) return { level: 1, label: 'Weak', color: 'bg-red-500' }
    if (password.length < 10) return { level: 2, label: 'Fair', color: 'bg-amber-500' }
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, label: 'Strong', color: 'bg-emerald-500' }
    }
    return { level: 3, label: 'Good', color: 'bg-blue-500' }
  }

  const passwordStrength = getPasswordStrength(form.password)

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Nishon <span className="text-[#7C3AED]">AI</span>
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Start managing ads with AI — free to try
          </p>
        </div>

        {/* Benefits row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: '🤖', text: 'AI Strategy' },
            { icon: '📊', text: 'Auto Reports' },
            { icon: '💰', text: 'Better ROAS' },
          ].map((item) => (
            <div
              key={item.text}
              className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-3 text-center"
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-[#9CA3AF] text-xs font-medium">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Register form */}
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Jasur Toshmatov"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              leftIcon={<span className="text-sm">👤</span>}
              required
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
              leftIcon={<span className="text-sm">✉</span>}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                error={errors.password}
                leftIcon={<span className="text-sm">🔒</span>}
                required
              />
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : 'bg-[#2A2A3A]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type="password"
              placeholder="Same password again"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              leftIcon={<span className="text-sm">🔒</span>}
              required
            />

            {serverError && (
              <Alert variant="error">{serverError}</Alert>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              className="mt-2"
            >
              Create free account
            </Button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-5">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#A78BFA] hover:text-white transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {['No credit card', 'Free to start', 'Cancel anytime'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span className="text-emerald-400 text-xs">✓</span>
              <span className="text-[#4B5563] text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
