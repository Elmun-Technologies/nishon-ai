'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Package, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button, Alert, Card, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

type ProductRow = { id: string; name: string; sku: string; notes: string; updatedAt: number }

function storageKey(workspaceId: string) {
  return `adspectr-creative-products-${workspaceId}`
}

function loadProducts(workspaceId: string): ProductRow[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (p): p is ProductRow =>
          p &&
          typeof p === 'object' &&
          typeof (p as ProductRow).id === 'string' &&
          typeof (p as ProductRow).name === 'string' &&
          typeof (p as ProductRow).updatedAt === 'number' &&
          typeof (p as ProductRow).sku === 'string' &&
          typeof (p as ProductRow).notes === 'string',
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export default function CreativeProductsPage() {
  const { t, language } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [rows, setRows] = useState<ProductRow[]>([])
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!workspaceId) {
      setRows([])
      return
    }
    setRows(loadProducts(workspaceId))
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId || rows.length === 0) return
    try {
      localStorage.setItem(storageKey(workspaceId), JSON.stringify(rows))
    } catch {
      /* quota */
    }
  }, [workspaceId, rows])

  const localeTag = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const formatUpdated = useCallback(
    (ts: number) =>
      new Date(ts).toLocaleString(localeTag, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [localeTag],
  )

  const addRow = () => {
    const trimmed = name.trim()
    if (!trimmed || !workspaceId) return
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pr-${Date.now()}`
    setRows((prev) => [
      { id, name: trimmed, sku: sku.trim(), notes: notes.trim(), updatedAt: Date.now() },
      ...prev,
    ])
    setName('')
    setSku('')
    setNotes('')
  }

  const removeRow = (id: string) => {
    if (!window.confirm(t('creativeProductsPage.deleteConfirm', 'Delete this product row?'))) return
    setRows((prev) => {
      const next = prev.filter((p) => p.id !== id)
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
            <Package className="h-7 w-7 text-brand-ink" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
              {t('navigation.products', 'Products')}
            </h1>
            <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
              {t(
                'creativeProductsPage.subtitle',
                'Keep SKUs, bundles, and copy notes next to your ads. Stored locally per workspace until catalog sync is live.',
              )}
            </p>
          </div>
        </div>
        <Link
          href="/creative-hub"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-border px-4 py-2 text-sm font-medium',
            'bg-white/80 text-text-primary transition-all hover:bg-white active:scale-95 md:self-center',
            'dark:bg-slate-900/70 dark:hover:bg-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          )}
        >
          {t('creativeProjectsPage.openCreativeHub', 'Open Creative Hub')}
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </section>
  )

  if (!workspaceId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
        {hero}
        <Alert variant="warning">{t('creativeProductsPage.noWorkspace', 'Select or create a workspace to manage products.')}</Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
      {hero}
      <Alert variant="info">{t('creativeProductsPage.syncNotice', '')}</Alert>

      <Card padding="md" className="border-border/80 shadow-sm">
        <h2 className="mb-4 text-heading font-semibold text-text-primary">{t('creativeProductsPage.newProduct', 'New product')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('creativeProductsPage.productName', 'Product name')}
            placeholder={t('creativeProductsPage.productNamePlaceholder', 'e.g., Protein bar — cocoa')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t('creativeProductsPage.sku', 'SKU / ID')}
            placeholder={t('creativeProductsPage.skuPlaceholder', 'Optional internal code')}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Input
            label={t('creativeProductsPage.notes', 'Notes')}
            placeholder={t('creativeProductsPage.notesPlaceholder', '')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button type="button" className="mt-4 gap-2 rounded-2xl" onClick={addRow} disabled={!name.trim()}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('creativeProductsPage.addProduct', 'Add product')}
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-heading font-semibold text-text-primary">
          {t('creativeProductsPage.yourProducts', 'Your products')}
        </h2>
        {rows.length === 0 ? (
          <Card padding="lg" className="border-dashed border-border/90 bg-surface-2/40 text-center dark:bg-surface-2/20">
            <Package className="mx-auto mb-3 h-10 w-10 text-brand-mid opacity-80 dark:text-brand-lime" aria-hidden />
            <p className="font-semibold text-text-primary">{t('creativeProductsPage.emptyTitle', 'No products yet')}</p>
            <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">
              {t('creativeProductsPage.emptyHint', '')}
            </p>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map((p) => (
              <li key={p.id}>
                <Card padding="md" className="flex h-full flex-col gap-3 border-border/80 shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">{p.name}</p>
                    {p.sku ? <p className="mt-1 font-mono text-caption text-text-secondary">{p.sku}</p> : null}
                    {p.notes ? <p className="mt-2 line-clamp-4 text-body-sm text-text-secondary">{p.notes}</p> : null}
                    <p className="mt-2 text-caption text-text-tertiary">
                      {t('creativeProductsPage.updated', 'Updated')} · {formatUpdated(p.updatedAt)}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href="/creative-hub"
                      className={cn(
                        'inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-xs font-medium',
                        'bg-white/80 text-text-primary hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900',
                      )}
                    >
                      {t('creativeProjectsPage.openCreativeHub', 'Open Creative Hub')}
                    </Link>
                    <Button type="button" variant="danger" size="sm" className="gap-1.5 rounded-xl" onClick={() => removeRow(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t('creativeProductsPage.delete', 'Delete')}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
