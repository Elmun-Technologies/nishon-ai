'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { BookOpen, ExternalLink, HelpCircle, Lightbulb, Search } from 'lucide-react'

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
    return LINKS.filter(
      (l) =>
        l.title.toLowerCase().includes(s) ||
        l.keywords.toLowerCase().includes(s),
    )
  }, [q])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'AdSpectr foydalanuvchisi'

  function trackClick(topic: string) {
    if (typeof window === 'undefined') return
    try {
      const payload = JSON.stringify({
        event: 'workspace_help_topic_click',
        topic,
        userId: user?.id ?? null,
        ts: Date.now(),
      })
      navigator.sendBeacon?.('/api/track', payload)
    } catch {
      // no-op tracking
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-text-tertiary">
        Hello, {firstName}. Help docs, quick links, and onboarding resources.
      </p>

      <div className="relative rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What do you need help with?"
          className="pr-10"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/docs" onClick={() => trackClick('app_guide')}>
          <Card className="h-full rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm transition-colors hover:shadow-md dark:bg-slate-900/70">
            <BookOpen className="h-10 w-10 text-primary" />
            <h3 className="mt-3 text-heading-lg text-text-primary">App guide</h3>
            <p className="mt-1 text-body text-text-tertiary">
              Module-by-module instructions and product documentation.
            </p>
          </Card>
        </Link>
        <a href="https://adspectr.com" target="_blank" rel="noreferrer" onClick={() => trackClick('help_center')}>
          <Card className="relative h-full rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm transition-colors hover:shadow-md dark:bg-slate-900/70">
            <ExternalLink className="absolute right-4 top-4 h-4 w-4 text-text-tertiary" />
            <HelpCircle className="h-10 w-10 text-primary" />
            <h3 className="mt-3 text-heading-lg text-text-primary">Help center</h3>
            <p className="mt-1 text-body text-text-tertiary">
              External support site with FAQs, tutorials, and updates.
            </p>
          </Card>
        </a>
      </div>

      <div>
        <p className="text-label font-medium uppercase tracking-wider text-text-tertiary">Additional</p>
        <Card className="mt-2 flex items-center gap-4 rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
          <Lightbulb className="h-8 w-8 shrink-0 text-primary" />
          <div>
            <p className="text-heading text-text-primary">Request a feature</p>
            <p className="text-body-sm text-text-tertiary">Tell us what you want in the next release.</p>
          </div>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-text-tertiary" />
        </Card>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <p className="text-heading-sm text-primary">Popular topics</p>
        <ul className="mt-2 space-y-2">
          {filtered.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => trackClick(l.title)} className="inline-flex items-center gap-2 text-sm text-text-primary hover:text-primary">
                {l.title}
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-right text-label text-text-tertiary">User ID {user?.id?.slice(0, 8) ?? '—'}…</p>
    </div>
  )
}
