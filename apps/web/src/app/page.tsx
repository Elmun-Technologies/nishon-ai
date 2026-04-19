'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, Check, CreditCard, Lock, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'

const featureCards = [
  { title: 'Campaign Launch System', desc: 'Objective, audience, budget va creative launch flow', href: '/launch', icon: Rocket },
  { title: 'AI Decisions Log', desc: "AI harakati, sabab va approval tarixini ko'rish", href: '/ai-decisions', icon: Brain },
  { title: 'Performance Analytics', desc: 'ROAS, CPA, CTR va trendlar bo‘yicha to‘liq kesim', href: '/performance', icon: BarChart3 },
  { title: 'Creative Quality Scorer', desc: 'Launchdan oldin kreativlarni AI baholash', href: '/creative-scorer', icon: Sparkles },
  { title: 'Workspace Governance', desc: 'Role, permission, ad account access boshqaruvi', href: '/settings/workspace/team', icon: Users },
  { title: 'Billing and Invoices', desc: "Planlar, to'lov usullari, invoice va order holati", href: '/settings/workspace/payments', icon: CreditCard },
]

const securityItems = [
  'Role-based workspace access',
  'Invite and permission controls',
  'Billing profile governance',
  'MCP credentials isolation',
]

const pricing = [
  { name: 'Starter', price: '$0', desc: "Small teams uchun boshlang'ich paket", points: ['Core dashboard', 'Basic reporting', '1 workspace'] },
  { name: 'Growth', price: '$29', desc: 'Performance teams uchun optimal paket', points: ['AI Decisions', 'Auto Optimization', 'Full reporting'], featured: true },
  { name: 'Scale', price: '$99', desc: 'Agency va multi-workspace operatsiyalar', points: ['Team governance', 'Billing suite', 'Priority support'] },
]

const faqs = [
  { q: 'Performa nima qiladi?', a: 'Performa marketing operatsiyani launch, AI, analytics va workspace governance orqali birlashtiradi.' },
  { q: 'Featurelar realmi yoki demo?', a: 'Landingdagi asosiy bloklar real route va mavjud modulga ulangan.' },
  { q: "Qaysi tillar qo'llab-quvvatlanadi?", a: 'Platforma EN, RU va UZ tillarida ishlaydi.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">
              New Update - Internal feature map connected
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              Making Marketing Operations
              <br />
              Clear, Fast, and Controlled
            </h1>
            <p className="mt-4 max-w-xl text-lg text-text-secondary">
              Performa gives one control plane for launch, AI-driven optimization, reporting, and workspace governance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05] hover:opacity-90">
                Explore the Platform
              </Link>
              <Link href="/features" className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium hover:bg-surface-2">
                View Features
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { v: '6+', l: 'Integrated core modules' },
              { v: '3', l: 'Languages (EN, RU, UZ)' },
              { v: 'Workspace-first', l: 'Roles, billing, permissions, MCP access' },
              { v: 'AI-ready', l: 'Decision logs, scorer, optimization workflows' },
            ].map((item) => (
              <article key={item.l} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-2xl font-semibold">{item.v}</p>
                <p className="mt-1 text-sm text-text-secondary">{item.l}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-9">
            <p className="text-sm font-medium text-[#65a30d]">Platform Capability Map</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">Internal features that already exist in product</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.title} href={item.href} className="group rounded-2xl border border-border bg-white p-6 transition hover:border-[#84cc16]/60">
                  <div className="mb-3 inline-flex rounded-xl border border-border bg-[#f4f9ea] p-2 text-[#65a30d]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-heading font-semibold">{item.title}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{item.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                    Open module
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-3xl font-semibold">Reporting and Analytics</h3>
              <p className="mt-3 text-text-secondary">
                Real campaign data, spend trends, and ROAS snapshots in one view to support faster decisions.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-tertiary">Total Spend</p>
                  <p className="font-semibold">$240K</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-tertiary">Avg ROAS</p>
                  <p className="font-semibold">4.3x</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <p className="text-xs text-text-tertiary">Active</p>
                  <p className="font-semibold">52</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-3xl font-semibold">Security and Governance</h3>
              <p className="mt-3 text-text-secondary">
                Workspace controls are designed for team-based operations with clear responsibility boundaries.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-text-secondary">
                {securityItems.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#65a30d]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-[#65a30d]">Flexible plans</p>
            <h2 className="mt-1 text-4xl font-semibold">Plans for every growth stage</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-6 ${
                  plan.featured ? 'border-[#84cc16] bg-[#1f2b0f] text-white' : 'border-border bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {plan.featured && <span className="rounded-full bg-[#84cc16]/20 px-2 py-0.5 text-xs text-[#d9f99d]">Most Popular</span>}
                </div>
                <p className={`mt-2 text-3xl font-semibold ${plan.featured ? 'text-[#d9f99d]' : 'text-text-primary'}`}>{plan.price}</p>
                <p className={`mt-1 text-sm ${plan.featured ? 'text-slate-300' : 'text-text-secondary'}`}>{plan.desc}</p>
                <ul className={`mt-4 space-y-2 text-sm ${plan.featured ? 'text-slate-200' : 'text-text-secondary'}`}>
                  {plan.points.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className={`h-4 w-4 ${plan.featured ? 'text-[#d9f99d]' : 'text-[#65a30d]'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium ${
                    plan.featured ? 'bg-[#84cc16] text-[#1a2e05]' : 'border border-border bg-surface-2'
                  }`}
                >
                  Get Started
                </button>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-semibold">Frequently Asked Questions</h2>
            <p className="mt-2 text-text-secondary">Answers to core questions about platform capability and safety.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <article key={item.q} className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-lg font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-text-secondary">{item.a}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-sm font-medium text-[#65a30d]">Final CTA</p>
              <h2 className="mt-1 text-5xl font-semibold">Let&apos;s plan your performance growth</h2>
              <p className="mt-3 text-lg text-text-secondary">
                Connect your workspace and launch your first controlled AI-assisted campaign flow.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05]">
                  Start Free
                </Link>
                <Link href="/solutions" className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium">
                  View Solutions
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-[#f8fbf2] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">Internal Product Snapshot</p>
                <Lock className="h-4 w-4 text-[#65a30d]" />
              </div>
              <div className="space-y-3">
                {[
                  ['Launch', 'Active'],
                  ['AI Decisions', 'Monitored'],
                  ['Reporting', 'Live'],
                  ['Workspace', 'Protected'],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5">
                    <span className="text-sm">{label}</span>
                    <span className="text-xs font-medium text-[#65a30d]">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
