'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, LineChart, ShieldCheck, Workflow } from 'lucide-react'
import { PublicContainer, PublicFooter, PublicNavbar } from '@/components/public/PublicLayout'

const solutionTracks = [
  {
    title: 'E-commerce Growth Team',
    summary: 'For teams that run full-funnel ads and need faster launch cycles with strict budget control.',
    stack: ['Launch Wizard', 'Audience Builder', 'Creative Scorer', 'Performance Dashboard'],
    cta: '/launch',
    color: 'bg-[#f4f9ea] border-[#cfe8a8]',
  },
  {
    title: 'Agency Multi-Client Operations',
    summary: 'For agencies managing multiple workspaces with role-based access and billing visibility.',
    stack: ['Workspace Team', 'Ad Accounts', 'Billing and Invoices', 'MCP Credentials'],
    cta: '/settings/workspace',
    color: 'bg-[#eef6ff] border-[#bfdbfe]',
  },
  {
    title: 'In-house AI Optimization',
    summary: 'For operators who need AI-assisted decisions with approval rails and transparent logs.',
    stack: ['AI Decisions', 'Auto Optimization', 'Budget', 'Reporting'],
    cta: '/ai-decisions',
    color: 'bg-[#f5f3ff] border-[#ddd6fe]',
  },
]

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-surface text-text-primary">
      <PublicNavbar />

      <section className="border-b border-border bg-[#f7faf2]">
        <PublicContainer className="py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
            <div>
              <p className="inline-flex rounded-full border border-[#b5d98f] bg-[#ebf8d9] px-3 py-1 text-xs font-medium text-[#3f6212]">Solution blueprints</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Pick the operating model that fits your team</h1>
              <p className="mt-4 text-lg text-text-secondary">
                Har bir solution track real ichki modullardan yig`ilgan. Marketing promise bilan product reality bir xil bo`ladi.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="text-xl font-semibold">How this page is structured</h2>
              <ul className="mt-4 space-y-3 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-[#65a30d]" />
                  Solution track by team model
                </li>
                <li className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-[#65a30d]" />
                  Module stacks mapped to routes
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#65a30d]" />
                  Governance and operational alignment
                </li>
              </ul>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-12">
        <PublicContainer>
          <div className="grid gap-5 md:grid-cols-3">
            {solutionTracks.map((track) => (
              <article key={track.title} className="rounded-2xl border border-border bg-white p-6">
                <div className={`mb-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${track.color}`}>Solution Track</div>
                <h2 className="text-2xl font-semibold">{track.title}</h2>
                <p className="mt-2 text-sm text-text-secondary">{track.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                  {track.stack.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#65a30d]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={track.cta} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#65a30d]">
                  Open related flow
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="border-y border-border bg-[#f8fbf2] py-14">
        <PublicContainer>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Step 1', 'Select track', 'Choose growth, agency, or AI-led operation model.'],
              ['Step 2', 'Review stack', 'Understand exactly which product modules support the model.'],
              ['Step 3', 'Enter flow', 'Jump directly to relevant route and start execution.'],
            ].map(([step, title, desc]) => (
              <article key={title} className="rounded-2xl border border-border bg-white p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-[#65a30d]">{step}</p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </article>
            ))}
          </div>
        </PublicContainer>
      </section>

      <section className="bg-surface py-14">
        <PublicContainer>
          <div className="rounded-3xl border border-border bg-white p-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-[1.3fr_auto] md:items-center">
              <div>
                <p className="text-sm font-medium text-[#65a30d]">Next action</p>
                <h2 className="mt-1 text-3xl font-semibold md:text-4xl">Need help choosing the right track?</h2>
                <p className="mt-3 text-text-secondary">Explore full feature map or go straight into product to test your workflow setup.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/features" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium">Open Feature Map</Link>
                <Link href="/login" className="rounded-xl bg-[#84cc16] px-4 py-2.5 text-sm font-semibold text-[#1a2e05]">Open Product</Link>
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>

      <PublicFooter />
    </main>
  )
}
