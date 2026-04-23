'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
  { title: "Hujjatlar", href: '/docs', keywords: "docs qo'llanma" },
]

export default function ResourceCenterPage() {
  const { user } = useWorkspaceStore()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return LINKS
    return LINKS.filter((l) => l.title.toLowerCase().includes(s) || l.keywords.toLowerCase().includes(s))
  }, [q])

  const firstName = user?.name?.split(/\s+/)[0] ?? 'AdSpectr foydalanuvchisi'

  function trackClick(topic: string) {
    if (typeof window === 'undefined') return
    try {
      navigator.sendBeacon?.('/api/track', JSON.stringify({ event: 'workspace_help_topic_click', topic, userId: user?.id ?? null, ts: Date.now() }))
    } catch { /* noop */ }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-tertiary">Hello, {firstName}. Help docs, quick links, and onboarding resources.</p>

      {/* Search */}
      <div className="relative rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-2 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you need help with?"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Main links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/docs" onClick={() => trackClick('app_guide')}
          className="block rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900">
          <BookOpen className="h-9 w-9 text-emerald-600" />
          <h3 className="mt-3 font-semibold text-text-primary">App guide</h3>
          <p className="mt-1 text-sm text-text-tertiary">Module-by-module instructions and product documentation.</p>
        </Link>
        <a href="https://adspectr.com" target="_blank" rel="noreferrer" onClick={() => trackClick('help_center')}
          className="relative block rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900">
          <ExternalLink className="absolute right-4 top-4 h-4 w-4 text-text-tertiary" />
          <HelpCircle className="h-9 w-9 text-emerald-600" />
          <h3 className="mt-3 font-semibold text-text-primary">Help center</h3>
          <p className="mt-1 text-sm text-text-tertiary">External support site with FAQs, tutorials, and updates.</p>
        </a>
      </div>

      {/* Feature request */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="px-5 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Additional</p>
        </div>
        <div className="flex items-center gap-4 border-t border-border px-5 py-4">
          <Lightbulb className="h-8 w-8 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium text-text-primary">Request a feature</p>
            <p className="text-sm text-text-tertiary">Tell us what you want in the next release.</p>
          </div>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-text-tertiary" />
        </div>
      </div>

      {/* Popular topics */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="px-5 pt-5 pb-2">
          <p className="text-sm font-semibold text-emerald-600">Popular topics</p>
        </div>
        <ul className="divide-y divide-border px-5 pb-5">
          {filtered.map((l) => (
            <li key={l.href} className="py-2">
              <Link href={l.href} onClick={() => trackClick(l.title)}
                className="inline-flex items-center gap-2 text-sm text-text-primary hover:text-emerald-600">
                {l.title}
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-4 text-sm text-text-tertiary">No results found.</li>
          )}
        </ul>
      </div>

      <p className="text-right text-xs text-text-tertiary">User ID {user?.id?.slice(0, 8) ?? '—'}…</p>
    </div>
  )
}
