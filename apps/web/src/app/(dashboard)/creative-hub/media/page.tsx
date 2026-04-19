'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Image, Link2, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button, Alert, Card, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

type MediaBookmark = { id: string; label: string; url: string; updatedAt: number }

function storageKey(workspaceId: string) {
  return `adspectr-media-bookmarks-${workspaceId}`
}

function isHttpUrl(s: string) {
  try {
    const u = new URL(s.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function loadBookmarks(workspaceId: string): MediaBookmark[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (b): b is MediaBookmark =>
          b &&
          typeof b === 'object' &&
          typeof (b as MediaBookmark).id === 'string' &&
          typeof (b as MediaBookmark).label === 'string' &&
          typeof (b as MediaBookmark).url === 'string' &&
          typeof (b as MediaBookmark).updatedAt === 'number',
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export default function CreativeMediaPage() {
  const { t, language } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [items, setItems] = useState<MediaBookmark[]>([])
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId) {
      setItems([])
      return
    }
    setItems(loadBookmarks(workspaceId))
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId || items.length === 0) return
    try {
      localStorage.setItem(storageKey(workspaceId), JSON.stringify(items))
    } catch {
      /* quota */
    }
  }, [workspaceId, items])

  const localeTag = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const formatUpdated = useCallback(
    (ts: number) =>
      new Date(ts).toLocaleString(localeTag, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [localeTag],
  )

  const addBookmark = () => {
    const u = url.trim()
    const lab = label.trim() || u
    if (!workspaceId || !u) return
    if (!isHttpUrl(u)) {
      setUrlError(t('creativeMediaPage.invalidUrl', 'Enter a valid http(s) URL.'))
      return
    }
    setUrlError(null)
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`
    setItems((prev) => [{ id, label: lab, url: u, updatedAt: Date.now() }, ...prev])
    setLabel('')
    setUrl('')
  }

  const removeBookmark = (id: string) => {
    if (!window.confirm(t('creativeMediaPage.deleteConfirm', 'Remove this bookmark?'))) return
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id)
      if (workspaceId && next.length === 0) {
        try {
          localStorage.removeItem(storageKey(workspaceId))
        } catch {
          /* ignore */
        }
      }
      return next
    })
  }

  const hero = (
    <section
      className={cn(
        'rounded-3xl border border-border/80 bg-gradient-to-br p-5 shadow-sm md:p-6',
        'from-white via-surface to-surface-2/95',
        'dark:from-[#1e3310] dark:via-brand-ink dark:to-[#152508]',
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
              'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
            )}
          >
            <Image className="h-7 w-7 text-brand-ink" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
              {t('navigation.mediaLibrary', 'Media Library')}
            </h1>
            <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
              {t(
                'creativeMediaPage.subtitle',
                'Bookmark CDN links, drive files, and references. Generated files from Creative Hub live in the Library tab.',
              )}
            </p>
          </div>
        </div>
        <Link
          href="/creative-hub?tab=library"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-border px-4 py-2 text-sm font-medium',
            'bg-white/80 text-text-primary transition-all hover:bg-white active:scale-95 md:self-center',
            'dark:bg-slate-900/70 dark:hover:bg-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          )}
        >
          {t('creativeMediaPage.openLibrary', 'Open Creative Hub — Library')}
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </section>
  )

  if (!workspaceId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
        {hero}
        <Alert variant="warning">{t('creativeMediaPage.noWorkspace', 'Select or create a workspace to use the media list.')}</Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
      {hero}
      <Alert variant="info">{t('creativeMediaPage.syncNotice', '')}</Alert>
      <p className="text-body-sm text-text-secondary">{t('creativeMediaPage.libraryHint', '')}</p>

      <Card padding="md" className="border-border/80 shadow-sm">
        <h2 className="mb-4 text-heading font-semibold text-text-primary">{t('creativeMediaPage.addSection', 'Add link')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('creativeMediaPage.linkLabel', 'Title')}
            placeholder={t('creativeMediaPage.linkLabelPlaceholder', 'e.g., Q1 hero video (MP4)')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            label={t('creativeMediaPage.url', 'URL')}
            placeholder={t('creativeMediaPage.urlPlaceholder', 'https://…')}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError(null)
            }}
            error={urlError ?? undefined}
          />
        </div>
        <Button type="button" className="mt-4 gap-2 rounded-2xl" onClick={addBookmark} disabled={!url.trim()}>
          <Link2 className="h-4 w-4" aria-hidden />
          {t('creativeMediaPage.addLink', 'Save link')}
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-heading font-semibold text-text-primary">{t('creativeMediaPage.bookmarks', 'Saved links')}</h2>
        {items.length === 0 ? (
          <Card padding="lg" className="border-dashed border-border/90 bg-surface-2/40 text-center dark:bg-surface-2/20">
            <Link2 className="mx-auto mb-3 h-10 w-10 text-brand-mid opacity-80 dark:text-brand-lime" aria-hidden />
            <p className="font-semibold text-text-primary">{t('creativeMediaPage.emptyTitle', 'No saved links')}</p>
            <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">{t('creativeMediaPage.emptyHint', '')}</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {items.map((b) => (
              <li key={b.id}>
                <Card padding="md" className="flex flex-col gap-3 border-border/80 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{b.label}</p>
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate text-body-sm text-brand-mid underline decoration-border underline-offset-2 hover:text-text-primary dark:text-brand-lime"
                    >
                      {b.url}
                    </a>
                    <p className="mt-1 text-caption text-text-tertiary">
                      {t('creativeMediaPage.updated', 'Updated')} · {formatUpdated(b.updatedAt)}
                    </p>
                  </div>
                  <Button type="button" variant="danger" size="sm" className="shrink-0 gap-1.5 rounded-xl" onClick={() => removeBookmark(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t('creativeMediaPage.delete', 'Remove')}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
