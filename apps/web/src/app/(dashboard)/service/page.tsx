'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { agents } from '@/lib/api-client'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AgentCard {
  id: string
  slug: string
  agentType: 'human' | 'ai'
  displayName: string
  title: string
  bio: string | null
  avatar: string | null
  avatarColor: string | null
  location: string | null
  responseTime: string | null
  monthlyRate: number
  commissionRate: number
  pricingModel: 'fixed' | 'commission' | 'hybrid'
  isVerified: boolean
  isProMember: boolean
  isFeatured: boolean
  niches: string[]
  platforms: string[]
  cachedStats: any
  cachedRating: number
  cachedReviewCount: number
}

interface Engagement {
  id: string
  agentProfileId: string
  status: string
  agreedMonthlyRate: number
  agreedCommissionRate: number
  agreedPricingModel: string
  startDate: string
  agentProfile: AgentCard
}

const PLATFORM_ICONS: Record<string, string> = {
  meta: '📘', google: '🔍', yandex: '🟡',
  telegram: '✈️', tiktok: '🎵', youtube: '▶️',
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function AgentCardItem({
  agent,
  onHire,
  hiring,
}: {
  agent: AgentCard
  onHire: (id: string) => void
  hiring: string | null
}) {
  const stats = agent.cachedStats || {}
  const priceLabel = agent.pricingModel === 'commission'
    ? `${agent.commissionRate}% komissiya`
    : agent.monthlyRate === 0
      ? 'Bepul (Subscription bilan)'
      : `$${agent.monthlyRate}/oy`

  return (
    <div className={`bg-surface border rounded-2xl p-5 ${agent.isFeatured ? 'border-violet-200 ring-1 ring-violet-100' : 'border-border'}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.avatarColor || 'from-gray-200 to-gray-300'} flex items-center justify-center text-xl shrink-0`}
        >
          {agent.avatar || (agent.agentType === 'ai' ? '🤖' : '👤')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-text-primary text-sm">{agent.displayName}</span>
            {agent.isVerified && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">✓ TASDIQLANGAN</span>
            )}
            {agent.agentType === 'ai' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600">🤖 AI</span>
            )}
          </div>
          <p className="text-text-tertiary text-xs mt-0.5 truncate">{agent.title}</p>
          {agent.location && <p className="text-[10px] text-text-tertiary mt-0.5">📍 {agent.location}</p>}
        </div>
        <div className="text-right shrink-0">
          {agent.cachedRating > 0 && (
            <p className="text-sm font-bold text-text-primary">⭐ {agent.cachedRating.toFixed(1)}</p>
          )}
          {agent.cachedReviewCount > 0 && (
            <p className="text-[10px] text-text-tertiary">{agent.cachedReviewCount} sharh</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats.avgROAS > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'ROAS', value: `${stats.avgROAS}x` },
            { label: 'Kampaniya', value: stats.totalCampaigns?.toLocaleString() },
            { label: 'Muvaffaqiyat', value: `${stats.successRate}%` },
          ].map(s => (
            <div key={s.label} className="bg-surface-2 rounded-lg p-2 text-center">
              <p className="text-xs font-bold text-text-primary">{s.value}</p>
              <p className="text-[10px] text-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Platforms */}
      <div className="flex flex-wrap gap-1 mb-3">
        {agent.platforms.slice(0, 5).map(p => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-text-tertiary border border-border">
            {PLATFORM_ICONS[p] || '📢'} {p}
          </span>
        ))}
      </div>

      {/* Niches */}
      <div className="flex flex-wrap gap-1 mb-4">
        {agent.niches.slice(0, 3).map(n => (
          <span key={n} className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-text-tertiary border border-border">
            {n}
          </span>
        ))}
      </div>

      {/* Price + Hire */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <p className="text-[10px] text-text-tertiary">Narxi</p>
          <p className="text-sm font-semibold text-text-primary">{priceLabel}</p>
        </div>
        <Button
          size="sm"
          onClick={() => onHire(agent.id)}
          disabled={hiring === agent.id}
          className="text-xs"
        >
          {hiring === agent.id ? <><Spinner size="sm" /> Yuklanmoqda...</> : '+ Yollash'}
        </Button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ServiceSelectionPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [tab, setTab] = useState<'all' | 'ai' | 'human'>('all')
  const [agentList, setAgentList] = useState<AgentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [hiring, setHiring] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentEngagement, setCurrentEngagement] = useState<Engagement | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const workspaceId = currentWorkspace?.id

  useEffect(() => {
    loadData()
  }, [workspaceId])

  async function loadData() {
    setLoading(true)
    try {
      const [agentsRes, engagementRes] = await Promise.all([
        agents.list({ limit: 50 }),
        workspaceId ? agents.getCurrentEngagement(workspaceId) : Promise.resolve({ data: null }),
      ])
      setAgentList(agentsRes.data?.agents || [])
      setCurrentEngagement(engagementRes.data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  async function handleHire(agentId: string) {
    if (!workspaceId) { setError("Avval workspace tanlang"); return }
    setHiring(agentId)
    setError('')
    try {
      await agents.hire(workspaceId, agentId)
      setSuccess("Agent muvaffaqiyatli ulandi! Endi siz yoqtirishingiz mumkin yoki u avtomatik ishlaydi.")
      await loadData()
      setTimeout(() => setSuccess(''), 5000)
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi')
    } finally {
      setHiring(null)
    }
  }

  async function handleCancel() {
    if (!currentEngagement) return
    setCancelling(true)
    try {
      await agents.cancelEngagement(currentEngagement.id)
      setCurrentEngagement(null)
      setSuccess("Engagement bekor qilindi. Endi o'zingiz boshqarasiz.")
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Xatolik')
    } finally {
      setCancelling(false)
    }
  }

  const filtered = agentList.filter(a =>
    tab === 'all' ? true : a.agentType === tab
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Xizmat turini tanlash</h1>
        <p className="text-text-tertiary text-sm mt-1">
          Reklamangizni kim boshqaradi — siz, jonli targetolog yoki AI agent?
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Current engagement banner */}
      {currentEngagement && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-emerald-500 font-semibold text-sm">✅ Faol: {currentEngagement.agentProfile?.displayName}</p>
              <p className="text-emerald-500 text-xs mt-0.5">{currentEngagement.agentProfile?.title}</p>
              <p className="text-text-tertiary text-xs mt-1">
                Ulangan: {new Date(currentEngagement.startDate).toLocaleDateString('uz-UZ')}
                {' · '}
                {currentEngagement.agreedPricingModel === 'commission'
                  ? `${currentEngagement.agreedCommissionRate}% komissiya`
                  : `$${currentEngagement.agreedMonthlyRate}/oy`}
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-red-500 hover:text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all shrink-0"
            >
              {cancelling ? '...' : 'Bekor qilish'}
            </button>
          </div>
        </div>
      )}

      {/* Service type cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            icon: '🧑‍💻',
            title: "O'zim boshqaraman",
            desc: "Dashboard orqali kampaniyalarni o'zingiz yarating va boshqaring",
            active: !currentEngagement,
            onClick: () => currentEngagement ? handleCancel() : null,
          },
          {
            icon: '👤',
            title: 'Jonli Targetolog',
            desc: "Tajribali mutaxassis sizning byudjetingizni boshqaradi",
            active: currentEngagement?.agentProfile?.agentType === 'human',
            onClick: () => setTab('human'),
          },
          {
            icon: '🤖',
            title: 'AI Agent',
            desc: "24/7 ishlaydi, real vaqtda optimallaydi, tezkor natijalar",
            active: currentEngagement?.agentProfile?.agentType === 'ai',
            onClick: () => setTab('ai'),
          },
        ].map(card => (
          <button
            key={card.title}
            onClick={card.onClick || undefined}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              card.active
                ? 'border-border bg-surface-2'
                : 'border-border hover:border-border bg-surface'
            }`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="font-semibold text-text-primary text-sm">{card.title}</p>
            <p className="text-text-tertiary text-xs mt-1 leading-relaxed">{card.desc}</p>
            {card.active && <p className="text-xs text-emerald-500 font-medium mt-2">✓ Faol</p>}
          </button>
        ))}
      </div>

      {/* Monetization note */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <p className="text-xs text-amber-500 font-medium mb-1">💡 Monetizatsiya modeli</p>
        <p className="text-xs text-amber-500 leading-relaxed">
          Jonli targetologlar uchun: ular oylik to'lov oladi, Performa 15% komissiya oladi.
          AI agentlar uchun: ba'zilari bepul (subscription bilan), ba'zilari oylik to'lov + kichik komissiya.
          O'z AI agentingizni yaratib, boshqalarga ijaraga bersangiz — siz 80% daromad olasiz.
        </p>
      </div>

      {/* Agent list */}
      {agentList.length > 0 && (
        <div>
          {/* Type filter */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'Hammasi' },
              { key: 'ai', label: '🤖 AI Agentlar' },
              { key: 'human', label: '👤 Targetologlar' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  tab === t.key
                    ? 'bg-surface text-white'
                    : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(agent => (
              <AgentCardItem
                key={agent.id}
                agent={agent}
                onHire={handleHire}
                hiring={hiring}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-text-tertiary py-8 text-sm">
              Bu kategoriyada hozircha agent yo'q
            </p>
          )}

          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/portfolio')}
              className="text-sm text-text-tertiary hover:text-text-primary underline"
            >
              Batafsil profil ko'rish →
            </button>
          </div>
        </div>
      )}

      {/* Become a targetologist CTA */}
      <div className="border border-border rounded-2xl p-5 text-center">
        <p className="text-lg font-bold text-text-primary mb-1">Targetolsiz yoki AI agent qurasizmi?</p>
        <p className="text-text-tertiary text-sm mb-4">
          O'z profilingizni yarating va Performa orqali qo'shimcha daromad qiling.
          Kuchli targetologlar 80% ga yaqin daromad oladi.
        </p>
        <Button
          variant="secondary"
          onClick={() => router.push('/my-portfolio')}
          size="sm"
        >
          Agent/Targetolog bo'lish →
        </Button>
      </div>

    </div>
  )
}
