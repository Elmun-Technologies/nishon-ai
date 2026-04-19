'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, CheckCircle2, CreditCard, Layers3, Lock, Rocket, ShieldCheck, Sparkles, Users, Wallet } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'

const coreModules = [
  { title: 'Campaign Launch System', desc: 'Objective, audience, budget va creative launch flow', href: '/launch', icon: Rocket },
  { title: 'AI Decisions Log', desc: "AI harakati, sabab va approval tarixini ko'rish", href: '/ai-decisions', icon: Brain },
  { title: 'Performance Analytics', desc: 'ROAS, CPA, CTR va trendlar bo`yicha to`liq kesim', href: '/performance', icon: BarChart3 },
  { title: 'Creative Quality Scorer', desc: 'Launchdan oldin kreativlarni AI baholash', href: '/creative-scorer', icon: Sparkles },
  { title: 'Workspace Governance', desc: 'Role, permission, ad account access boshqaruvi', href: '/settings/workspace/team', icon: Users },
  { title: 'Billing and Invoices', desc: "Planlar, to'lov usullari, invoice va order holati", href: '/settings/workspace/payments', icon: CreditCard },
]

const operationFlow = [
  { step: '01', title: 'Connect workspace', text: 'Ad accountlar, team rolelar, billing contact va access policy bir joyda sozlanadi.' },
  { step: '02', title: 'Launch and monitor', text: 'Kampaniyalar launch qilinadi, AI qarorlar logi va reporting real vaqtda kuzatiladi.' },
  { step: '03', title: 'Optimize with controls', text: 'Auto-optimization workflowlari approval rail bilan boshqariladi.' },
  { step: '04', title: 'Scale with governance', text: 'Ko`p workspace, ko`p account va jamoa bilan boshqaruv intizomi saqlanadi.' },
]

const planCards = [
  {
    name: 'Free',
    price: '0 UZS / oy',
    who: 'Test va ilk setup uchun',
    points: ['1 workspace', '3 campaign', '1 connected account', 'Marketplace hire yo`q'],
  },
  {
    name: 'Starter',
    price: '199 000 UZS / oy',
    who: 'Kichik growth teamlar uchun',
    points: ['2 workspace', '10 campaign / workspace', '2 connected account', 'Marketplace hire bor'],
  },
  {
    name: 'Growth',
    price: '499 000 UZS / oy',
    who: 'Performance operatsiyasi yuradigan jamoalar',
    points: ['5 workspace', '30 campaign / workspace', '5 connected account', 'Agent profile yaratish bor'],
    featured: true,
  },
  {
    name: 'Pro',
    price: '999 000 UZS / oy',
    who: 'AI-driven full-stack marketing ops',
    points: ['15 workspace', '100 campaign / workspace', '10 connected account', 'Custom AI agent bor'],
  },
  {
    name: 'Agency',
    price: '2 499 000 UZS / oy',
    who: 'Agency va multi-client scale',
    points: ['Unlimited workspace', 'Unlimited campaign', 'Unlimited accounts', 'Enterprise-level ops'],
  },
]

const monetizationBlocks = [
  {
    title: 'Layer 1 - Workspace subscription',
    text: 'Asosiy platforma qiymati oylik UZS obuna orqali olinadi. Plan bo`yicha limitlar serverda enforce qilinadi.',
    icon: Wallet,
  },
  {
    title: 'Layer 2 - Billing operations',
    text: 'To`lov oqimi Payme checkout + order status polling orqali yuradi. Invoice va payment methodlar workspace kesimida boshqariladi.',
    icon: CreditCard,
  },
  {
    title: 'Layer 3 - Marketplace commission model',
    text: 'Marketplace tarafida commission rate va specialist tierlar alohida boshqariladi. Ratelar workspace bo`yicha configurable.',
    icon: Layers3,
  },
]

