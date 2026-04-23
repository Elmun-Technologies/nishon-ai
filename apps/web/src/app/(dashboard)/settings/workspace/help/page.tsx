'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { BookOpen, ExternalLink, HelpCircle, Lightbulb, Search, BookOpenCheck } from 'lucide-react'

const LINKS = [
  { title: 'Creative Hub', href: '/creative-hub', keywords: 'kreativ shablonlar media' },
  { title: 'Meta dashboard (ad accounts)', href: '/settings/meta', keywords: 'facebook spend account' },
  { title: 'Kampaniya yoqish', href: '/launch', keywords: 'launch wizard' },
  { title: 'Hisobot', href: '/reporting', keywords: 'reporting meta' },
  { title: 'Hisobot quruvchi', href: '/reports', keywords: 'dashboard drag metrics shablon' },
  { title: 'Ad Library', href: '/ad-library', keywords: 'raqib reklama meta library' },
  { title: 'Audience Story', href: '/audiences/story', keywords: 'persona journey dilnoza' },
  { title: 'Hujjatlar', href: '/docs', keywords: "docs qo'llanma" },
]

export default function ResourceCenterPage() {
  const { user } = useWorkspaceStore()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return LINKS
    return LINKS.filter((l) => l.title.toLowerCase().includes(s) || l.keywords.toLowerCase().includes(s))
  }, [q])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'there'

  function trackClick(topic: string) {
    if (typeof window === 'undefined') return
    try {
      navigator.sendBeacon?.('/api/track', JSON.stringify({ event: 'workspace_help_topic_click', topic, userId: user?.id ?? null, ts: Date.now() }))
    } catch { /* no-op */ }
  }

  return (
    <div className="space-y-6">
      {/* Greeting + search */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
            <HelpCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Hello, {firstName}.</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">Help docs, quick links, and onboarding resources — all in one place.</p>
          </div>
        </div>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you need help with?"
            className="pl-9"
          />
        </div>
      </section>

      {/* Quick links grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/docs" onClick={() => trackClick('app_guide')} className="group">
          <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-sm transition-all hover:border-brand-mid/30 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text-primary">App guide</h3>
            <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
              Module-by-module instructions and product documentation.
            </p>
          </div>
        </Link>
        <a href="https://adspectr.com" target="_blank" rel="noreferrer" onClick={() => trackClick('help_center')} className="group">
          <div className="relative flex h-full flex-col rounded-2xl border border-border/70 bg-surface p-5 shadow-sm transition-all hover:border-brand-mid/30 hover:shadow-md">
            <ExternalLink className="absolute right-4 top-4 h-3.5 w-3.5 text-text-tertiary" />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text-primary">Help center</h3>
            <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
              External support site with FAQs, tutorials, and updates.
            </p>
          </div>
        </a>
      </div>

      {/* Feature request */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">Request a feature</p>
            <p className="mt-0.5 text-xs text-text-tertiary">Tell us what you want in the next release.</p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
        </div>
      </section>

      {/* Popular topics */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">Popular topics</p>
        <ul className="mt-3 divide-y divide-border/50">
          {filtered.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => trackClick(l.title)}
                className="flex items-center justify-between gap-2 py-3 text-sm text-text-primary transition-colors hover:text-brand-mid"
              >
                <span className="flex items-center gap-2.5">
                  <BookOpenCheck className="h-3.5 w-3.5 shrink-0 text-brand-mid/60" />
                  {l.title}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-text-tertiary" />
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-8 text-center text-sm text-text-tertiary">No results for &quot;{q}&quot;</li>
          )}
        </ul>
      </section>

      <p className="text-right text-xs text-text-tertiary">
        User ID: <span className="font-mono">{user?.id?.slice(0, 8) ?? '—'}…</span>
      </p>
    </div>
  )
}
