'use client'

import Link from 'next/link'
import { ArrowLeft, Plus, Users, ChevronRight } from 'lucide-react'
import { useAudienceStore } from '@/stores/audience.store'
import { useRetargetingStore } from '@/stores/retargeting.store'
import type { FunnelStage } from '@/types/retargeting'

// ─── Config ───────────────────────────────────────────────────────────────────

const FUNNEL: {
  stage: FunnelStage
  label: string
  sublabel: string
  color: string
  bg: string
  border: string
  arrow: string
}[] = [
  {
    stage: 'prospecting',
    label: '① Prospecting',
    sublabel: 'Yangi auditoriyani jalb qilish',
    color:  'text-blue-500',
    bg:     'bg-blue-500/8',
    border: 'border-blue-400/40',
    arrow:  'text-blue-300',
  },
  {
    stage: 'reengagement',
    label: '② Re-engagement',
    sublabel: 'Qiziqish bildirganlarni qaytarish',
    color:  'text-purple-500',
    bg:     'bg-purple-500/8',
    border: 'border-purple-400/40',
    arrow:  'text-purple-300',
  },
  {
    stage: 'retargeting',
    label: '③ Retargeting',
    sublabel: 'Xaridga yaqinlarni yutish',
    color:  'text-orange-500',
    bg:     'bg-orange-500/8',
    border: 'border-orange-400/40',
    arrow:  'text-orange-300',
  },
  {
    stage: 'retention',
    label: '④ Retention',
    sublabel: 'Mijozlarni ushlab turish',
    color:  'text-green-500',
    bg:     'bg-green-500/8',
    border: 'border-green-400/40',
    arrow:  'text-green-300',
  },
]

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FunnelPage() {
  const { getByStage, metrics } = useAudienceStore()
  const { campaigns } = useRetargetingStore()

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <Link href="/retargeting" className="flex items-center gap-1 text-sm text-info hover:underline mb-4">
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Funnel ko'rinishi</h1>
        <p className="text-text-secondary mt-1">
          Har bir bosqichda qancha odam bor va ular uchun kampaniyalar qay holatda
        </p>
      </div>

      {/* Funnel Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {FUNNEL.map((fs, idx) => {
          const stageAudiences  = getByStage(fs.stage)
          const stageCampaigns  = campaigns.filter((c) => c.funnelStage === fs.stage)
          const activeCount     = stageCampaigns.filter((c) => c.status === 'active').length
          const totalReach      = stageAudiences.reduce((s, a) => s + a.size, 0)

          return (
            <div key={fs.stage} className="relative">
              {/* Arrow connector (except last) */}
              {idx < FUNNEL.length - 1 && (
                <div className={`hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 ${fs.arrow}`}>
                  <ChevronRight size={20} />
                </div>
              )}

              <div className={`rounded-lg border ${fs.border} ${fs.bg} p-4 h-full flex flex-col gap-4`}>

                {/* Stage Header */}
                <div>
                  <p className={`font-semibold text-sm ${fs.color}`}>{fs.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{fs.sublabel}</p>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-center">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-text-primary">{fmtNum(totalReach)}</p>
                    <p className="text-xs text-text-tertiary">qamrov</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-text-primary">{activeCount}</p>
                    <p className="text-xs text-text-tertiary">faol</p>
                  </div>
                </div>

                {/* Audience Cards */}
                <div className="space-y-2 flex-1">
                  {stageAudiences.length === 0 ? (
                    <p className="text-xs text-text-tertiary text-center py-4">Auditoriya yo'q</p>
                  ) : (
                    stageAudiences.map((aud) => {
                      const m = metrics.find((x) => x.audienceId === aud.id)
                      return (
                        <div
                          key={aud.id}
                          className="p-3 rounded-lg bg-surface border border-border hover:border-border-hover transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary leading-snug truncate">
                                {aud.name}
                              </p>
                              <p className="text-xs text-text-tertiary mt-0.5">
                                {fmtNum(aud.size)} kishi · {aud.recencyDays}k
                              </p>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${aud.isActive ? 'bg-success' : 'bg-text-tertiary'}`} />
                          </div>
                          {m && (
                            <div className="flex gap-2 mt-2 text-xs text-text-tertiary">
                              <span>CTR {m.ctr}%</span>
                              <span>·</span>
                              <span>ROAS {m.roas}x</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Add Audience */}
                <Link
                  href="/audiences/create"
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed text-xs font-medium transition-colors ${fs.border} ${fs.color} hover:opacity-70`}
                >
                  <Plus size={13} /> Auditoriya qo'shish
                </Link>

              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="p-4 rounded-lg border border-border bg-surface-2 text-sm text-text-secondary">
        <p className="font-medium text-text-primary mb-2">Funnel qanday ishlaydi?</p>
        <div className="space-y-1 text-xs">
          <p><span className="font-medium text-blue-500">Prospecting</span> — Brend bilan tanish bo'lmagan yangi odamlarni jalb qilish</p>
          <p><span className="font-medium text-purple-500">Re-engagement</span> — Saytga kirgan yoki kontentga munosabat bildirganlarni qaytarish</p>
          <p><span className="font-medium text-orange-500">Retargeting</span> — Mahsulotni ko'rgan yoki savatga qo'shgan lekin xarid qilmaganlar</p>
          <p><span className="font-medium text-green-500">Retention</span> — Mavjud mijozlarni qayta xaridga undash va LTV oshirish</p>
        </div>
      </div>

    </div>
  )
}
