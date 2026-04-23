'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { AccordionItem } from '@/components/ui/Accordion'
import { useWorkspaceStore } from '@/stores/workspace.store'
import {
  BookOpen,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Search,
  Palette,
  Zap,
  BarChart3,
  Users,
  ShoppingBag,
  RefreshCcw,
  FileText,
  Target,
  Settings,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Keyboard,
  LayoutGrid,
  Mail,
} from 'lucide-react'

// ── Data ────────────────────────────────────────────────────────────────────

const MODULES = [
  {
    name: 'Creative Hub',
    href: '/creative-hub',
    description: "AI yordamida reklama kreativlari va shablonlar yaratish",
    icon: Palette,
    category: 'Kontent',
    status: 'active' as const,
  },
  {
    name: 'Kampaniya',
    href: '/launch',
    description: 'Reklama kampaniyalarini bosqichma-bosqich ishga tushirish',
    icon: Zap,
    category: 'Reklama',
    status: 'active' as const,
  },
  {
    name: 'Hisobot',
    href: '/reporting',
    description: "Real-time ishlash ko'rsatkichlari va analitika",
    icon: BarChart3,
    category: 'Analitika',
    status: 'active' as const,
  },
  {
    name: 'Hisobot quruvchi',
    href: '/reports',
    description: 'Drag-and-drop dashboard va metrikalar',
    icon: LayoutGrid,
    category: 'Analitika',
    status: 'active' as const,
  },
  {
    name: 'Audience Story',
    href: '/audiences/story',
    description: "Auditoriya personalar va mijoz yo'li",
    icon: Users,
    category: 'Auditoriya',
    status: 'active' as const,
  },
  {
    name: 'Marketplace',
    href: '/marketplace',
    description: "Sertifikatlangan mutaxassislar bilan bog'lanish",
    icon: ShoppingBag,
    category: 'Hamkorlik',
    status: 'active' as const,
  },
  {
    name: 'Retargeting',
    href: '/retargeting',
    description: "Aqlli auditoriya qayta nishonlash avtomatizatsiyasi",
    icon: RefreshCcw,
    category: 'Avtomatizatsiya',
    status: 'active' as const,
  },
  {
    name: 'Ad Library',
    href: '/ad-library',
    description: "Raqib reklamalarini o'rganish va tahlil qilish",
    icon: FileText,
    category: 'Tadqiqot',
    status: 'active' as const,
  },
  {
    name: 'Meta Dashboard',
    href: '/settings/meta',
    description: 'Meta reklama hisoblarini ulash va boshqarish',
    icon: Target,
    category: 'Integratsiya',
    status: 'active' as const,
  },
  {
    name: 'Sozlamalar',
    href: '/settings',
    description: "Ish muhiti, jamoa va bildirishnomalarni sozlash",
    icon: Settings,
    category: 'Boshqaruv',
    status: 'active' as const,
  },
]

