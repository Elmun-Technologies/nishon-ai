'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  CreditCard,
  ImagePlus,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { landingPages } from '@/lib/api-client'
import { cn } from '@/lib/utils'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LandingPage {
  id: string
  slug: string
  content: any
  settings: any
  metaPixelId: string | null
  googleAnalyticsId: string | null
  isPublished: boolean
  viewCount: number
}

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────

const ALL_SECTIONS = [
  { key: 'hero', label: 'Asosiy qism (Hero)', icon: '🏠', required: true },
  { key: 'social_proof', label: 'Ijtimoiy isbot', icon: '🏆' },
  { key: 'features', label: 'Xususiyatlar', icon: '⚡' },
  { key: 'about', label: 'Biz haqimizda', icon: '📖' },
  { key: 'testimonials', label: 'Mijoz fikrlari', icon: '💬' },
  { key: 'faq', label: 'Savollar (FAQ)', icon: '❓' },
  { key: 'contact', label: 'Bog\'lanish & CTA', icon: '📞', required: true },
]

const LP_DRAFT_KEY = (workspaceId: string) => `adspectr-lp-draft:${workspaceId}`

const LP_TEMPLATE_IDS = ['local_service', 'product_store', 'saas_b2b', 'promo_event'] as const
type LpTemplateId = (typeof LP_TEMPLATE_IDS)[number]

const MAX_LP_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_LP_IMAGES = 4

