'use client'

import Link from 'next/link'
import {
  BarChart3,
  Brain,
  Factory,
  FolderKanban,
  ImageIcon,
  Layers,
  Package,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import {
  buildImagePromptSuffix,
  buildProjectCloseLearnings,
  DEMO_BRAND_KIT,
} from '@adspectr/creative-hub-core'
import { cn } from '@/lib/utils'

const DEMO_PERFORMANCE_SAMPLES = [
  {
    creativeId: 'demo-a',
    format: '9:16' as const,
    impressions: 12000,
    spend: 120,
    purchasesValue: 540,
    roas: 4.5,
  },
  {
    creativeId: 'demo-b',
    format: '1:1' as const,
    impressions: 11000,
    spend: 120,
    purchasesValue: 168,
    roas: 1.4,
  },
]

const MODULES = [
  {
    href: '/creative-hub/image-ads',
    title: 'Image Ads',
    layer: 1,
    icon: ImageIcon,
    body:
      'Brief form: mahsulot rasmi, maqsad (sotuv/trafik), ton — AI 3 ta konsept. Brend compliance, 9 formatga auto-resize (Sharp/Cloudinary), remove.bg + soyali mahsulot.',
    apis: 'Fal.ai Flux Pro · Replicate SDXL · remove.bg · Cloudinary',
  },
  {
    href: '/creative-hub/ai-actors',
    title: 'AI Actor',
    layer: 1,
    icon: Video,
    body:
      'O‘zbek UGC yo‘nalishi: avatar presetlari, ElevenLabs ovoz, lip-sync (HeyGen/D-ID). Skript: AI yozadi → odam tahrirlaydi → ovoz + video.',
    apis: 'HeyGen · D-ID · ElevenLabs · Pika / Runway',
  },
  {
    href: '/creative-hub/projects',
    title: 'Project',
    layer: 3,
    icon: FolderKanban,
    body:
      'Har papka = bitta reklama maqsadi: brief, KPI, barcha versiyalar, Signal Bridge dan performance. Yopilganda avtomatik Learnings.',
    apis: 'Postgres + ichki API',
  },
  {
    href: '/creative-hub/brand-kit',
    title: 'Brand Kit',
    layer: 2,
    icon: Palette,
    body:
      'Logo, hex ranglar, fontlar, tone of voice, taqiqlangan so‘zlar, mahsulot PNG. Har generatsiyada promptga avtomatik injeksiya.',
    apis: 'Postgres JSONB · Cloudinary assetlar',
  },
  {
    href: '/creative-hub/products',
    title: 'Product',
    layer: 1,
    icon: Package,
    body:
      'CSV/XML feed (Shopify, Uzum). Har SKU: fon olib tashlash, narx overlay, chegirma badge — batch kreativlar.',
    apis: 'Parser + Fal batch',
  },
  {
    href: '/creative-hub/media',
    title: 'Mediateka',
    layer: 3,
    icon: Layers,
    body:
      'AI auto-tag, v1/v2/v3 versiya, rasm ustida ROAS overlay, semantik qidiruv (“qizil krossovka 9:16”).',
    apis: 'Cloudinary moderation/tagging · Postgres',
  },
] as const

const RULES = [
  {
    title: 'Performance Loop',
    icon: BarChart3,
    text: 'Har kreativ natija olgach, tizim keyingi briefda format va rang bo‘yicha xulosalar beradi — Canva da yo‘q.',
  },
  {
    title: 'Brand Governance',
    icon: ShieldCheck,
    text: 'Brend kitdan chetga chiqsa rad etish yoki rangni palettega yaqinlashtirish — agentlik darajasida nazorat.',
  },
  {
    title: 'Hybrid approval',
    icon: Users,
    text: 'AI 80% tezlik, odam 20% tanlash va tasdiq. To‘liq avtopilot sifatsiz qoladi.',
  },
] as const

export default function CreativeHubPage() {
  const learningPreview = buildProjectCloseLearnings(DEMO_PERFORMANCE_SAMPLES)
  const brandSnippet = buildImagePromptSuffix(DEMO_BRAND_KIT)

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-20 pt-2">
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br px-6 py-10 shadow-sm md:px-12 md:py-12',
          'from-white via-surface to-surface-2/90',
          'dark:from-[#1a2d0d] dark:via-brand-ink dark:to-[#152508]',
        )}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-lime/15 blur-3xl dark:bg-brand-lime/10" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-caption font-semibold uppercase tracking-wider text-brand-mid dark:text-brand-lime">
              Professional Creative Hub
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
              Canva emas — brend + performance bilan ishlaydigan fabrika
            </h1>
            <p className="max-w-2xl text-body text-text-secondary">
              Bu yerda faqat “rasm yasab ber” tugmasi emas: uch qavatli arxitektura — Asset Factory, Brand Brain va
              Performance Loop — bir joyda ulanadi. Pastda 6 ta modul orqali chuqur ish oqimlari.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/creative-hub/image-ads"
                className={cn(
                  'inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all',
                  'bg-gradient-to-r from-brand-mid to-brand-lime text-brand-ink hover:opacity-95',
                )}
              >
                Image Ads dan boshlash
              </Link>
              <Link
                href="/creative-hub/workspace"
                className={cn(
                  'inline-flex items-center justify-center rounded-2xl border border-border px-5 py-2.5 text-sm font-medium',
                  'bg-white/80 text-text-primary hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900',
                )}
              >
                Generatorlar (tezkor)
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                step: '1',
                title: 'Asset Factory',
                sub: 'AI ishlab chiqaradi',
                icon: Factory,
                items: ['Brief → konseptlar', 'Fon olib tashlash', 'Multi-format eksport'],
              },
              {
                step: '2',
                title: 'Brand Brain',
                sub: 'Brend eslaydi',
                icon: Brain,
                items: ['Rang & font', 'Tone of voice', 'Taqiqlangan so‘zlar'],
              },
              {
                step: '3',
                title: 'Performance Loop',
                sub: 'Natijadan o‘rganadi',
                icon: Sparkles,
                items: ['Format taqqoslash', 'ROAS overlay', 'Project Learnings'],
              },
            ].map((row) => (
              <div
                key={row.step}
                className="flex gap-4 rounded-2xl border border-border/80 bg-surface/90 p-4 shadow-sm dark:bg-surface-elevated/60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mid/15 dark:bg-brand-lime/10">
                  <row.icon className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">Qavat {row.step}</p>
                  <p className="font-semibold text-text-primary">{row.title}</p>
                  <p className="text-sm text-text-secondary">{row.sub}</p>
                  <ul className="mt-2 list-inside list-disc text-xs text-text-tertiary">
                    {row.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Sayoz bo‘lmaslik — 3 ta qoida</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {RULES.map((r) => (
            <div key={r.title} className="rounded-2xl border border-border bg-surface-1 p-5">
              <r.icon className="mb-3 h-8 w-8 text-brand-mid dark:text-brand-lime" aria-hidden />
              <p className="font-semibold text-text-primary">{r.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <h2 className="text-2xl font-bold text-text-primary">6 ta modul</h2>
          <p className="max-w-xl text-sm text-text-secondary">
            Har biri mavjud marshrutga ulangan. Core paket: <code className="text-xs">@adspectr/creative-hub-core</code>{' '}
            — brend injeksiyasi va performance xulosalari.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={cn(
                'group flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-5 shadow-sm transition-all',
                'hover:-translate-y-0.5 hover:border-brand-mid/40 hover:shadow-md dark:hover:border-brand-lime/30',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mid/10 dark:bg-brand-lime/10">
                    <m.icon className="h-5 w-5 text-brand-mid dark:text-brand-lime" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                      Qavat {m.layer}
                    </p>
                    <p className="text-lg font-bold text-text-primary">{m.title}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-brand-mid group-hover:underline dark:text-brand-lime">
                  Ochish →
                </span>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{m.body}</p>
              <p className="text-xs text-text-tertiary">{m.apis}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-1 p-5">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-tertiary">Demo: Project Learnings</p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2/80 p-4 font-mono text-xs text-text-secondary">
            {learningPreview}
          </pre>
        </div>
        <div className="rounded-2xl border border-border bg-surface-1 p-5">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-tertiary">
            Demo: brend prompt injeksiyasi (qisqartirilgan)
          </p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-2/80 p-4 font-mono text-[11px] leading-relaxed text-text-secondary">
            {brandSnippet.length > 420 ? `${brandSnippet.slice(0, 420)}…` : brandSnippet}
          </pre>
        </div>
      </section>
    </div>
  )
}