const FAQS = [
  {
    q: 'Meta reklama hisobini qanday ulash mumkin?',
    a: "Settings → Workspace Settings → Ad Accounts bo'limiga o'ting va \"Connect Meta Account\" tugmasini bosing. Facebook sahifasiga yo'naltirilasiz va ruxsat bering.",
  },
  {
    q: "Jamoa a'zolarini qanday taklif qilish mumkin?",
    a: "Settings → Workspace Settings → Team Members bo'limiga o'tib, \"Invite team member\" tugmasini bosing, email kiriting va rol tanlang.",
  },
  {
    q: 'Creative Hub nima va u qanday ishlaydi?',
    a: "Creative Hub — AI yordamida reklama kreativlari yaratuvchi modul. Shablonlar asosida matn, tasvir va video materiallarni bir joyda boshqarasiz. Natijalarni to'g'ridan-to'g'ri kampaniyaga ulashingiz mumkin.",
  },
  {
    q: 'Autopilot rejimi nima?',
    a: "Autopilot — AI tomonidan kampaniyalarni avtomatik optimizatsiya qilish rejimi. Byudjet taqsimoti, nishon auditoriyasi va kreativlarni avtomatik o'zgartiradi. Settings → Classic Settings → General bo'limidan yoqishingiz mumkin.",
  },
  {
    q: 'Hisobotlarni eksport qilish mumkinmi?',
    a: "Ha. Hisobot modulida istalgan hisobotni CSV yoki PDF formatida yuklab olishingiz mumkin. Har bir hisobot sahifasida tepada \"Export\" tugmasi mavjud.",
  },
  {
    q: 'Telegram bildirishnomalarini qanday sozlash mumkin?',
    a: "Settings → Classic Settings → Notifications bo'limiga o'ting. Telegram bot tokenini kiriting va kerakli hodisalar uchun bildirishnomalarni yoqing (kampaniya to'xtatilishi, byudjet limiti va h.k.).",
  },
  {
    q: "Retargeting va oddiy kampaniya o'rtasidagi farq nima?",
    a: "Oddiy kampaniya yangi auditoriyaga yetkazadi. Retargeting esa saytingizga tashrif buyurgan, mahsulotni ko'rgan yoki oldingi reklamaga munosabat bildirgan foydalanuvchilarga qayta murojaat qiladi — konversiya ehtimolini oshiradi.",
  },
  {
    q: "Bir nechta ish muhiti (workspace) bo'lishi mumkinmi?",
    a: "Ha, bir foydalanuvchi bir nechta ish muhitiga a'zo bo'lishi mumkin. Chap ustunning pastki qismidagi workspace tanlagichdan o'tishingiz mumkin.",
  },
]

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: "Tezkor qidiruv oynasini ochish" },
  { keys: ['G', 'D'], description: "Asosiy dashboard ga o'tish" },
  { keys: ['G', 'C'], description: "Creative Hub ga o'tish" },
  { keys: ['G', 'R'], description: "Hisobot sahifasiga o'tish" },
  { keys: ['G', 'S'], description: "Sozlamalar sahifasiga o'tish" },
  { keys: ['Esc'], description: "Ochiq modal yoki panel yopish" },
  { keys: ['?'], description: "Klaviatura yorliqlari panelini ochish" },
]

const GETTING_STARTED = [
  { step: 1, title: 'Meta hisobni ulang', desc: 'Ad Accounts bo\'limidan Facebook/Meta reklama hisobingizni ulang.', href: '/settings/workspace/ad-accounts' },
  { step: 2, title: 'Jamoa a\'zolarini taklif qiling', desc: 'Team Members bo\'limidan hamkasblaringizni qo\'shing va rol bering.', href: '/settings/workspace/team' },
  { step: 3, title: 'Birinchi kreativni yarating', desc: 'Creative Hub ga o\'tib AI yordamida reklama matni yoki tasvirini yarating.', href: '/creative-hub' },
  { step: 4, title: 'Kampaniya ishga tushiring', desc: 'Launch wizard orqali kampaniyangizni sozlang va faollashtiring.', href: '/launch' },
  { step: 5, title: 'Natijalarni kuzating', desc: 'Hisobot modulida real-time ko\'rsatkichlarni tahlil qiling.', href: '/reporting' },
]

const POPULAR_LINKS = [
  { title: 'Creative Hub', href: '/creative-hub', desc: "AI kreativlar va shablonlar", category: 'Kontent', keywords: 'kreativ shablonlar media ai' },
  { title: 'Meta dashboard', href: '/settings/meta', desc: 'Facebook hisob ulash', category: 'Integratsiya', keywords: 'facebook spend account meta' },
  { title: 'Kampaniya yoqish', href: '/launch', desc: 'Yangi kampaniya wizard', category: 'Reklama', keywords: 'launch wizard kampaniya' },
  { title: 'Hisobot', href: '/reporting', desc: 'Real-time analitika', category: 'Analitika', keywords: 'reporting meta analitika' },
  { title: 'Hisobot quruvchi', href: '/reports', desc: 'Drag & drop dashboard', category: 'Analitika', keywords: 'dashboard drag metrics shablon' },
  { title: 'Ad Library', href: '/ad-library', desc: 'Raqib reklamalari tadqiqoti', category: 'Tadqiqot', keywords: 'raqib reklama meta library' },
  { title: 'Audience Story', href: '/audiences/story', desc: 'Auditoriya personas', category: 'Auditoriya', keywords: 'persona journey auditoriya' },
  { title: "Hujjatlar", href: '/docs', desc: "To'liq qo'llanma", category: 'Docs', keywords: "docs qo'llanma hujjat" },
]

