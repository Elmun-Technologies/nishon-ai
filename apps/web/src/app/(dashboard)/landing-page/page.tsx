'use client'
import { useState, useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { landingPages } from '@/lib/api-client'

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
  const { currentWorkspace } = useWorkspaceStore()
  const [page, setPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<'content' | 'design' | 'pixels' | 'contact'>('content')

  const workspaceId = currentWorkspace?.id

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return }
    landingPages.getByWorkspace(workspaceId)
      .then(r => { if (r.data) setPage(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspaceId])

  async function handleGenerate() {
    if (!workspaceId) return
    setGenerating(true)
    setError('')
    try {
      const r = await landingPages.generate(workspaceId)
      setPage(r.data)
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
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Landing Page yaratish</h1>
        <p className="text-text-tertiary mb-2 text-sm leading-relaxed">
          AI sizning biznesingiz ma'lumotlaridan kelib chiqib professional sotuvchi
          landing sahifani avtomatik yaratadi.
        </p>
        <ul className="text-sm text-text-tertiary mb-8 space-y-1">
          <li>✅ Uzb tilida matnlar</li>
          <li>✅ Meta Pixel + Google Analytics ulash</li>
          <li>✅ Qo'ng'iroq va WhatsApp tugmalar</li>
          <li>✅ Mobil qurilmalar uchun optimallashtirilgan</li>
        </ul>
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          size="lg"
          className="w-full"
        >
          {generating ? (
            <><Spinner size="sm" /> AI Landing Page yaratmoqda...</>
          ) : '🤖 AI bilan yaratish'}
        </Button>
        <p className="text-xs text-text-tertiary mt-3">Taxminan 10–20 soniya</p>
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
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {publishing ? '...' : page.isPublished ? '⏸ Nashrni to\'xtatish' : '🚀 Nashr etish'}
          </button>
        </div>
      </div>

      {/* Published URL */}
      {page.isPublished && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-emerald-600 text-lg">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-700 font-medium">Sahifangiz faol</p>
            <p className="text-xs text-emerald-600 truncate">{publicUrl}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(publicUrl)}
            className="text-xs text-emerald-700 font-medium shrink-0"
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
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-text-tertiary hover:text-text-primary hover:border-border transition-all"
      >
        {generating ? <><Spinner size="sm" /> Qayta yaratilmoqda...</> : '🔄 AI bilan qayta yaratish'}
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 dark:bg-surface p-1 rounded-xl">
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
                          active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
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
            Sahifadagi "Bog'lanish" tugmasi ushbu ma'lumotlarga bog'lanadi.
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
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
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
              className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={page.metaPixelId || ''}
              onChange={e => setPage(p => p ? { ...p, metaPixelId: e.target.value } : p)}
              placeholder="123456789012345"
            />
          </div>

          {/* Google Analytics */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
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
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={page.googleAnalyticsId || ''}
              onChange={e => setPage(p => p ? { ...p, googleAnalyticsId: e.target.value } : p)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <Button onClick={handleSavePixels} disabled={saving} className="w-full">
            {saving ? <><Spinner size="sm" /> Saqlanmoqda...</> : '💾 Pixel sozlamalarini saqlash'}
          </Button>

          {(page.metaPixelId || page.googleAnalyticsId) && (
            <p className="text-xs text-emerald-600 text-center">
              ✅ Pixel(lar) sahifaga avtomatik qo'shilgan
            </p>
          )}
        </div>
      )}

    </div>
  )
}