const COLOR_OPTIONS = [
  { key: 'blue', label: 'Ko\'k', bg: '#2563EB' },
  { key: 'pink', label: 'Pushti', bg: '#ec4899' },
  { key: 'green', label: 'Yashil', bg: '#10b981' },
  { key: 'orange', label: 'To\'q sariq', bg: '#f97316' },
  { key: 'purple', label: 'Binafsha', bg: '#7c3aed' },
  { key: 'navy', label: 'To\'q ko\'k', bg: '#1e3a5f' },
  { key: 'red', label: 'Qizil', bg: '#dc2626' },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const cls = 'w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-border/20 resize-none'
  return (
    <div>
      <label className="block text-xs font-medium text-text-tertiary mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          className={cls}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className={cls}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LandingPageEditor() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [page, setPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<'content' | 'design' | 'pixels' | 'contact'>('content')

  const [templateId, setTemplateId] = useState<LpTemplateId | null>(null)
  const [creativeBrief, setCreativeBrief] = useState('')
  const [imageItems, setImageItems] = useState<
    { id: string; base64: string; mime: string; name: string; preview: string }[]
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const workspaceId = currentWorkspace?.id

  const readFilesAsPayload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
      const additions: { id: string; base64: string; mime: string; name: string; preview: string }[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!allowed.has(file.type)) {
          setError(t('landingPageBuilder.photoType'))
          continue
        }
        if (file.size > MAX_LP_IMAGE_BYTES) {
          setError(t('landingPageBuilder.photoTooBig'))
          continue
        }
        try {
          const b64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = String(reader.result || '')
              const payload = result.includes(',') ? result.split(',')[1] : result
              resolve(payload)
            }
            reader.onerror = () => reject(new Error('read'))
            reader.readAsDataURL(file)
          })
          const preview = URL.createObjectURL(file)
          additions.push({
            id: `${Date.now()}-${i}-${file.name}`,
            base64: b64,
            mime: file.type,
            name: file.name,
            preview,
          })
        } catch {
          setError(t('landingPageBuilder.photoType'))
        }
      }
      if (!additions.length) return
      setImageItems((prev) => {
        const merged = [...prev, ...additions]
        return merged.slice(0, MAX_LP_IMAGES)
      })
      setError('')
    },
    [t],
  )

  const removeImage = useCallback((id: string) => {
    setImageItems((prev) => {
      const it = prev.find((x) => x.id === id)
      if (it?.preview.startsWith('blob:')) URL.revokeObjectURL(it.preview)
      return prev.filter((x) => x.id !== id)
    })
  }, [])

  useEffect(() => {
    if (!workspaceId || page) return
    try {
      const raw = sessionStorage.getItem(LP_DRAFT_KEY(workspaceId))
      if (!raw) return
      const d = JSON.parse(raw) as { templateId?: LpTemplateId; creativeBrief?: string }
      if (d.templateId && LP_TEMPLATE_IDS.includes(d.templateId)) setTemplateId(d.templateId)
      if (typeof d.creativeBrief === 'string') setCreativeBrief(d.creativeBrief)
    } catch {
      /* ignore */
    }
  }, [workspaceId, page])

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return }
    landingPages.getByWorkspace(workspaceId)
      .then(r => { if (r.data) setPage(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspaceId])

  async function handleGenerate(mode: 'initial' | 'regenerate' = 'initial') {
    if (!workspaceId) return
    if (mode === 'initial' && !templateId) {
      setError(t('landingPageBuilder.selectTemplate'))
      return
    }
    setGenerating(true)
    setError('')
    try {
      let body: Record<string, unknown> = {}
      if (mode === 'regenerate') {
        try {
          const raw = sessionStorage.getItem(LP_DRAFT_KEY(workspaceId))
          if (raw) body = JSON.parse(raw) as Record<string, unknown>
        } catch {
          body = {}
        }
      } else {
        body = {
          templateId,
          creativeBrief: creativeBrief.trim() || undefined,
          images:
            imageItems.length > 0
              ? imageItems.map(({ base64, mime }) => ({ base64, mimeType: mime }))
              : undefined,
        }
      }
      const r = await landingPages.generate(workspaceId, body)
      setPage(r.data)
      if (mode === 'initial') {
        setImageItems((prev) => {
          prev.forEach((i) => {
            if (i.preview.startsWith('blob:')) URL.revokeObjectURL(i.preview)
          })
          return []
        })
      }
      if (mode === 'initial' && templateId) {
        sessionStorage.setItem(
          LP_DRAFT_KEY(workspaceId),
          JSON.stringify({ templateId, creativeBrief: creativeBrief.trim() }),
        )
      }
      setSuccess('Landing page muvaffaqiyatli yaratildi!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!page) return
    setSaving(true)
    setError('')
    try {
      const r = await landingPages.update(page.id, {
        content: page.content,
        settings: page.settings,
      })
      setPage(r.data)
      setSuccess('Saqlandi!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e: any) {
      setError(e?.message || 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePixels() {
    if (!page) return
    setSaving(true)
    setError('')
    try {
      const r = await landingPages.update(page.id, {
        metaPixelId: page.metaPixelId || '',
        googleAnalyticsId: page.googleAnalyticsId || '',
      })
      setPage(r.data)
      setSuccess('Pixel sozlamalari saqlandi!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e: any) {
      setError(e?.message || 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveContact() {
    if (!page) return
    setSaving(true)
    try {
      const r = await landingPages.update(page.id, {
        settings: page.settings || {},
      })
      setPage(r.data)
      setSuccess('Saqlandi!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e: any) {
      setError(e?.message || 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish() {
    if (!page) return
    setPublishing(true)
    try {
      const r = await landingPages.togglePublish(page.id)
      setPage(r.data)
    } catch (e: any) {
      setError(e?.message || 'Xatolik')
    } finally {
      setPublishing(false)
    }
  }

  function updateContent(key: string, value: any) {
    setPage(p => p ? { ...p, content: { ...p.content, [key]: value } } : p)
  }

  function updateSetting(key: string, value: any) {
    setPage(p => p ? { ...p, settings: { ...(p.settings || {}), [key]: value } } : p)
  }

  function toggleSection(key: string) {
    const sections: string[] = page?.content?.sections || []
    const newSections = sections.includes(key)
      ? sections.filter(s => s !== key)
      : [...sections, key]
    updateContent('sections', newSections)
  }

  function moveSectionUp(key: string) {
    const sections: string[] = [...(page?.content?.sections || [])]
    const idx = sections.indexOf(key)
    if (idx > 0) { [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]] }
    updateContent('sections', sections)
  }

  function moveSectionDown(key: string) {
    const sections: string[] = [...(page?.content?.sections || [])]
    const idx = sections.indexOf(key)
    if (idx < sections.length - 1) { [sections[idx], sections[idx + 1]] = [sections[idx + 1], sections[idx]] }
    updateContent('sections', sections)
  }

  const publicUrl = page ? `${typeof window !== 'undefined' ? window.location.origin : ''}/lp/${page.slug}` : ''

  // ─── LOADING STATE ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <Alert variant="warning">Avval biznesingizni onboarding orqali sozlang.</Alert>
      </div>
    )
  }

  // ─── EMPTY STATE (no page yet) ────────────────────────────────────────────

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 pb-16">
        <section
          className={cn(
            'relative overflow-hidden rounded-3xl border border-border/80 px-5 py-6 shadow-sm md:px-8 md:py-8',
            'bg-gradient-to-br from-white via-surface to-surface-2/90',
            'dark:from-[#1a2d0d] dark:via-brand-ink dark:to-[#152508]',
          )}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-lime/15 blur-3xl dark:bg-brand-lime/10" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
                  'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
                )}
              >
                <LayoutTemplate className="h-7 w-7 text-brand-ink" aria-hidden />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-caption font-semibold uppercase tracking-wider text-brand-mid dark:text-brand-lime">
                  {t('landingPageBuilder.heroEyebrow')}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                  {t('landingPageBuilder.title')}
                </h1>
                <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-text-secondary md:text-body">
                  {t('landingPageBuilder.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-brand-mid/25 bg-brand-mid/10 px-3 py-2 text-caption text-brand-ink dark:border-brand-lime/30 dark:bg-brand-lime/10 dark:text-brand-lime md:max-w-xs">
              <span className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                {t('landingPageBuilder.manusLine')}
              </span>
            </div>
          </div>
        </section>

        <Alert variant="warning" className="border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-caption font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                {t('landingPageBuilder.addonBadge')} — {t('landingPageBuilder.addonTitle')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/95">
                {t('landingPageBuilder.addonBody')}
              </p>
            </div>
            <Link
              href="/settings/workspace/payments"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-600/40 bg-white/80 px-4 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-white dark:border-amber-400/40 dark:bg-brand-ink/40 dark:text-amber-100 dark:hover:bg-brand-ink/60"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {t('landingPageBuilder.addonCta')}
            </Link>
          </div>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="border-border/80 p-5 shadow-md dark:border-brand-mid/15 lg:col-span-3">
            <p className="text-caption font-bold uppercase tracking-wide text-text-tertiary">
              {t('landingPageBuilder.step1')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{t('landingPageBuilder.templatesHelp')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {LP_TEMPLATE_IDS.map((tid) => {
                const selected = templateId === tid
                const title =
                  tid === 'local_service'
                    ? t('landingPageBuilder.tpl_local_title')
                    : tid === 'product_store'
                      ? t('landingPageBuilder.tpl_product_title')
                      : tid === 'saas_b2b'
                        ? t('landingPageBuilder.tpl_saas_title')
                        : t('landingPageBuilder.tpl_promo_title')
                const body =
                  tid === 'local_service'
                    ? t('landingPageBuilder.tpl_local_body')
                    : tid === 'product_store'
                      ? t('landingPageBuilder.tpl_product_body')
                      : tid === 'saas_b2b'
                        ? t('landingPageBuilder.tpl_saas_body')
                        : t('landingPageBuilder.tpl_promo_body')
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setTemplateId(tid)}
                    className={cn(
                      'rounded-2xl border p-4 text-left text-sm transition-all',
                      selected
                        ? 'border-brand-mid bg-brand-mid/10 shadow-sm ring-2 ring-brand-mid/25 dark:border-brand-lime dark:bg-brand-lime/10 dark:ring-brand-lime/30'
                        : 'border-border/80 bg-surface-2/40 hover:border-brand-mid/30 dark:bg-brand-ink/30',
                    )}
                  >
                    <p className="font-bold text-text-primary">{title}</p>
                    <p className="mt-1 text-caption leading-relaxed text-text-secondary">{body}</p>
                  </button>
                )
              })}
            </div>

            <p className="mt-8 text-caption font-bold uppercase tracking-wide text-text-tertiary">
              {t('landingPageBuilder.step2')}
            </p>
            <label className="mt-2 block text-sm font-medium text-text-secondary">
              {t('landingPageBuilder.briefLabel')}
            </label>
            <textarea
              value={creativeBrief}
              onChange={(e) => setCreativeBrief(e.target.value)}
              placeholder={t('landingPageBuilder.briefPlaceholder')}
              rows={4}
              className="mt-1 w-full resize-y rounded-2xl border border-border/90 bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-mid/50 focus:outline-none focus:ring-2 focus:ring-brand-mid/20 dark:bg-surface-elevated"
            />

            <p className="mt-8 text-caption font-bold uppercase tracking-wide text-text-tertiary">
              {t('landingPageBuilder.step3')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{t('landingPageBuilder.photosHint')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                void readFilesAsPayload(e.target.files)
                e.target.value = ''
              }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2 rounded-xl"
                disabled={imageItems.length >= MAX_LP_IMAGES}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                {t('landingPageBuilder.photosPick')}
              </Button>
              <span className="text-caption text-text-tertiary">
                {imageItems.length}/{MAX_LP_IMAGES}
              </span>
            </div>
            {imageItems.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-3">
                {imageItems.map((img) => (
                  <li key={img.id} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border/80">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-[10px] font-medium text-white"
                    >
                      {t('landingPageBuilder.photosRemove')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <Card className="h-fit border-border/80 p-5 shadow-md dark:border-brand-mid/15 lg:col-span-2">
            <p className="text-sm font-bold text-text-primary">{t('landingPageBuilder.checkTitle')}</p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                {t('landingPageBuilder.check1')}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                {t('landingPageBuilder.check2')}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                {t('landingPageBuilder.check3')}
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                {t('landingPageBuilder.check4')}
              </li>
            </ul>
            <p className="mt-4 text-caption leading-relaxed text-text-tertiary">{t('landingPageBuilder.etaNote')}</p>
          </Card>
        </div>

        {error ? (
          <div>
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <Button
          type="button"
          onClick={() => void handleGenerate('initial')}
          disabled={generating || !templateId}
          loading={generating}
          size="lg"
          fullWidth
          className="rounded-2xl"
        >
          {generating ? t('landingPageBuilder.generatingCta') : t('landingPageBuilder.generateCta')}
        </Button>
        <p className="text-center text-caption text-text-tertiary">{t('landingPageBuilder.regenerateHint')}</p>
      </div>
    )
  }

  // ─── EDITOR ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Landing Page</h1>
          <p className="text-text-tertiary text-xs mt-0.5">
            Ko'ruvlar: <span className="font-medium text-text-secondary">{page.viewCount}</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {page.isPublished && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-2"
            >
              🔗 Ko'rish
            </a>
          )}
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              page.isPublished
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/15'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/15'
            }`}
          >
            {publishing ? '...' : page.isPublished ? '⏸ Nashrni to\'xtatish' : '🚀 Nashr etish'}
          </button>
        </div>
      </div>

      {/* Published URL */}
      {page.isPublished && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
          <span className="text-emerald-500 text-lg">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-500 font-medium">Sahifangiz faol</p>
            <p className="text-xs text-emerald-500 truncate">{publicUrl}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(publicUrl)}
            className="text-xs text-emerald-500 font-medium shrink-0"
          >
            Nusxa
          </button>
        </div>
      )}

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Regenerate */}
      <button
        type="button"
        onClick={() => void handleGenerate('regenerate')}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-text-tertiary hover:text-text-primary hover:border-border transition-all"
      >
        {generating ? <><Spinner size="sm" /> Qayta yaratilmoqda...</> : '🔄 AI bilan qayta yaratish'}
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl">
        {[
          { key: 'content', label: 'Matn' },
          { key: 'design', label: 'Dizayn' },
          { key: 'contact', label: 'Kontakt' },
          { key: 'pixels', label: 'Pixel' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === t.key
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT TAB ── */}
      {tab === 'content' && (
        <div className="space-y-4">
          <Field label="Asosiy sarlavha (Headline)" value={page.content?.headline} onChange={v => updateContent('headline', v)} />
          <Field label="Kichik sarlavha (Subheadline)" value={page.content?.subheadline} onChange={v => updateContent('subheadline', v)} multiline />
          <Field label="Biz haqimizda (Description)" value={page.content?.description} onChange={v => updateContent('description', v)} multiline />
          <Field label="CTA tugma matni" value={page.content?.ctaText} onChange={v => updateContent('ctaText', v)} placeholder="Hozir buyurtma bering" />
          <Field label="CTA ostida matn" value={page.content?.ctaSubtext || ''} onChange={v => updateContent('ctaSubtext', v)} placeholder="Bepul konsultatsiya • Tez javob" />
          <Field label="Shoshilinch taklif (Urgency)" value={page.content?.urgencyText || ''} onChange={v => updateContent('urgencyText', v)} placeholder="Bu hafta 20% chegirma!" />
          <Field label="Ijtimoiy isbot" value={page.content?.socialProof || ''} onChange={v => updateContent('socialProof', v)} placeholder="1200+ mamnun mijoz" />

          {/* Trust badges */}
          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-2">Ishonch belgilari (3 ta)</label>
            {(page.content?.trustBadges || ['', '', '']).map((badge: string, i: number) => (
              <input
                key={i}
                type="text"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface focus:outline-none mb-1.5"
                value={badge}
                onChange={e => {
                  const badges = [...(page.content?.trustBadges || ['', '', ''])]
                  badges[i] = e.target.value
                  updateContent('trustBadges', badges)
                }}
                placeholder={`✓ Badge ${i + 1}`}
              />
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <><Spinner size="sm" /> Saqlanmoqda...</> : '💾 Saqlash'}
          </Button>
        </div>
      )}

      {/* ── DESIGN TAB ── */}
      {tab === 'design' && (
        <div className="space-y-5">

          {/* Color scheme */}
          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-3">Rang sxemasi</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => updateContent('colorScheme', opt.key)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                    page.content?.colorScheme === opt.key
                      ? 'border-border'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg" style={{ background: opt.bg }} />
                  <span className="text-[10px] text-text-tertiary">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section order */}
          <div>
            <label className="block text-xs font-medium text-text-tertiary mb-2">Bo'limlar tartibi</label>
            <p className="text-[10px] text-text-tertiary mb-3">Yoqish/o'chirish yoki tartibini o'zgartiring</p>
            <div className="space-y-1.5">
              {ALL_SECTIONS.map(sec => {
                const active = (page.content?.sections || []).includes(sec.key)
                return (
                  <div
                    key={sec.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      active ? 'bg-surface border-border' : 'bg-surface-2 border-transparent opacity-50'
                    }`}
                  >
                    <span className="text-sm">{sec.icon}</span>
                    <span className="text-sm text-text-secondary flex-1">{sec.label}</span>
                    {!sec.required && (
                      <button
                        onClick={() => toggleSection(sec.key)}
                        className={`text-xs px-2 py-0.5 rounded-lg ${
                          active ? 'text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {active ? 'O\'chir' : 'Qo\'sh'}
                      </button>
                    )}
                    {active && (
                      <div className="flex gap-1">
                        <button onClick={() => moveSectionUp(sec.key)} className="text-text-tertiary hover:text-text-secondary px-1">↑</button>
                        <button onClick={() => moveSectionDown(sec.key)} className="text-text-tertiary hover:text-text-secondary px-1">↓</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <><Spinner size="sm" /> Saqlanmoqda...</> : '💾 Saqlash'}
          </Button>
        </div>
      )}

      {/* ── CONTACT TAB ── */}
      {tab === 'contact' && (
        <div className="space-y-4">
          <p className="text-xs text-text-tertiary">
            Sahifadagi "Bog"lanish" tugmasi ushbu ma'lumotlarga bog"lanadi.
          </p>
          <Field
            label="Telefon raqami"
            value={page.settings?.phone || ''}
            onChange={v => updateSetting('phone', v)}
            placeholder="+998 90 123 45 67"
          />
          <Field
            label="WhatsApp raqami (xalqaro format)"
            value={page.settings?.whatsapp || ''}
            onChange={v => updateSetting('whatsapp', v)}
            placeholder="998901234567"
          />
          <Field
            label="Manzil"
            value={page.settings?.address || ''}
            onChange={v => updateSetting('address', v)}
            placeholder="Toshkent, Chilonzor tumani"
          />
          <Button onClick={handleSaveContact} disabled={saving} className="w-full">
            {saving ? <><Spinner size="sm" /> Saqlanmoqda...</> : '💾 Saqlash'}
          </Button>
        </div>
      )}

      {/* ── PIXELS TAB ── */}
      {tab === 'pixels' && (
        <div className="space-y-5">

          {/* Meta Pixel */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📘</span>
              <h3 className="font-semibold text-text-primary text-sm">Meta Pixel (Facebook/Instagram)</h3>
            </div>
            <p className="text-xs text-text-tertiary mb-3 leading-relaxed">
              Meta Pixel lead va konversiyalarni kuzatadi. Pixel ID ni Facebook Ads Manager dan oling:
            </p>
            <ol className="text-xs text-text-tertiary mb-3 space-y-1 list-decimal list-inside">
              <li>Facebook Ads Manager → Events Manager</li>
              <li>"Web" → "Meta Pixel" ni tanlang</li>
              <li>Yangi pixel yarating yoki mavjudini tanlang</li>
              <li>Pixel ID ni (15-20 raqam) nusxa oling</li>
            </ol>
            <input
              type="text"
              className="w-full border border-blue-500/20 rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={page.metaPixelId || ''}
              onChange={e => setPage(p => p ? { ...p, metaPixelId: e.target.value } : p)}
              placeholder="123456789012345"
            />
          </div>

          {/* Google Analytics */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-text-primary text-sm">Google Analytics (GA4)</h3>
            </div>
            <p className="text-xs text-text-tertiary mb-3 leading-relaxed">
              Google Analytics sayt trafigini tahlil qiladi. GA4 measurement ID ni oling:
            </p>
            <ol className="text-xs text-text-tertiary mb-3 space-y-1 list-decimal list-inside">
              <li>analytics.google.com → saytingizni tanlang</li>
              <li>Admin → Data Streams → Web stream</li>
              <li>Measurement ID (G-XXXXXXXX) ni nusxa oling</li>
            </ol>
            <input
              type="text"
              className="w-full border border-orange-500/20 rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={page.googleAnalyticsId || ''}
              onChange={e => setPage(p => p ? { ...p, googleAnalyticsId: e.target.value } : p)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <Button onClick={handleSavePixels} disabled={saving} className="w-full">
            {saving ? <><Spinner size="sm" /> Saqlanmoqda...</> : '💾 Pixel sozlamalarini saqlash'}
          </Button>

          {(page.metaPixelId || page.googleAnalyticsId) && (
            <p className="text-xs text-emerald-500 text-center">
              ✅ Pixel(lar) sahifaga avtomatik qo'shilgan
            </p>
          )}
        </div>
      )}

    </div>
  )
}
