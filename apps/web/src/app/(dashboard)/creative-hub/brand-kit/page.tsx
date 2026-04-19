'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Palette } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button, Alert, Card, Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

type BrandKitForm = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontHeading: string
  fontBody: string
  tagline: string
  voice: string
  dos: string
  donts: string
}

type StoredBrandKit = BrandKitForm & { updatedAt: number }

const DEFAULT_FORM: BrandKitForm = {
  primaryColor: '#1b2e06',
  secondaryColor: '#93c75b',
  accentColor: '#b0ed6f',
  fontHeading: 'basis',
  fontBody: 'basis',
  tagline: '',
  voice: '',
  dos: '',
  donts: '',
}

function storageKey(workspaceId: string) {
  return `adspectr-brand-kit-${workspaceId}`
}

function isHex6(v: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(v)
}

function safePickerValue(v: string, fallback: string) {
  return isHex6(v) ? v : fallback
}

function loadKit(workspaceId: string): StoredBrandKit {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_FORM, updatedAt: 0 }
  }
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return { ...DEFAULT_FORM, updatedAt: 0 }
    const parsed = JSON.parse(raw) as Partial<StoredBrandKit>
    const merged: StoredBrandKit = {
      ...DEFAULT_FORM,
      ...parsed,
      primaryColor: typeof parsed.primaryColor === 'string' ? parsed.primaryColor : DEFAULT_FORM.primaryColor,
      secondaryColor: typeof parsed.secondaryColor === 'string' ? parsed.secondaryColor : DEFAULT_FORM.secondaryColor,
      accentColor: typeof parsed.accentColor === 'string' ? parsed.accentColor : DEFAULT_FORM.accentColor,
      fontHeading:
        typeof parsed.fontHeading === 'string' && ['basis', 'system', 'serif'].includes(parsed.fontHeading)
          ? parsed.fontHeading
          : DEFAULT_FORM.fontHeading,
      fontBody:
        typeof parsed.fontBody === 'string' && ['basis', 'system', 'serif'].includes(parsed.fontBody)
          ? parsed.fontBody
          : DEFAULT_FORM.fontBody,
      tagline: typeof parsed.tagline === 'string' ? parsed.tagline : '',
      voice: typeof parsed.voice === 'string' ? parsed.voice : '',
      dos: typeof parsed.dos === 'string' ? parsed.dos : '',
      donts: typeof parsed.donts === 'string' ? parsed.donts : '',
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    }
    return merged
  } catch {
    return { ...DEFAULT_FORM, updatedAt: 0 }
  }
}

