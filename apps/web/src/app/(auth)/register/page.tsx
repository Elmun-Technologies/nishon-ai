'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { auth } from '@/lib/api-client'
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

function getPasswordStrength(password: string) {
  if (!password) return { level: 0, label: '', color: '' }
  if (password.length < 6) return { level: 1, label: 'Kuchsiz', color: 'bg-red-500' }
  if (password.length < 10) return { level: 2, label: "O'rtacha", color: 'bg-amber-500' }
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { level: 4, label: 'Kuchli', color: 'bg-emerald-500' }
  }
  return { level: 3, label: 'Yaxshi', color: 'bg-blue-500' }
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
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.name || form.name.trim().length < 2) e.name = "Ism kamida 2 ta harf bo'lishi kerak"
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "To'g'ri email kiriting"
    if (!form.password || form.password.length < 8) e.password = "Parol kamida 8 ta belgidan iborat bo'lishi kerak"
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Parollar mos kelmaydi'
    setErrors(e)
    return Object.keys(e).length === 0
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
      localStorage.setItem('performa_refresh_token', refreshToken)
      setAccessToken(accessToken)
      setUser(user)
      router.push('/onboarding')
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || "Ro'yxatdan o'tishda xato yuz berdi. Qayta urinib ko'ring."
      )
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleRegister() {
    window.location.href = auth.googleUrl()
  }

  function handleFacebookRegister() {
    window.location.href = auth.facebookUrl()
  }

  const passwordStrength = getPasswordStrength(form.password)

  return (
    <div className="min-h-screen bg-surface-2 dark:bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Performa <span className="text-text-secondary">AI</span>
          </h1>
          <p className="text-text-tertiary text-sm mt-1">
            AI bilan reklama boshqarishni boshlang
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Hisob yaratish
          </h2>

          {/* Social login buttons */}
          <div className="flex flex-col gap-2 mb-4">
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-surface-2 text-text-secondary font-medium py-2.5 px-4 rounded-lg border border-border transition-colors text-sm"
            >
              <GoogleIcon />
              Google orqali ro'yxatdan o'tish
            </button>
            <button
              type="button"
              onClick={handleFacebookRegister}
              className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-text-primary font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <FacebookIcon />
              Facebook orqali ro'yxatdan o'tish
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-surface-2 dark:bg-surface" />
            <span className="text-text-tertiary text-xs">yoki email bilan</span>
            <div className="flex-1 h-px bg-surface-2 dark:bg-surface" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="To'liq ism"
              type="text"
              placeholder="Jasur Toshmatov"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              leftIcon={<span className="text-sm">👤</span>}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="siz@kompaniya.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
              leftIcon={<span className="text-sm">✉</span>}
              required
            />

            <div>
              <Input
                label="Parol"
                type="password"
                placeholder="Kamida 8 ta belgi"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                error={errors.password}
                leftIcon={<span className="text-sm">🔒</span>}
                required
              />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : 'bg-surface-2 dark:bg-surface'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">{passwordStrength.label}</p>
                </div>
              )}
            </div>

            <Input
              label="Parolni tasdiqlang"
              type="password"
              placeholder="Xuddi shu parol"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              leftIcon={<span className="text-sm">🔒</span>}
              required
            />

            {serverError && <Alert variant="error">{serverError}</Alert>}

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Bepul hisob yaratish
            </Button>
          </form>

          <p className="text-center text-text-tertiary text-sm mt-5">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors font-medium">
              Kirish
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          {["Kredit karta shart emas", "Bepul boshlash", 'Istalgan vaqt bekor qilish'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span className="text-emerald-400 text-xs">✓</span>
              <span className="text-text-tertiary text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
