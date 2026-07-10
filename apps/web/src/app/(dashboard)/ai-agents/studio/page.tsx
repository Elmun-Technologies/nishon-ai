'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  FileText,
  MessageSquare,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { useWorkspaceStore } from '@/stores/workspace.store'
import type { VerticalId } from '@/lib/ai-agents/types'
import { cn } from '@/lib/utils'
import { AgentAvatar } from '../_components/AgentAvatar'
import { VERTICAL_LABELS_AGENTS } from '../_lib/mock-data'

type WizardStep = 1 | 2 | 3 | 4

const DEMO_CAMPAIGNS = [
  { id: 'cmp_101', name: 'Krossovka — Meta 2026 Q1', roas: 4.2, leads: 234 },
  { id: 'cmp_102', name: 'Retarget post-purchase', roas: 6.8, leads: 89 },
  { id: 'cmp_103', name: 'Lookalike 1% test', roas: 3.1, leads: 156 },
  { id: 'cmp_104', name: 'Kiyim Reels Spring', roas: 5.4, leads: 178 },
]

const AGENT_AVATARS = [
  { emoji: '🎯', accent: '#16a34a' },
  { emoji: '🚀', accent: '#0284c7' },
  { emoji: '⚡', accent: '#d97706' },
  { emoji: '🔮', accent: '#7c3aed' },
  { emoji: '🎨', accent: '#db2777' },
  { emoji: '🤖', accent: '#0ea5e9' },
]

