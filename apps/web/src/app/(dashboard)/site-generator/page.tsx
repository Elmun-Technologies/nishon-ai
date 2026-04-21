'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'
import { PageHeader } from '@/components/ui/PageHeader'
import { LandingPreview } from '@/components/site-generator/LandingPreview'
import { buildLandingSpec } from '@/lib/site-generator/generator'
import type { ExistingSiteKind, LandingPageSpec, OnboardingBriefInput, SiteTemplateId } from '@/lib/site-generator/types'
import { cn } from '@/lib/utils'

const EXISTING_OPTIONS: Array<{ value: ExistingSiteKind; label: string }> = [
  { value: 'none', label: "Yo'q — yangi landing kerak" },
  { value: 'shopify', label: 'Shopify bor' },
  { value: 'tilda', label: 'Tilda / boshqa tayyor CMS' },
  { value: 'other', label: 'Boshqa sayt' },
]

export default function SiteGeneratorPage() {
  const [existing, setExisting] = useState<ExistingSiteKind>('none')
  const [templateId, setTemplateId] = useState<SiteTemplateId>('fashion')
  const [productTitle, setProductTitle] = useState('Ayollar krossovkasi')
  const [priceUzs, setPriceUzs] = useState('299000')
  const [utp, setUtp] = useState('Ertaga yetkazish')
  const [audience, setAudience] = useState('18-24 yosh ayollar')
  const [brandName, setBrandName] = useState('')
  const [phone, setPhone] = useState('+998 90 123 45 67')
  const [telegram, setTelegram] = useState('branduz')
  const [imageUrls, setImageUrls] = useState('')

  const [spec, setSpec] = useState<LandingPageSpec | null>(null)

  const onboarding: OnboardingBriefInput = useMemo(
    () => ({
      productTitle: productTitle.trim(),
      priceUzs: Number(priceUzs.replace(/\s/g, '')) || 0,
      utp: utp.trim(),
      audienceSummary: audience.trim(),
      brandName: brandName.trim() || undefined,
      phone: phone.trim() || undefined,
      telegramUsername: telegram.trim() || undefined,
      existingSite: existing,
      imageUrls: imageUrls
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    }),
    [productTitle, priceUzs, utp, audience, brandName, phone, telegram, existing, imageUrls],
  )

  const generate = () => {
    if (existing !== 'none') return
    setSpec(buildLandingSpec(onboarding, templateId, 'uz'))
  }

  const showGate = existing !== 'none'

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <PageHeader
        title="Site Generator — sotuv mashinasi"
        subtitle="Wix emas: onboarding + Creative Hub + pixel/CAPI + Signal Bridge bitta zanjir. 5 daqiqada mobil-first landing spec va preview."
        actions={
          <Link
            href="/landing-page"
            className={cn(
              'inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium',
              'bg-white/80 text-text-primary hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900',
            )}
          >
            Klassik landing builder
          </Link>
        }
      />

      <div className="grid gap-4 rounded-2xl border border-border bg-surface-1 p-5 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-text-tertiary">Nega kerak</p>
          <p className="mt-1 text-sm text-text-secondary">
            Pixel yo‘qolishi kamayadi (CAPI), CTR→purchase yo‘li qisqaradi, platformada lock-in.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-text-tertiary">Tarif (reja)</p>
          <p className="mt-1 text-sm text-text-secondary">
            <strong>Free:</strong> 1 ta landing, subdomain.
            <br />
            <strong>Pro $9/oy:</strong> o‘z domen, 3 ta A/B, footer brand.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-text-tertiary">5 qatlam</p>
          <p className="mt-1 text-sm text-text-secondary">
            Onboarding → AI copy · struktura · texnika · integratsiya · optimizatsiya loop.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-1 p-5">
        <p className="text-sm font-semibold text-text-primary">Allaqachon saytingiz bormi?</p>
        <p className="mt-1 text-xs text-text-secondary">
          Shopify / Tilda bo‘lsa yangi generatsiya qilmang — ikkita sayt bo‘lib qoladi. Faqat pixel va CAPI ulang.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXISTING_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setExisting(o.value)
                if (o.value !== 'none') setSpec(null)
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                existing === o.value
                  ? 'border-brand-mid bg-brand-mid/15 text-brand-ink dark:border-brand-lime dark:bg-brand-lime/10 dark:text-brand-lime'
                  : 'border-border text-text-secondary hover:border-brand-mid/40'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {showGate ? (
        <Alert variant="info">
          <strong>Pixel yo‘li:</strong> mavjud saytga Meta Pixel + CAPI ulash —{' '}
          <Link className="underline" href="/docs">
            hujjatlar
          </Link>{' '}
          yoki workspace sozlamalari. Yangi landing generatsiyasini bu yerda o‘chirib qo‘ydik.
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`space-y-4 ${showGate ? 'pointer-events-none opacity-40' : ''}`}>
          <label className="block text-sm">
            <span className="text-text-secondary">Shablon</span>
            <select
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as SiteTemplateId)}
            >
              <option value="fashion">Fashion / mahsulot</option>
              <option value="course">Kurs / ta’lim</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-text-secondary">Mahsulot</span>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-text-secondary">Narx (so‘m)</span>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
                value={priceUzs}
                onChange={(e) => setPriceUzs(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">Brend nomi (ixtiyoriy)</span>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Masalan WalkSoft"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-text-secondary">UTP</span>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
              value={utp}
              onChange={(e) => setUtp(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-secondary">Auditoriya</span>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-text-secondary">Telefon</span>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-text-secondary">Telegram @</span>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 dark:bg-slate-950"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-text-secondary">Rasm URL lari (Creative Hub, har qatorda bittasi)</span>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-xl border border-border bg-white px-3 py-2 text-xs dark:bg-slate-950"
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <button
            type="button"
            onClick={generate}
            className={cn(
              'w-full rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime px-6 py-3 text-sm font-semibold text-brand-ink shadow-sm sm:w-auto',
              'hover:opacity-95',
            )}
          >
            ~30 soniyada spec + preview
          </button>
        </div>

        <div className="space-y-4">
          {spec ? <LandingPreview spec={spec} /> : <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-text-tertiary">Preview shu yerda paydo bo‘ladi</div>}
          {spec ? (
            <div className="rounded-2xl border border-border bg-surface-1 p-4 text-xs text-text-secondary">
              <p className="font-semibold text-text-primary">Integratsiya (keyingi deploy)</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>{spec.integrations.metaPixelNote}</li>
                <li>{spec.integrations.capiNote}</li>
                <li>{spec.integrations.signalBridgeNote}</li>
                <li>{spec.integrations.paymeClickNote}</li>
              </ul>
              <p className="mt-3">
                <Link href="/creative-audit" className="font-medium text-primary underline">
                  {spec.integrations.creativeAuditNote}
                </Link>
              </p>
              <p className="mt-3 font-semibold text-text-primary">A/B</p>
              <ol className="mt-1 list-decimal pl-4">
                {spec.optimization.abHeadlines.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
              <p className="mt-2 text-text-tertiary">{spec.optimization.aiSuggestionNote}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
