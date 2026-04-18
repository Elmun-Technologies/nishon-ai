'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { BookOpen, ExternalLink, HelpCircle, Lightbulb, Search } from 'lucide-react'

const LINKS = [
  { title: 'Creative Hub', href: '/creative-hub', keywords: 'kreativ shablonlar media' },
  { title: 'Meta dashboard (ad accounts)', href: '/settings/meta', keywords: 'facebook spend account' },
  { title: 'Kampaniya yoqish', href: '/launch', keywords: 'launch wizard' },
  { title: 'Hisobot', href: '/reporting', keywords: 'reporting meta' },
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

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Performa foydalanuvchisi'

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
      <PageHeader
        title="Resource center"
        subtitle={`Salom, ${firstName}. Yordam, videolar va tezkor havolalar.`}
      />

      <div className="relative">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nimada yordam kerak?"
          className="pr-10"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/docs" onClick={() => trackClick('app_guide')}>
          <Card className="h-full transition-colors hover:border-violet-500/40">
            <BookOpen className="h-10 w-10 text-violet-400" />
            <h3 className="mt-3 text-lg font-semibold text-text-primary">App guide</h3>
            <p className="mt-1 text-sm text-text-tertiary">
              Vosita va bo'lim bo'yicha qo'llanmalar — hujjatlar sahifasiga o'tish.
            </p>
          </Card>
        </Link>
        <a href="https://performa.ai" target="_blank" rel="noreferrer" onClick={() => trackClick('help_center')}>
          <Card className="relative h-full transition-colors hover:border-violet-500/40">
            <ExternalLink className="absolute right-4 top-4 h-4 w-4 text-text-tertiary" />
            <HelpCircle className="h-10 w-10 text-violet-400" />
            <h3 className="mt-3 text-lg font-semibold text-text-primary">Help center</h3>
            <p className="mt-1 text-sm text-text-tertiary">
              Tashqi sayt: maqolalar, FAQ va video (URL keyinroq sozlanadi).
            </p>
          </Card>
        </a>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Qo'shimcha</p>
        <Card className="mt-2 flex items-center gap-4">
          <Lightbulb className="h-8 w-8 shrink-0 text-violet-400" />
          <div>
            <p className="font-semibold text-text-primary">Feature so'rash</p>
            <p className="text-sm text-text-tertiary">Keyingi relizda nimani ko'rishni xohlaysiz?</p>
          </div>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-text-tertiary" />
        </Card>
      </div>

      <div>
        <p className="text-sm font-semibold text-violet-400">Mashhur mavzular</p>
        <ul className="mt-2 space-y-2">
          {filtered.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => trackClick(l.title)} className="inline-flex items-center gap-2 text-sm text-text-primary hover:text-violet-300">
                {l.title}
                <BookOpen className="h-3.5 w-3.5 text-violet-400" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-right text-xs text-text-tertiary">User ID {user?.id?.slice(0, 8) ?? '—'}…</p>
    </div>
  )
}