function ColorRow({
  label,
  value,
  onChange,
  fallback,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  fallback: string
}) {
  const picker = safePickerValue(value, fallback)
  return (
    <div className="space-y-2">
      <span className="text-label font-medium text-text-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={picker}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-surface p-1 shadow-sm"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1b2e06"
          className="max-w-[11rem] font-mono text-body-sm"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

export default function BrandKitPage() {
  const { t, language } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [form, setForm] = useState<BrandKitForm>(DEFAULT_FORM)
  const [updatedAt, setUpdatedAt] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      setForm(DEFAULT_FORM)
      setUpdatedAt(0)
      return
    }
    const kit = loadKit(workspaceId)
    const { updatedAt: ts, ...rest } = kit
    setForm(rest)
    setUpdatedAt(ts)
  }, [workspaceId])

  const localeTag = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const fontOptions = useMemo(
    () => [
      { value: 'basis', label: t('brandKitPage.fontBasis', 'Basis Grotesque (app default)') },
      { value: 'system', label: t('brandKitPage.fontSystem', 'System UI stack') },
      { value: 'serif', label: t('brandKitPage.fontSerif', 'Serif (editorial)') },
    ],
    [t],
  )

  const formatSaved = useCallback(
    (ts: number) =>
      ts
        ? new Date(ts).toLocaleString(localeTag, { dateStyle: 'medium', timeStyle: 'short' })
        : null,
    [localeTag],
  )

  const save = () => {
    if (!workspaceId) return
    const ts = Date.now()
    const payload: StoredBrandKit = { ...form, updatedAt: ts }
    try {
      localStorage.setItem(storageKey(workspaceId), JSON.stringify(payload))
      setUpdatedAt(ts)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2200)
    } catch {
      /* quota */
    }
  }

  const reset = () => {
    if (!window.confirm(t('brandKitPage.resetConfirm', 'Reset all fields to default AdSpectr palette and empty text?'))) {
      return
    }
    setForm(DEFAULT_FORM)
    setUpdatedAt(0)
    if (workspaceId) {
      try {
        localStorage.removeItem(storageKey(workspaceId))
      } catch {
        /* ignore */
      }
    }
  }

  const patch = <K extends keyof BrandKitForm>(key: K, value: BrandKitForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
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
            <Palette className="h-7 w-7 text-brand-ink" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
              {t('navigation.brandKit', 'Brand Kit')}
            </h1>
            <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
              {t(
                'brandKitPage.subtitle',
                'Capture colors, type preferences, and voice so AI tools and your team stay on-brand. Saved in this browser for the current workspace.',
              )}
            </p>
            {updatedAt > 0 && (
              <p className="mt-2 text-caption text-text-tertiary">
                {t('brandKitPage.lastSaved', 'Last saved')} · {formatSaved(updatedAt)}
              </p>
            )}
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
        <Alert variant="warning">{t('brandKitPage.noWorkspace', 'Select or create a workspace to edit the brand kit.')}</Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
      {hero}

      <Alert variant="info">{t('brandKitPage.syncNotice', '')}</Alert>

      {savedFlash && (
        <Alert variant="success" className="py-2">
          {t('brandKitPage.saved', 'Saved.')}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md" className="border-border/80 shadow-sm">
          <h2 className="mb-4 text-heading font-semibold text-text-primary">{t('brandKitPage.colorsTitle', 'Colors')}</h2>
          <div className="space-y-5">
            <ColorRow
              label={t('brandKitPage.primaryLabel', 'Primary')}
              value={form.primaryColor}
              onChange={(v) => patch('primaryColor', v)}
              fallback={DEFAULT_FORM.primaryColor}
            />
            <ColorRow
              label={t('brandKitPage.secondaryLabel', 'Secondary')}
              value={form.secondaryColor}
              onChange={(v) => patch('secondaryColor', v)}
              fallback={DEFAULT_FORM.secondaryColor}
            />
            <ColorRow
              label={t('brandKitPage.accentLabel', 'Accent')}
              value={form.accentColor}
              onChange={(v) => patch('accentColor', v)}
              fallback={DEFAULT_FORM.accentColor}
            />
          </div>
        </Card>

        <Card padding="md" className="border-border/80 shadow-sm">
          <h2 className="mb-4 text-heading font-semibold text-text-primary">{t('brandKitPage.typeTitle', 'Typography')}</h2>
          <div className="space-y-4">
            <Select
              label={t('brandKitPage.fontHeadingLabel', 'Heading style')}
              value={form.fontHeading}
              onChange={(e) => patch('fontHeading', e.target.value)}
              options={fontOptions}
            />
            <Select
              label={t('brandKitPage.fontBodyLabel', 'Body style')}
              value={form.fontBody}
              onChange={(e) => patch('fontBody', e.target.value)}
              options={fontOptions}
            />
          </div>
        </Card>
      </div>

      <Card padding="md" className="border-border/80 shadow-sm">
        <h2 className="mb-4 text-heading font-semibold text-text-primary">{t('brandKitPage.voiceTitle', 'Voice & messaging')}</h2>
        <div className="space-y-4">
          <Input
            label={t('brandKitPage.taglineLabel', 'Tagline / positioning line')}
            placeholder={t('brandKitPage.taglinePlaceholder', 'One line that sums up the brand promise.')}
            value={form.tagline}
            onChange={(e) => patch('tagline', e.target.value)}
          />
          <Textarea
            label={t('brandKitPage.voiceLabel', 'Tone & voice notes')}
            placeholder={t('brandKitPage.voicePlaceholder', '')}
            value={form.voice}
            onChange={(e) => patch('voice', e.target.value)}
            rows={4}
          />
          <Textarea
            label={t('brandKitPage.dosLabel', 'Do')}
            placeholder={t('brandKitPage.dosPlaceholder', '')}
            value={form.dos}
            onChange={(e) => patch('dos', e.target.value)}
            rows={4}
          />
          <Textarea
            label={t('brandKitPage.dontsLabel', "Don't")}
            placeholder={t('brandKitPage.dontsPlaceholder', '')}
            value={form.donts}
            onChange={(e) => patch('donts', e.target.value)}
            rows={4}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button type="button" className="rounded-2xl" onClick={save}>
          {t('brandKitPage.save', 'Save brand kit')}
        </Button>
        <Button type="button" variant="secondary" className="rounded-2xl" onClick={reset}>
          {t('brandKitPage.reset', 'Reset to defaults')}
        </Button>
      </div>
    </div>
  )
}
