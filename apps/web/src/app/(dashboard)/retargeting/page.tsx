'use client'

import Link from 'next/link'
import { RefreshCcw, Plus, Users, Megaphone, TrendingUp, Play, Pause, ArrowRight } from 'lucide-react'
import { useAudienceStore } from '@/stores/audience.store'
import { useRetargetingStore } from '@/stores/retargeting.store'
import type { FunnelStage, CampaignStatus } from '@/types/retargeting'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FUNNEL_STAGES: { stage: FunnelStage; label: string; color: string; bg: string }[] = [
  { stage: 'prospecting',   label: 'Prospecting',   color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  { stage: 'reengagement',  label: 'Re-engagement', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { stage: 'retargeting',   label: 'Retargeting',   color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { stage: 'retention',     label: 'Retention',     color: 'text-green-500',  bg: 'bg-green-500/10' },
]

const STATUS_STYLE: Record<CampaignStatus, string> = {
  active:  'bg-success/10 text-success',
  paused:  'bg-warning/10 text-warning',
  draft:   'bg-info/10 text-info',
  ended:   'bg-text-tertiary/10 text-text-tertiary',
}

const PLATFORM_LABEL: Record<string, string> = {
  meta: 'Meta', google: 'Google', tiktok: 'TikTok', yandex: 'Yandex',
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RetargetingPage() {
  const { audiences, metrics, getByStage } = useAudienceStore()
  const { campaigns, updateCampaignStatus } = useRetargetingStore()

  const activeCampaigns = campaigns.filter((c) => c.status === 'active')
  const totalSpend = metrics.reduce((s, m) => s + m.spend, 0)
  const avgRoas   = metrics.length
    ? (metrics.reduce((s, m) => s + m.roas, 0) / metrics.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <RefreshCcw size={24} /> Retargeting
          </h1>
          <p className="text-text-secondary mt-1">
            Auditoriyalarni boshqaring va kampaniyalarni kuzating
          </p>
        </div>
        <Link
          href="/retargeting/wizard"
          className="flex items-center gap-2 px-4 py-2 bg-info text-surface rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> Yangi kampaniya
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami auditoriya',    value: audiences.length,       icon: Users,      suffix: 'ta' },
          { label: 'Faol kampaniyalar',  value: activeCampaigns.length, icon: Megaphone,  suffix: 'ta' },
          { label: 'Oylik xarajat',      value: `$${totalSpend}`,       icon: TrendingUp, suffix: '' },
          { label: "O'rtacha ROAS",      value: `${avgRoas}x`,          icon: TrendingUp, suffix: '' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-lg border border-border bg-surface-2">
            <p className="text-xs text-text-tertiary mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-text-primary">
              {stat.value}{stat.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Funnel Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Funnel bosqichlari</h2>
          <Link href="/retargeting/funnel" className="text-sm text-info flex items-center gap-1 hover:underline">
            Batafsil <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FUNNEL_STAGES.map((fs) => {
            const stageAudiences = getByStage(fs.stage)
            const stageCampaigns = campaigns.filter((c) => c.funnelStage === fs.stage)
            const totalReach = stageAudiences.reduce((s, a) => s + a.size, 0)

            return (
              <div key={fs.stage} className="p-4 rounded-lg border border-border bg-surface-2 space-y-3">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${fs.bg} ${fs.color}`}>
                  {fs.label}
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-text-primary">{fmtNum(totalReach)}</p>
                  <p className="text-xs text-text-tertiary">Umumiy qamrov</p>
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{stageAudiences.length} auditoriya</span>
                  <span>{stageCampaigns.filter(c => c.status === 'active').length} faol</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Kampaniyalar</h2>
          <Link href="/retargeting/wizard" className="text-sm text-info flex items-center gap-1 hover:underline">
            <Plus size={14} /> Yangi
          </Link>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Kampaniya</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Platforma</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Bosqich</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Byudjet/kun</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => {
                const stage = FUNNEL_STAGES.find((f) => f.stage === c.funnelStage)
                return (
                  <tr key={c.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{PLATFORM_LABEL[c.platform]}</td>
                    <td className="px-4 py-3">
                      {stage && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.bg} ${stage.color}`}>
                          {stage.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-primary">${c.dailyBudget}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updateCampaignStatus(c.id, c.status === 'active' ? 'paused' : 'active')
                        }
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
                        title={c.status === 'active' ? 'Paused qilish' : 'Yoqish'}
                      >
                        {c.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
