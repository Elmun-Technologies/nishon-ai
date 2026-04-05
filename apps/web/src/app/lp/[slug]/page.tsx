'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Feature { icon: string; title: string; description: string }
interface Testimonial { name: string; role: string; text: string; rating: number }
interface FaqItem { question: string; answer: string }

interface LandingPageContent {
  headline: string
  subheadline: string
  description: string
  ctaText: string
  ctaSubtext?: string
  urgencyText?: string | null
  socialProof?: string
  colorScheme: string
  trustBadges: string[]
  features: Feature[]
  testimonials: Testimonial[]
  faq: FaqItem[]
  sections: string[]
}

interface LandingPageSettings {
  phone?: string
  whatsapp?: string
  address?: string
  websiteUrl?: string
}

interface LandingPage {
  id: string
  slug: string
  workspaceId: string
  content: LandingPageContent
  settings: LandingPageSettings | null
  metaPixelId: string | null
  googleAnalyticsId: string | null
  isPublished: boolean
  viewCount: number
}

// ─── COLOR CONFIG ─────────────────────────────────────────────────────────────

const COLORS: Record<string, { bg: string; text: string; btn: string; btnHover: string; accent: string; light: string }> = {
  blue:   { bg: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', text: '#fff', btn: '#2563EB', btnHover: '#1d4ed8', accent: '#3b82f6', light: '#eff6ff' },
  pink:   { bg: 'linear-gradient(135deg,#ec4899,#be185d)', text: '#fff', btn: '#ec4899', btnHover: '#db2777', accent: '#f472b6', light: '#fdf2f8' },
  green:  { bg: 'linear-gradient(135deg,#059669,#065f46)', text: '#fff', btn: '#10b981', btnHover: '#059669', accent: '#34d399', light: '#ecfdf5' },
  orange: { bg: 'linear-gradient(135deg,#f97316,#c2410c)', text: '#fff', btn: '#f97316', btnHover: '#ea580c', accent: '#fb923c', light: '#fff7ed' },
  purple: { bg: 'linear-gradient(135deg,#7c3aed,#4c1d95)', text: '#fff', btn: '#7c3aed', btnHover: '#6d28d9', accent: '#a78bfa', light: '#f5f3ff' },
  navy:   { bg: 'linear-gradient(135deg,#1e3a5f,#0f172a)', text: '#fff', btn: '#334155', btnHover: '#1e293b', accent: '#64748b', light: '#f8fafc' },
  red:    { bg: 'linear-gradient(135deg,#dc2626,#991b1b)', text: '#fff', btn: '#ef4444', btnHover: '#dc2626', accent: '#f87171', light: '#fef2f2' },
}

function getColor(scheme: string) {
  return COLORS[scheme] || COLORS.blue
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < rating ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left bg-surface-elevated hover:bg-surface-2 transition-colors"
      >
        <span className="font-medium text-text-primary text-sm pr-4">{q}</span>
        <span className="text-text-tertiary text-lg shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-text-secondary leading-relaxed bg-surface-elevated">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LandingPagePublic() {
  const params = useParams<{ slug: string }>()
  const [page, setPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiBase}/landing-pages/public/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        if (!data || !data.content) { setNotFound(true) } else { setPage(data) }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-2 text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Sahifa topilmadi</h1>
        <p className="text-text-tertiary">Ushbu landing page mavjud emas yoki hali nashr etilmagan.</p>
      </div>
    )
  }

  const c = page.content
  const s = page.settings || {}
  const color = getColor(c.colorScheme)
  const sections = c.sections || ['hero', 'social_proof', 'features', 'about', 'testimonials', 'faq', 'contact']

  const phoneHref = s.phone ? `tel:${s.phone.replace(/\s/g, '')}` : null
  const waHref = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : null

  function renderCtaButtons(size: 'lg' | 'sm' = 'lg') {
    const pad = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base'
    return (
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {phoneHref && (
          <a
            href={phoneHref}
            className={`rounded-2xl font-bold text-white shadow-lg ${pad}`}
            style={{ background: color.btn }}
          >
            📞 {c.ctaText}
          </a>
        )}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-2xl font-bold text-white shadow-lg ${pad}`}
            style={{ background: '#25D366' }}
          >
            💬 WhatsApp
          </a>
        )}
        {!phoneHref && !waHref && (
          <button
            className={`rounded-2xl font-bold text-white shadow-lg ${pad}`}
            style={{ background: color.btn }}
          >
            {c.ctaText}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Meta Pixel */}
      {page.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${page.metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* Google Analytics */}
      {page.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${page.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${page.googleAnalyticsId}');`}
          </Script>
        </>
      )}

      <div className="min-h-screen bg-surface-elevated font-sans">

        {/* Urgency bar */}
        {c.urgencyText && (
          <div className="text-white text-center text-sm font-medium py-2.5 px-4" style={{ background: color.btn }}>
            🔥 {c.urgencyText}
          </div>
        )}

        {sections.includes('hero') && (
          <section className="relative py-16 px-4 text-center overflow-hidden" style={{ background: color.bg }}>
            {/* decorative blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#fff', transform: 'translate(-30%, -30%)' }} />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: '#fff', transform: 'translate(30%, 30%)' }} />

            <div className="relative max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ color: color.text }}>
                {c.headline}
              </h1>
              <p className="text-base sm:text-lg mb-6 opacity-90" style={{ color: color.text }}>
                {c.subheadline}
              </p>

              {renderCtaButtons('lg')}

              {c.ctaSubtext && (
                <p className="mt-3 text-xs opacity-70" style={{ color: color.text }}>
                  {c.ctaSubtext}
                </p>
              )}

              {c.trustBadges?.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  {c.trustBadges.map((badge, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: 'rgba(255,255,255,0.2)', color: color.text }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {sections.includes('social_proof') && c.socialProof && (
          <section className="py-6 px-4" style={{ background: color.light }}>
            <div className="max-w-2xl mx-auto text-center">
              <p className="font-bold text-text-primary text-lg">{c.socialProof}</p>
            </div>
          </section>
        )}

        {sections.includes('features') && c.features?.length > 0 && (
          <section className="py-12 px-4 bg-surface-elevated">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
                Nima uchun biz?
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {c.features.map((f, i) => (
                  <div key={i} className="text-center p-4 rounded-2xl" style={{ background: color.light }}>
                    <div className="text-3xl mb-3">{f.icon}</div>
                    <h3 className="font-semibold text-text-primary mb-1 text-sm">{f.title}</h3>
                    <p className="text-text-tertiary text-xs leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {sections.includes('about') && c.description && (
          <section className="py-12 px-4" style={{ background: color.light }}>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Biz haqimizda</h2>
              <p className="text-text-secondary leading-relaxed">{c.description}</p>
            </div>
          </section>
        )}

        {sections.includes('testimonials') && c.testimonials?.length > 0 && (
          <section className="py-12 px-4 bg-surface-elevated">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
                Mijozlarimiz fikri
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {c.testimonials.map((t, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-surface-2">
                    <StarRating rating={t.rating || 5} />
                    <p className="text-text-secondary text-sm leading-relaxed mb-3">"{t.text}"</p>
                    <p className="text-text-primary font-semibold text-sm">{t.name}</p>
                    <p className="text-text-tertiary text-xs">{t.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {sections.includes('faq') && c.faq?.length > 0 && (
          <section className="py-12 px-4" style={{ background: color.light }}>
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-text-primary text-center mb-6">
                Ko'p so'raladigan savollar
              </h2>
              <div className="space-y-2">
                {c.faq.map((item, i) => (
                  <FaqItem key={i} q={item.question} a={item.answer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {sections.includes('contact') && (
          <section className="py-16 px-4 text-center" style={{ background: color.bg }}>
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: color.text }}>
                {c.ctaText}!
              </h2>
              {c.ctaSubtext && (
                <p className="mb-8 opacity-80 text-sm" style={{ color: color.text }}>
                  {c.ctaSubtext}
                </p>
              )}

              {renderCtaButtons('lg')}

              {(s.phone || s.address) && (
                <div className="mt-8 flex flex-col gap-1 items-center opacity-80" style={{ color: color.text }}>
                  {s.phone && <p className="text-sm">📞 {s.phone}</p>}
                  {s.address && <p className="text-sm">📍 {s.address}</p>}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Powered by footer */}
        <div className="py-3 text-center text-xs text-text-tertiary bg-surface-2">
          Performa bilan yaratilgan
        </div>
      </div>

      {/* Floating CTA button (mobile) */}
      {(phoneHref || waHref) && (
        <div className="fixed bottom-4 right-4 left-4 sm:hidden z-50">
          <a
            href={phoneHref || waHref || '#'}
            className="block text-center py-4 rounded-2xl font-bold text-white shadow-2xl text-base"
            style={{ background: color.btn }}
          >
            {phoneHref ? `📞 ${c.ctaText}` : `💬 ${c.ctaText}`}
          </a>
        </div>
      )}
    </>
  )
}
