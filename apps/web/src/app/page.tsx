'use client'

import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n/use-i18n'

const ticker = ['Summit 26 · Stockholm', 'Wednesday April 15, 2026', 'Request Your Ticket Now']

export default function SellerLandingPage() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-[#031314] text-white">
      {/* Header Ticker */}
      <div className="border-b border-emerald-500/30 bg-[#123436] py-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-6 text-sm text-emerald-50/90">
          {ticker.map((item, idx) => (
            <span key={`${item}-${idx}`}>{item}</span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#071c1e]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <button onClick={() => router.push('/')} className="text-4xl font-black tracking-tight">
            Performa <span className="text-emerald-400">AI</span>
          </button>
          <button className="rounded-full bg-emerald-500 px-6 py-2 font-semibold">Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-black leading-tight">
            Advertising Platform for Agencies & Specialists
          </h1>
          <p className="mt-6 text-xl text-text-secondary">
            Automate campaigns, optimize performance, and scale faster with AI-powered insights
          </p>
          <button className="mt-8 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-white">
            Get Started Free
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center text-4xl font-bold">Key Features</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-bold">Campaign Management</h3>
            <p className="mt-2 text-text-secondary">Create, manage, and optimize campaigns across multiple platforms</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-bold">Performance Analytics</h3>
            <p className="mt-2 text-text-secondary">Real-time insights into ROAS, CPA, and campaign performance</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-bold">AI Optimization</h3>
            <p className="mt-2 text-text-secondary">Automatic budget allocation and ad creative optimization</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="text-4xl font-bold">Ready to get started?</h2>
        <p className="mt-4 text-text-secondary">Join agencies and specialists using Performa to scale their ad business</p>
        <button className="mt-8 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-white">
          Start Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a1920] py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-text-tertiary">
          <p>© 2026 Performa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