export default function AgentStudioPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const [step, setStep] = useState<WizardStep>(1)
  const [name, setName] = useState('Mening kiyim strategiyam')
  const [vertical, setVertical] = useState<VerticalId>('ecommerce')
  const [avatar, setAvatar] = useState(AGENT_AVATARS[0])
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([
    'cmp_101',
    'cmp_102',
  ])
  const [rules, setRules] = useState(
    "Agar ROAS < 2 bo'lsa, budgetni 20% kamaytirishni tavsiya qil.\nCPM > $5 bo'lsa, ogohlantir.\nReels 9:16 format ustun.",
  )
  const [tone, setTone] = useState("O'zbekcha, do'stona, narx aytmaslik")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelectedCampaigns((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    )
  }

  const train = async () => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/ai-agents/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          vertical,
          campaignIds: selectedCampaigns,
          rules,
          toneUz: tone,
        }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        message?: string
        jobId?: string
      }
      if (!res.ok || !j.ok) throw new Error(j.message || 'Xato')
      setMsg(`Trening boshlandi (Job: ${j.jobId}). 3 kunlik sinov rejimi — keyin Agent Store'ga qo'yiladi.`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setLoading(false)
    }
  }

  const stepValid =
    step === 1
      ? name.trim().length >= 2
      : step === 2
        ? selectedCampaigns.length > 0
        : step === 3
          ? rules.trim().length > 0 && tone.trim().length > 0
          : true

  const steps: { id: WizardStep; label: string; icon: typeof Database }[] = [
    { id: 1, label: 'Asoslar', icon: FileText },
    { id: 2, label: 'Data', icon: Database },
    { id: 3, label: 'Qoidalar', icon: MessageSquare },
    { id: 4, label: 'Tasdiq', icon: CheckCircle2 },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Wrench className="h-7 w-7 text-brand-mid dark:text-brand-lime" aria-hidden />
            Agent Studio
          </span>
        }
        subtitle="O'z muvaffaqiyatli kampaniyalaringizni AI agentga aylantiring — 4 qadamda"
        actions={
          <Link
            href="/ai-agents"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Hub
          </Link>
        }
      />

      <Alert variant="warning">
        Beta — Agent Studio namuna kampaniyalar bilan ishlaydi va trening simulyatsiya
        rejimida. Real trening quvuri tez orada ulanadi.
      </Alert>

      {!currentWorkspace?.id && (
        <Alert variant="info">
          Workspace tanlang — kampaniya datalari shu yerga ulanadi (keyingi bosqich).
        </Alert>
      )}
      {err && <Alert variant="error">{err}</Alert>}
      {msg && <Alert variant="info">{msg}</Alert>}

      {/* Progress ribbon */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const done = s.id < step
            const current = s.id === step
            return (
              <div key={s.id} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => done && setStep(s.id)}
                  disabled={!done && !current}
                  className={cn(
                    'group flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left transition-all',
                    current
                      ? 'bg-[#1b2e06] text-white shadow-sm'
                      : done
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-surface-2/60 text-text-tertiary',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                      current ? 'bg-white/15' : done ? 'bg-emerald-200/60 dark:bg-emerald-500/20' : 'bg-surface',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Icon className="h-3.5 w-3.5" aria-hidden />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide">
                      Qadam {s.id}
                    </p>
                    <p className="truncate text-xs font-semibold">{s.label}</p>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <span className="hidden h-px w-2 shrink-0 bg-border md:block" aria-hidden />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Agentingizni nomlang
              </h2>
              <p className="text-sm text-text-secondary">
                Aniq va eslab qoluvchi nom — kelajakda Store'da ko'rinadi
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-text-secondary">
                Agent nomi
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Krossovka Lookalike Pro"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              />
            </label>

            <div>
              <p className="text-sm font-medium text-text-secondary">
                Vertikal
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(Object.keys(VERTICAL_LABELS_AGENTS) as VerticalId[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVertical(v)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-all',
                      vertical === v
                        ? 'bg-[#1b2e06] text-white'
                        : 'border border-border bg-surface text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    {VERTICAL_LABELS_AGENTS[v]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-secondary">
                Avatar tanlang
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {AGENT_AVATARS.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={cn(
                      'rounded-2xl p-1 transition-all',
                      avatar.emoji === a.emoji
                        ? 'ring-2 ring-primary'
                        : 'opacity-60 hover:opacity-100',
                    )}
                  >
                    <AgentAvatar emoji={a.emoji} accent={a.accent} size="lg" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Muvaffaqiyatli kampaniyalar
              </h2>
              <p className="text-sm text-text-secondary">
                Agent qaysi kampaniyalardan o'rganishini tanlang — eng yaxshi natija
                bergan kampaniyalar tavsiya etiladi
              </p>
            </div>

            <div className="space-y-2">
              {DEMO_CAMPAIGNS.map((c) => {
                const selected = selectedCampaigns.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                      selected
                        ? 'border-[#84cc16] bg-[#ecfccb]/40 dark:bg-brand-lime/[0.06]'
                        : 'border-border bg-surface hover:border-text-tertiary/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                        selected
                          ? 'border-[#65a30d] bg-[#65a30d]'
                          : 'border-border bg-transparent',
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-white" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        ROAS {c.roas}× · {c.leads} lead
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-text-tertiary">
                      {c.id}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-text-tertiary">
              {selectedCampaigns.length} ta kampaniya tanlangan — agent shulardan
              o'rganadi
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Qoidalar va tone
              </h2>
              <p className="text-sm text-text-secondary">
                Agent qanday qaror qabul qilishi va siz bilan qanday gaplashishi
              </p>
            </div>

            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Qoidalar (har qator — alohida qoida)
                </span>
                <span className="text-[11px] text-text-tertiary">
                  {rules.split('\n').filter(Boolean).length} ta qoida
                </span>
              </div>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={6}
                placeholder={`Masalan:\nAgar ROAS < 2 bo'lsa, budgetni kamaytirishni tavsiya qil\nCPM > $5 bo'lsa, ogohlantir\nReels 9:16 formatda — ustun`}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 font-mono text-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text-secondary">
                Tone (agent qanday gaplashadi)
              </span>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Masalan: O'zbekcha, do'stona, narx aytmaslik"
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15"
              />
            </label>

            <div className="rounded-xl border border-blue-500/30 bg-blue-50/40 p-3 dark:bg-blue-500/[0.04]">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                Maslahat
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                Yaxshi agent — aniq qoidalari bor agent. "ROAS pasaysa" emas, "ROAS 2x dan kam
                bo'lsa" deb yozing. Sonlar bilan — aniqlik beradi.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Yakuniy ko'rinish
              </h2>
              <p className="text-sm text-text-secondary">
                Trening boshlanishidan oldin tekshirib oling
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2/40 p-5 dark:bg-surface-elevated/30">
              <div className="flex items-start gap-4">
                <AgentAvatar
                  emoji={avatar.emoji}
                  accent={avatar.accent}
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold text-text-primary">{name}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {VERTICAL_LABELS_AGENTS[vertical]} · Sinov rejimi 3 kun
                  </p>

                  <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                    <div className="rounded-lg bg-white p-3 dark:bg-surface">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                        Trening data
                      </p>
                      <p className="mt-1 font-semibold text-text-primary">
                        {selectedCampaigns.length} ta kampaniya
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 dark:bg-surface">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                        Qoidalar
                      </p>
                      <p className="mt-1 font-semibold text-text-primary">
                        {rules.split('\n').filter(Boolean).length} ta qoida
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-white p-3 dark:bg-surface">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                      Tone
                    </p>
                    <p className="mt-1 text-sm text-text-primary">{tone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-mid/30 bg-brand-mid/[0.04] p-4 dark:border-brand-lime/25 dark:bg-brand-lime/[0.04]">
              <div className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-mid dark:text-brand-lime"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Keyin nima bo'ladi?
                  </p>
                  <ol className="mt-1.5 ml-4 list-decimal space-y-0.5 text-xs text-text-secondary">
                    <li>Trening boshlanadi (~5 daqiqa)</li>
                    <li>Sizning kampaniyalaringizda 3 kun sinov</li>
                    <li>Natijalar yetarli bo'lsa — Store'ga qo'yiladi</li>
                    <li>Boshqa biznes ijaraga olsa — 70% sizniki</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => (Math.max(1, s - 1) as WizardStep))}
          disabled={step === 1}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary disabled:opacity-50 hover:bg-surface-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Orqaga
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (Math.min(4, s + 1) as WizardStep))}
            disabled={!stepValid}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1b2e06] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#243a12] disabled:opacity-50"
          >
            Davom etish
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void train()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime px-6 py-3 text-sm font-bold text-brand-ink shadow-[0_8px_24px_-12px_rgba(132,204,22,0.6)] transition-all hover:brightness-105 disabled:opacity-50"
          >
            {loading ? 'Trening boshlanmoqda…' : 'Treningni boshlash'}
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
