'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Store,
  Wrench,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PLATFORM_AGENTS } from '@/lib/ai-agents/platform-agents'
import { AgentAvatar } from './_components/AgentAvatar'
import { EcosystemFlow } from './_components/EcosystemFlow'
import { MetricTile } from './_components/MetricTile'
import {
  DEMO_MY_AGENTS,
  getApprovalRate,
  getPendingRecommendations,
  getTotalImpactUsd,
} from './_lib/mock-data'

const PLATFORM_AGENT_VISUAL: Record<string, { emoji: string; accent: string }> = {
  media_buyer: { emoji: '📊', accent: '#0284c7' },
  creative: { emoji: '🎨', accent: '#db2777' },
  analyst: { emoji: '🔍', accent: '#7c3aed' },
}

export default function AiAgentsHubPage() {
  const activeAgentsCount = DEMO_MY_AGENTS.filter((a) => a.status === 'active').length
  const totalImpact = getTotalImpactUsd()
  const approvalRate = getApprovalRate()
  const pendingCount = getPendingRecommendations().length

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Bot className="h-7 w-7 text-brand-mid dark:text-brand-lime" aria-hidden />
            Agentlar
          </span>
        }
        subtitle="AI 80% rutina · Odam 20% strategiya — agentlar tavsiya, siz tasdiq"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ai-agents/mine"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1b2e06] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(27,46,6,0.4)] transition-all hover:bg-[#243a12]"
            >
              Mening agentlarim
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              href="/ai-agents/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2"
            >
              <Store className="h-3.5 w-3.5" aria-hidden />
              Store
            </Link>
            <Link
              href="/ai-agents/studio"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-2"
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden />
              Studio
            </Link>
          </div>
        }
      />

      {/* Live metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Aktiv agentlar"
          value={String(activeAgentsCount)}
          icon={Activity}
          accent="#16a34a"
        />
        <MetricTile
          label="Jami foyda"
          value={`+$${totalImpact.toLocaleString('uz-UZ')}`}
          delta="bu oy"
          deltaDirection="up"
          icon={DollarSign}
          accent="#0284c7"
        />
        <MetricTile
          label="Tasdiq foizi"
          value={`${approvalRate}%`}
          icon={CheckCircle2}
          accent="#7c3aed"
        />
        <MetricTile
          label="Kutilayotgan tavsiyalar"
          value={String(pendingCount)}
          delta={pendingCount > 0 ? "Ko'rib chiqing" : 'Bo\'sh'}
          deltaDirection={pendingCount > 0 ? 'up' : 'neutral'}
          icon={Sparkles}
          accent="#d97706"
        />
      </div>

      {/* Ecosystem flow */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Ekotizim</h2>
          <p className="text-sm text-text-secondary">
            3 qatlam — har biri sizning biznesingizning bir qismini avtomatlashtiradi
          </p>
        </div>
        <EcosystemFlow />
      </section>

      {/* Platform agents */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Platform Agentlar</h2>
            <p className="text-sm text-text-secondary">
              Tayyor — har bir biznesga moslangan
            </p>
          </div>
          <Link
            href="/ai-agents/mine"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Mening agentlarim →
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PLATFORM_AGENTS.map((a) => {
            const vis = PLATFORM_AGENT_VISUAL[a.id]
            return (
              <div
                key={a.id}
                className="rounded-2xl border border-border bg-surface p-5 transition-all hover:border-text-tertiary/40 hover:shadow-sm"
              >
                <AgentAvatar emoji={vis.emoji} accent={vis.accent} size="lg" />
                <p className="mt-3 text-base font-bold text-text-primary">
                  {a.nameUz}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {a.descriptionUz}
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-wide text-text-tertiary">
                  {a.verticals.join(' · ')}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-text-primary">Qanday ishlaydi?</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              n: '1',
              title: 'Agent kuzatadi',
              desc: 'Kampaniyalaringizni 24/7 monitoring qiladi — CTR, ROAS, CPA, anomaliyalar',
              emoji: '👁️',
              color: '#0284c7',
            },
            {
              n: '2',
              title: 'Tavsiya beradi',
              desc: 'Aniq harakat tavsiya qiladi: byudjetni oshir, kreativni almashtir, lookalike yarat',
              emoji: '💡',
              color: '#d97706',
            },
            {
              n: '3',
              title: 'Siz tasdiqlaysiz',
              desc: '1 bosishda Approve yoki Reject. Yuqori ishonchli (≥90%) tavsiyalarni avto-tasdiq qilish mumkin',
              emoji: '✓',
              color: '#16a34a',
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ background: `${s.color}1a`, color: s.color }}
                >
                  {s.n}
                </span>
                <span className="text-xl" aria-hidden>{s.emoji}</span>
              </div>
              <p className="mt-3 text-sm font-bold text-text-primary">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Targetologists hook */}
      <section className="rounded-2xl border border-brand-mid/30 bg-gradient-to-br from-brand-mid/[0.04] to-brand-lime/[0.06] p-6 dark:border-brand-lime/25 dark:from-brand-lime/[0.04] dark:to-brand-lime/[0.08]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-mid dark:text-brand-lime">
              Targetologlar uchun
            </p>
            <h3 className="mt-1 text-xl font-bold text-text-primary">
              O'z metodikangizni AI ga o'rgating va daromad qiling
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Muvaffaqiyatli kampaniyalaringiz + qoidalar + tone → Agent Studio.
              Test → tasdiq → Store. Har sotuvdan 70% sizga, 30% platformaga.
            </p>
          </div>
          <Link
            href="/ai-agents/studio"
            className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#1b2e06] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(27,46,6,0.4)] transition-all hover:bg-[#243a12] md:self-center"
          >
            Studio'ni ochish
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
