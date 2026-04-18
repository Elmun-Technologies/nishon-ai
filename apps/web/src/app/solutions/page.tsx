'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

const solutionTracks = [
  {
    title: 'E-commerce Growth Team',
    summary: 'For teams that run full-funnel ads and need faster launch cycles with strict budget control.',
    stack: ['Launch Wizard', 'Audience Builder', 'Creative Scorer', 'Performance Dashboard'],
    cta: '/launch',
  },
  {
    title: 'Agency Multi-Client Operations',
    summary: 'For agencies managing multiple workspaces with role-based access and billing visibility.',
    stack: ['Workspace Team', 'Ad Accounts', 'Billing and Invoices', 'MCP Credentials'],
    cta: '/settings/workspace',
  },
  {
    title: 'In-house AI Optimization',
    summary: 'For operators who need AI-assisted decisions with approval rails and transparent logs.',
    stack: ['AI Decisions', 'Auto Optimization', 'Budget', 'Reporting'],
    cta: '/ai-decisions',
  },
]

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-surface-2 text-text-primary">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <p className="mt-4 text-sm font-medium text-primary">Solution Blueprints</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Ready-to-use frontend scenarios from platform capabilities</h1>
          <p className="mt-3 max-w-3xl text-body text-text-secondary">
            These solution tracks are built from existing product modules. They help align marketing message, UI structure,
            and actual in-product workflows without gap.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {solutionTracks.map((track) => (
            <article key={track.title} className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-heading-lg font-semibold">{track.title}</h2>
              <p className="mt-2 text-body-sm text-text-secondary">{track.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                {track.stack.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href={track.cta} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open related flow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
