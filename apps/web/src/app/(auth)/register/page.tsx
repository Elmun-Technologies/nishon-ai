'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Alert, Button, Input } from '@/components/ui'
import { auth } from '@/lib/api-client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await auth.register(form)
      router.push('/login')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface-2 px-4 py-10 text-text-primary">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-8">
          <p className="text-sm font-medium text-primary">Create account</p>
          <h1 className="mt-2 text-3xl font-semibold">Start using Performa in minutes</h1>
          <p className="mt-3 text-text-secondary">
            Launch campaigns, track AI decisions, and manage workspace governance from one place.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Modules', value: '20+' },
              { label: 'Languages', value: '3' },
              { label: 'Autopilot', value: 'Built-in' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-lg font-semibold">{card.value}</p>
                <p className="text-xs text-text-secondary">{card.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold">Register</h2>
          <p className="mt-1 text-sm text-text-secondary">Use your work email to create a workspace account.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@company.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="At least 8 characters"
              required
            />

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" loading={loading} fullWidth size="lg">
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