const CATEGORY_COLORS: Record<string, string> = {
  Kontent: 'purple',
  Reklama: 'info',
  Analitika: 'success',
  Auditoriya: 'warning',
  Hamkorlik: 'purple',
  Avtomatizatsiya: 'info',
  Tadqiqot: 'gray',
  Integratsiya: 'success',
  Boshqaruv: 'gray',
  Docs: 'gray',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ResourceCenterPage() {
  const { user } = useWorkspaceStore()
  const [q, setQ] = useState('')

  const firstName = user?.name?.split(/\s+/)[0] ?? 'Foydalanuvchi'

  const filteredLinks = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return POPULAR_LINKS
    return POPULAR_LINKS.filter(
      (l) =>
        l.title.toLowerCase().includes(s) ||
        l.desc.toLowerCase().includes(s) ||
        l.keywords.toLowerCase().includes(s) ||
        l.category.toLowerCase().includes(s),
    )
  }, [q])

  const filteredModules = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return MODULES
    return MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(s) ||
        m.description.toLowerCase().includes(s) ||
        m.category.toLowerCase().includes(s),
    )
  }, [q])

  function trackClick(topic: string) {
    if (typeof window === 'undefined') return
    try {
      navigator.sendBeacon?.(
        '/api/track',
        JSON.stringify({ event: 'workspace_help_topic_click', topic, userId: user?.id ?? null, ts: Date.now() }),
      )
    } catch { /* no-op */ }
  }

  return (
    <div className="space-y-10">

      {/* ── Header greeting ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-text-primary">
            Salom, {firstName}!
          </p>
          <p className="mt-0.5 text-sm text-text-tertiary">
            Yordam hujjatlari, tezkor havolalar va onboarding resurslari.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-border/70 bg-white/85 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
            <p className="text-xs text-text-tertiary">Modullar</p>
            <p className="text-xl font-bold text-text-primary">{MODULES.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white/85 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
            <p className="text-xs text-text-tertiary">FAQ</p>
            <p className="text-xl font-bold text-text-primary">{FAQS.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-white/85 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
            <p className="text-xs text-text-tertiary">Yorliqlar</p>
            <p className="text-xl font-bold text-text-primary">{SHORTCUTS.length}</p>
          </div>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Modul, mavzu yoki kalit so'z bilan qidiring…"
          className="pr-10"
        />
        <Search className="pointer-events-none absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      </div>

      {/* ── Quick action cards ───────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/docs" onClick={() => trackClick('app_guide')}>
          <Card
            hoverable
            className="h-full rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70"
          >
            <BookOpen className="h-10 w-10 text-primary" />
            <h3 className="mt-3 text-heading-lg text-text-primary">App guide</h3>
            <p className="mt-1 text-body text-text-tertiary">
              Modul bo'yicha ko'rsatmalar va mahsulot hujjatlari.
            </p>
          </Card>
        </Link>
        <a href="https://adspectr.com" target="_blank" rel="noreferrer" onClick={() => trackClick('help_center')}>
          <Card
            hoverable
            className="relative h-full rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70"
          >
            <ExternalLink className="absolute right-4 top-4 h-4 w-4 text-text-tertiary" />
            <HelpCircle className="h-10 w-10 text-primary" />
            <h3 className="mt-3 text-heading-lg text-text-primary">Help center</h3>
            <p className="mt-1 text-body text-text-tertiary">
              FAQ, qo'llanmalar va yangiliklar bilan tashqi yordam sayti.
            </p>
          </Card>
        </a>
      </div>

      {/* ── Getting started ──────────────────────────────────────────────── */}
      {!q && (
        <section>
          <p className="mb-3 text-label font-semibold uppercase tracking-wider text-text-tertiary">
            Boshlash uchun qadamlar
          </p>
          <Card className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
            <ol className="divide-y divide-border/60">
              {GETTING_STARTED.map((item) => (
                <li key={item.step}>
                  <Link
                    href={item.href}
                    onClick={() => trackClick(`getting_started_${item.step}`)}
                    className="flex items-start gap-4 py-4 transition-colors hover:bg-surface-2/50 px-2 rounded-xl"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-300">
                      {item.step}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      <p className="mt-0.5 text-xs text-text-tertiary">{item.desc}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-tertiary" />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}

      {/* ── Platform modules table ───────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-label font-semibold uppercase tracking-wider text-text-tertiary">
          Platforma modullari
        </p>
        <Card padding="none" className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-border bg-surface-2/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Modul</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Tavsif</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Kategoriya</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Holat</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Havola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredModules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-tertiary">
                      Hech narsa topilmadi
                    </td>
                  </tr>
                )}
                {filteredModules.map((mod) => {
                  const Icon = mod.icon
                  return (
                    <tr
                      key={mod.href}
                      className="bg-white/40 transition-colors hover:bg-surface-2/40 dark:bg-slate-950/10 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                            <Icon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                          </span>
                          <span className="font-medium text-text-primary">{mod.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{mod.description}</td>
                      <td className="px-4 py-3">
                        <Badge variant={(CATEGORY_COLORS[mod.category] ?? 'gray') as any} size="sm">
                          {mod.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Faol
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={mod.href}
                          onClick={() => trackClick(mod.name)}
                          className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline dark:text-violet-400"
                        >
                          Ochish <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ── Popular topics (filtered list) ──────────────────────────────── */}
      <section>
        <p className="mb-3 text-label font-semibold uppercase tracking-wider text-text-tertiary">
          Mashhur mavzular
        </p>
        <Card padding="none" className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border bg-surface-2/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Mavzu</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Tavsif</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Bo'lim</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLinks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-tertiary">
                      Hech narsa topilmadi
                    </td>
                  </tr>
                )}
                {filteredLinks.map((l) => (
                  <tr
                    key={l.href}
                    className="bg-white/40 transition-colors hover:bg-surface-2/40 dark:bg-slate-950/10 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{l.title}</td>
                    <td className="px-4 py-3 text-text-secondary">{l.desc}</td>
                    <td className="px-4 py-3">
                      <Badge variant={(CATEGORY_COLORS[l.category] ?? 'gray') as any} size="sm">
                        {l.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={l.href}
                        onClick={() => trackClick(l.title)}
                        className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline dark:text-violet-400"
                      >
                        O'tish <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-label font-semibold uppercase tracking-wider text-text-tertiary">
          Ko'p so'raladigan savollar
        </p>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} title={faq.q}>
              <p className="text-sm leading-relaxed text-text-secondary">{faq.a}</p>
            </AccordionItem>
          ))}
        </div>
      </section>

      {/* ── Keyboard shortcuts table ─────────────────────────────────────── */}
      {!q && (
        <section>
          <p className="mb-3 flex items-center gap-2 text-label font-semibold uppercase tracking-wider text-text-tertiary">
            <Keyboard className="h-4 w-4" />
            Klaviatura yorliqlari
          </p>
          <Card padding="none" className="rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-sm">
                <thead className="border-b border-border bg-surface-2/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Tugmalar</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {SHORTCUTS.map((s, i) => (
                    <tr
                      key={i}
                      className="bg-white/40 dark:bg-slate-950/10"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {s.keys.map((k, ki) => (
                            <span key={ki} className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs font-semibold text-text-primary shadow-sm">
                              {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* ── Additional: feature request + support ────────────────────────── */}
      <section>
        <p className="mb-3 text-label font-semibold uppercase tracking-wider text-text-tertiary">
          Qo'shimcha
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a href="https://adspectr.com/feedback" target="_blank" rel="noreferrer" onClick={() => trackClick('feature_request')}>
            <Card hoverable className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Taklif yuborish</p>
                <p className="text-xs text-text-tertiary">Keyingi versiyaga nima qo'shilishini iltimos qiling.</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
            </Card>
          </a>

          <a href="mailto:support@adspectr.com" onClick={() => trackClick('email_support')}>
            <Card hoverable className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Email orqali murojaat</p>
                <p className="text-xs text-text-tertiary">support@adspectr.com — 24 soat ichida javob.</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
            </Card>
          </a>

          <a href="https://t.me/adspectr_support" target="_blank" rel="noreferrer" onClick={() => trackClick('telegram_support')}>
            <Card hoverable className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                <MessageSquare className="h-5 w-5 text-sky-500" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">Telegram qo'llab-quvvatlash</p>
                <p className="text-xs text-text-tertiary">@adspectr_support — tez javob.</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
            </Card>
          </a>

          <Link href="/docs" onClick={() => trackClick('full_docs')}>
            <Card hoverable className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white/85 shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">To'liq hujjatlar</p>
                <p className="text-xs text-text-tertiary">Barcha modullar bo'yicha batafsil qo'llanma.</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" />
            </Card>
          </Link>
        </div>
      </section>

      <p className="text-right text-label text-text-tertiary">
        User ID: {user?.id?.slice(0, 8) ?? '—'}…
      </p>
    </div>
  )
}
