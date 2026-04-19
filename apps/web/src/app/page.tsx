'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, CreditCard, Layers3, Rocket, Settings2, Sparkles, Users } from 'lucide-react'
import { PublicCard, PublicContainer, PublicFooter, PublicNavbar, PublicSectionHeader } from '@/components/public/PublicLayout'

const coreModules = [
  {
    title: 'Launch and Campaign Builder',
    description: 'Create campaigns, ad sets, and creatives in one guided flow with reusable templates.',
    href: '/launch',
    icon: Rocket,
  },
  {
    title: 'AI Decisions and Automation',
    description: 'Track every AI action, approve risky changes, and keep autopilot under control.',
    href: '/ai-decisions',
    icon: Brain,
  },
  {
    title: 'Performance and Reporting',
    description: 'Monitor ROAS, CPA, CTR, spend, and trends with campaign-level and account-level views.',
    href: '/performance',
    icon: BarChart3,
  },
  {
    title: 'Creative Scorer',
    description: 'Score ad creatives before launch to reduce wasted spend and improve click-through rate.',
    href: '/creative-scorer',
    icon: Sparkles,
  },
  {
    title: 'Workspace and Team Control',
    description: 'Manage members, roles, ad account access, and workspace-level permissions in one place.',
    href: '/settings/workspace/team',
    icon: Users,
  },
  {
    title: 'Billing and Subscription',
    description: 'Track plans, invoices, payment methods, and order status without leaving the platform.',
    href: '/settings/workspace/payments',
    icon: CreditCard,
  },
]

const whyPerforma = [
  {
    title: 'Built from real internal flows',
    text: 'Landing reflects actual modules already available in dashboard, not generic marketing claims.',
  },
  {
    title: 'One visual system',
    text: 'Colors and components now follow the same design tokens as the product for better brand trust.',
  },
  {
    title: 'Execution-ready structure',
    text: 'Each section sends users to working feature pages such as Launch, Reporting, Workspace, and AI Decisions.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-2 text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-surface">
        <PublicContainer className="grid gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 text-sm font-medium text-primary">Performance Operating System for Marketing Teams</p>
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
              Built for efficient operations. Designed for full control.
            </h1>
            <p className="mt-4 max-w-xl text-body-lg text-text-secondary">
              Performa connects campaign launch, creative quality, AI decisioning, reporting, and workspace governance
              into one operating layer for e-commerce and growth teams.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-95">
                Explore Dashboard
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary hover:bg-surface-2"
              >
                View Feature Map
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PublicCard className="bg-surface-2 p-4">
              <p className="text-2xl font-semibold">6+</p>
              <p className="mt-1 text-sm text-text-secondary">Integrated core modules</p>
            </PublicCard>
            <PublicCard className="bg-surface-2 p-4">
              <p className="text-2xl font-semibold">3</p>
              <p className="mt-1 text-sm text-text-secondary">Languages (EN, RU, UZ)</p>
            </PublicCard>
            <PublicCard className="bg-surface-2 p-4">
              <p className="text-2xl font-semibold">Workspace-first</p>
              <p className="mt-1 text-sm text-text-secondary">Roles, billing, permissions, MCP access</p>
            </PublicCard>
            <PublicCard className="bg-surface-2 p-4">
              <p className="text-2xl font-semibold">AI-ready</p>
              <p className="mt-1 text-sm text-text-secondary">Decision logs, scorer, optimization workflows</p>
            </PublicCard>
          </div>
        </PublicContainer>
      </section>

      <section className="py-14">
        <PublicContainer>
          <div className="mb-7 flex items-center justify-between gap-4">
            <PublicSectionHeader
              eyebrow="Platform Capability Map"
              title="Internal features that already exist in product"
            />
            <Link href="/features" className="hidden text-sm text-text-secondary hover:text-text-primary md:block">
              Open full feature page
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coreModules.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:bg-surface-2"
                >
                  <div className="mb-3 inline-flex rounded-lg border border-border p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-heading font-semibold">{item.title}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{item.description}</p>
                </Link>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      <section className="border-y border-border bg-surface py-14">
        <PublicContainer>
          <PublicSectionHeader
            eyebrow="Why this redesign"
            title="Landing now matches product architecture"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {whyPerforma.map((item) => (
              <PublicCard key={item.title} className="bg-surface-2">
                <h3 className="text-heading font-semibold">{item.title}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">{item.text}</p>
              </PublicCard>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="py-14">
        <PublicContainer>
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-10">
            <div className="grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-semibold md:text-3xl">Need a full enterprise frontend rollout next?</h2>
                <p className="mt-2 text-body text-text-secondary">
                  We prepared dedicated public pages and linked them to real platform modules. Next step is page-by-page
                  UX hardening for the complete product experience.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/solutions" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-2">
                  View Solutions
                </Link>
                <Link href="/login" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
                  Open Product
                </Link>
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="border-t border-border bg-surface py-14">
        <PublicContainer>
          <PublicSectionHeader
            eyebrow="Key Product Areas"
            title="From campaign launch to governance in one layer"
            description="Public pages now map directly to operating modules so prospects can understand how Performa works before sign-in."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Campaign Ops', href: '/launch', icon: Rocket },
              { title: 'AI Engine', href: '/ai-decisions', icon: Brain },
              { title: 'Analytics', href: '/reporting', icon: BarChart3 },
              { title: 'Automation', href: '/auto-optimization', icon: Settings2 },
              { title: 'Creative Quality', href: '/creative-scorer', icon: Sparkles },
              { title: 'Billing & Workspace', href: '/settings/workspace', icon: CreditCard },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.title} href={card.href} className="group rounded-xl border border-border bg-surface-2 p-5 hover:border-primary/40">
                  <div className="mb-3 inline-flex rounded-lg border border-border p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">Explore module details and related workflows.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </div>
  )
}
