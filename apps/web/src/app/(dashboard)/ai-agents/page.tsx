'use client'

import Link from 'next/link'
import { Bot, Cpu, Layers, Store, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PLATFORM_AGENTS } from '@/lib/ai-agents/platform-agents'
import { cn } from '@/lib/utils'

const LAYERS = [
  {
    n: '1',
    title: 'Platform Agents',
    body: "Media Buyer, Creative, Analyst — sen yaratgan. E-commerce, kurs, restoran uchun bir xil prinsip: tavsiya, tasdiq odamda.",
    icon: Cpu,
  },
  {
    n: '2',
    title: 'Targetolog Agents',
    body: "O'z usulini AI ga o'rgatadi, nom beradi, testdan keyin do'konga qo'yadi. Ijaraga: $19/oy yoki $0.05/action.",
    icon: Wrench,
  },
  {
    n: '3',
    title: 'Business Agent',
    body: "Onboardingdan keyin avtomatik: biznes UTP, mijoz, qoidalar xotirasi — boshqa platformaga o'tsa noldan.",
    icon: Layers,
  },
] as const

const HOOKS = [
  "Data lock-in: 3 oy o'rganish platformada qoladi.",
  'Daromad: agent sotilsa pul — 70% targetolog, 30% platforma.',
  "Vaqt: 10 soatlik rutinani 1 soat — lekin murakkab strategiya odamda.",
]

export default function AiAgentsHubPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Bot className="h-8 w-8 text-brand-mid dark:text-brand-lime" aria-hidden />
            Agentlar ekotizimi
          </span>
        }
        subtitle="AI 80% rutina, odam 20% strategiya. Agent boss emas — faqat tavsiya beradi, targetolog tasdiqlaydi."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ai-agents/studio"
              className={cn(
                'rounded-xl bg-gradient-to-r from-brand-mid to-brand-lime px-4 py-2 text-sm font-semibold text-brand-ink',
              )}
            >
              Agent Studio
            </Link>
            <Link
              href="/ai-agents/store"
              className={cn(
                'rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-primary',
                'bg-white/80 hover:bg-white dark:bg-slate-900/70',
              )}
            >
              Agent Store
            </Link>
            <Link href="/ai-agents/runtime" className="rounded-xl px-4 py-2 text-sm font-medium text-primary underline">
              Runtime
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {LAYERS.map((L) => (
          <div key={L.n} className="rounded-2xl border border-border bg-surface-1 p-5">
            <div className="flex items-center gap-2 text-caption font-bold uppercase text-brand-mid dark:text-brand-lime">
              <L.icon className="h-4 w-4" aria-hidden />
              Qatlam {L.n}
            </div>
            <h3 className="mt-2 text-lg font-bold text-text-primary">{L.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{L.body}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary">3 ta Platform Agent (MVP)</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PLATFORM_AGENTS.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-surface-1 p-5">
              <p className="text-xs font-semibold uppercase text-text-tertiary">{a.id.replaceAll('_', ' ')}</p>
              <p className="mt-1 font-bold text-text-primary">{a.nameUz}</p>
              <p className="mt-2 text-sm text-text-secondary">{a.descriptionUz}</p>
              <p className="mt-3 text-xs text-text-tertiary">Vertikallar: {a.verticals.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 dark:bg-amber-500/10">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <Store className="h-5 w-5 text-amber-600" aria-hidden />
          Lock-in hooklar
        </div>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-text-secondary">
          {HOOKS.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-text-tertiary">
        Chat yordamchi:{' '}
        <Link href="/create-agent" className="text-primary underline">
          AI Assistant
        </Link>
      </p>
    </div>
  )
}