const faqs = [
  {
    q: 'Narxlanish modelimiz oddiy fixed package emasmi?',
    a: 'Ha, monetizatsiya hybrid: platforma subscription, billing operatsion flow va marketplace commission qatlamlari bilan ishlaydi.',
  },
  {
    q: 'To`lov qayerda amalga oshadi?',
    a: 'Subscription order Payme checkout orqali ochiladi va order status platformada kuzatiladi.',
  },
  {
    q: 'Marketplace monetizatsiyasi qanday?',
    a: 'Commission ratelar specialist tier va period bo`yicha sozlanadi, bonus logikasi ham alohida qo`llab-quvvatlanadi.',
  },
  {
    q: 'Bu sahifadagi capabilitylar realmi?',
    a: 'Ha, kartalardagi linklar mavjud ichki route va ishlayotgan modullarga ulangan.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">
              Product-grade marketing operations platform
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              Build, control, and scale
              <br />
              your marketing system
            </h1>
            <p className="mt-4 max-w-xl text-lg text-text-secondary">
              Performa bir joyda launch, AI decisioning, reporting, workspace governance va billing operatsiyasini birlashtiradi.
            </p>
            <div className="mt-6 space-y-2 text-sm text-text-secondary">
              {[
                'Real feature routes, demo bo`lmagan capability map',
                'EN / RU / UZ bilan ishlaydigan product flow',
                'Subscription + commission modelga mos monetization arxitekturasi',
              ].map((line) => (
                <p key={line} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#65a30d]" />
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-[#84cc16] px-5 py-3 text-sm font-semibold text-[#1a2e05] hover:opacity-90">
                Explore the Platform
              </Link>
              <Link href="/features" className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium hover:bg-surface-2">
                View Full Feature Map
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { v: '6+', l: 'Integrated core modules' },
              { v: '5 plans', l: 'UZS subscription tiers' },
              { v: '3-layer', l: 'Monetization architecture' },
              { v: 'Workspace-first', l: 'Roles, billing, permissions, MCP access' },
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
            {coreModules.map((item) => {
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
          <div className="mb-8">
            <p className="text-sm font-medium text-[#65a30d]">How it works</p>
            <h2 className="mt-1 text-3xl font-semibold md:text-4xl">From campaign launch to governed scale</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {operationFlow.map((item) => (
              <article key={item.step} className="rounded-2xl border border-border bg-white p-5">
                <p className="text-xs font-semibold tracking-wide text-[#65a30d]">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{item.text}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-[#65a30d]">Subscription and monetization</p>
            <h2 className="mt-1 text-4xl font-semibold">Pricing aligned to real product logic</h2>
            <p className="mx-auto mt-3 max-w-3xl text-text-secondary">
              Narxlanish faqat chiroyli karta emas: backend plan-limits, Payme checkout va marketplace commission flow bilan bir xil ishlaydi.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {planCards.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-5 ${
                  plan.featured ? 'border-[#84cc16] bg-[#1f2b0f] text-white' : 'border-border bg-white'
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-xl font-semibold ${plan.featured ? 'text-[#d9f99d]' : 'text-text-primary'}`}>{plan.price}</p>
                <p className={`mt-1 text-xs ${plan.featured ? 'text-slate-300' : 'text-text-secondary'}`}>{plan.who}</p>
                <ul className={`mt-4 space-y-2 text-xs ${plan.featured ? 'text-slate-200' : 'text-text-secondary'}`}>
                  {plan.points.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 ${plan.featured ? 'text-[#d9f99d]' : 'text-[#65a30d]'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {monetizationBlocks.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-border bg-[#f8fbf2] p-5">
                  <div className="mb-3 inline-flex rounded-xl border border-border bg-white p-2 text-[#65a30d]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.text}</p>
                </article>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      <section className="border-y border-border bg-[#f8fbf2] py-16">
        <PublicContainer>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-3xl font-semibold">Security and Governance</h3>
              <p className="mt-3 text-text-secondary">
                Workspace control qatlami jamoa bilan ishlashda aniq mas`uliyat va ruxsat chegaralarini beradi.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-text-secondary">
                {[
                  'Role-based workspace access',
                  'Invite and permission controls',
                  'Billing profile governance',
                  'MCP credentials isolation',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#65a30d]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-border bg-white p-8">
              <h3 className="text-3xl font-semibold">Revenue-side visibility</h3>
              <p className="mt-3 text-text-secondary">
                Dashboard tarafida spend, result va payment holati bo`yicha amaliy qaror qabul qilishga kerakli signal bir joyda.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['Plan status', 'Live'],
                  ['Order flow', 'Tracked'],
                  ['Invoices', 'Workspace-level'],
                  ['Commission layer', 'Configurable'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-surface-2 p-3">
                    <p className="text-xs text-text-tertiary">{k}</p>
                    <p className="mt-1 text-sm font-semibold">{v}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-16">
        <PublicContainer>
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-semibold">Frequently Asked Questions</h2>
            <p className="mt-2 text-text-secondary">Platform capability va monetization bo`yicha asosiy savollar.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
              <h2 className="mt-1 text-5xl font-semibold">Build your monetization-ready growth stack</h2>
              <p className="mt-3 text-lg text-text-secondary">
                Start with your workspace, connect billing, and run controlled AI-assisted campaigns at scale.
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
                <p className="font-semibold">Operations Snapshot</p>
                <Lock className="h-4 w-4 text-[#65a30d]" />
              </div>
              <div className="space-y-3">
                {[
                  ['Launch', 'Active'],
                  ['AI Decisions', 'Monitored'],
                  ['Billing', 'Tracked'],
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
