'use client'

import { useState, useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { triggersets as triggersetsApi } from '@/lib/api-client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Automation {
  id: string
  name: string
  enabled: boolean
  tacticType?: TacticType
  conditions: { metric: string; operator: string; value: number; windowDays: number }[]
  actions: { type: string; value?: number }[]
  lastRunStatus: string | null
  lastRunAt: string | null
  totalFires: number
  createdAt: string
}

type TacticType = 'stop_loss' | 'revive' | 'surf' | 'sunsetting' | 'custom'

// ─── Pre-built tactic templates ───────────────────────────────────────────────

const TACTIC_TEMPLATES = [
  {
    type: 'stop_loss' as TacticType,
    icon: '🛑',
    name: 'Stop Loss',
    desc: 'Yomon ishlayotgan ad setlarni to\'xtatish bilan byudjetni himoya qilish',
    level: 'Ad Set',
    color: 'bg-red-50 border-red-200 text-red-700',
    conditions: [{ metric: 'roas', operator: 'lt', value: 0.75, windowDays: 1 }],
    actions: [{ type: 'pause_campaign', value: 0 }],
  },
  {
    type: 'revive' as TacticType,
    icon: '🔙',
    name: 'Revive',
    desc: 'Attribution kechikishi tufayli to\'xtatilgan yaxshi ads larni qaytarish',
    level: 'Ad / Ad Set',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    conditions: [{ metric: 'roas', operator: 'gte', value: 2.5, windowDays: 7 }],
    actions: [{ type: 'notify_telegram', value: 0 }],
  },
  {
    type: 'surf' as TacticType,
    icon: '🏄',
    name: 'Surf',
    desc: 'Ads yaxshi ishlayotganda byudjetni avtomatik oshirish',
    level: 'Ad Set / Campaign',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    conditions: [{ metric: 'roas', operator: 'gte', value: 3.0, windowDays: 1 }],
    actions: [{ type: 'increase_budget', value: 20 }],
  },
  {
    type: 'sunsetting' as TacticType,
    icon: '📉',
    name: 'Sunsetting',
    desc: 'Uzoq vaqt yomon ishlayotgan ad setlarni asta-sekin o\'chirish',
    level: 'Ad Set',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    conditions: [{ metric: 'roas', operator: 'lt', value: 1.0, windowDays: 7 }],
    actions: [{ type: 'decrease_budget', value: 30 }],
  },
]

const ACTION_ICONS: Record<string, string> = {
  pause_campaign: '⏸',
  start_campaign: '▶️',
  increase_budget: '📈',
  decrease_budget: '📉',
  notify_telegram: '📱',
  notify_email: '📧',
}

const STATUS_STYLE: Record<string, string> = {
  success:  'text-emerald-700 bg-emerald-50',
  failed:   'text-red-700 bg-red-50',
  no_match: 'text-gray-500 bg-gray-100',
  skipped:  'text-amber-700 bg-amber-50',
}

// ─── Mock chart data ──────────────────────────────────────────────────────────

const mockChartData = Array.from({ length: 14 }, (_, i) => ({
  day: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
  start: Math.floor(Math.random() * 8),
  pause: Math.floor(Math.random() * 5),
  increase: Math.floor(Math.random() * 6),
  decrease: Math.floor(Math.random() * 3),
}))

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutomationOverviewPage() {
  const { currentWorkspace, accessToken } = useWorkspaceStore()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading]         = useState(true)
  const [showNew, setShowNew]         = useState(false)
  const [activeTab, setActiveTab]     = useState<'all' | TacticType>('all')

  useEffect(() => {
    if (!currentWorkspace?.id || !accessToken) { setLoading(false); return }
    triggersetsApi.list(currentWorkspace.id, accessToken)
      .then((data: Automation[]) => setAutomations(data))
      .catch(() => setAutomations([]))
      .finally(() => setLoading(false))
  }, [currentWorkspace?.id, accessToken])

  const filtered = activeTab === 'all' ? automations : automations.filter(a => a.tacticType === activeTab)

  const stats = {
    active:   automations.filter(a => a.enabled).length,
    fires:    automations.reduce((s, a) => s + (a.totalFires || 0), 0),
    missing:  TACTIC_TEMPLATES.filter(t => !automations.some(a => a.tacticType === t.type)).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Barcha avtomatsiyalar holati va faoliyati</p>
        </div>
        <button
          onClick={() => window.location.href = '/triggersets'}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
        >
          + Yangi Automation
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Faol avtomatsiyalar', value: stats.active, icon: '⚡', color: 'text-indigo-700 bg-indigo-50' },
          { label: 'Jami ishga tushgan', value: stats.fires, icon: '🔥', color: 'text-orange-700 bg-orange-50' },
          { label: 'Yo\'q taktikalar', value: stats.missing, icon: '⚠️', color: 'text-amber-700 bg-amber-50' },
          { label: 'Jami avtomatsiyalar', value: automations.length, icon: '🤖', color: 'text-emerald-700 bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Missing tactics warning */}
      {stats.missing > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-3">⚠️ Quyidagi taktikalar hali o'rnatilmagan:</div>
          <div className="grid grid-cols-4 gap-3">
            {TACTIC_TEMPLATES.filter(t => !automations.some(a => a.tacticType === t.type)).map(t => (
              <div key={t.type} className={`p-3 rounded-xl border ${t.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  <span className="font-semibold text-sm">{t.name}</span>
                </div>
                <p className="text-xs leading-relaxed mb-2">{t.desc}</p>
                <button
                  onClick={() => window.location.href = '/triggersets'}
                  className="text-xs font-semibold underline"
                >
                  O'rnatish →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Avtomatsiya faoliyati (so'nggi 14 kun)</h3>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block"></span>Start</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block"></span>Pause</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span>Increase</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block"></span>Decrease</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-32">
          {mockChartData.map((d, i) => {
            const total = d.start + d.pause + d.increase + d.decrease
            const max = Math.max(...mockChartData.map(x => x.start + x.pause + x.increase + x.decrease)) || 1
            const h = Math.round((total / max) * 100)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col-reverse rounded overflow-hidden" style={{ height: `${Math.max(h, 4)}%` }}>
                  <div className="bg-emerald-400" style={{ flex: d.start }}></div>
                  <div className="bg-red-400" style={{ flex: d.pause }}></div>
                  <div className="bg-blue-400" style={{ flex: d.increase }}></div>
                  <div className="bg-orange-400" style={{ flex: d.decrease }}></div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {mockChartData.map((d, i) => (
            <div key={i} className="flex-1 text-[9px] text-gray-400 text-center truncate">{d.day.split(' ')[1]}</div>
          ))}
        </div>
      </div>

      {/* Automations table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4 gap-1 overflow-x-auto">
          {[
            { key: 'all', label: 'Barchasi' },
            { key: 'stop_loss', label: '🛑 Stop Loss' },
            { key: 'revive', label: '🔙 Revive' },
            { key: 'surf', label: '🏄 Surf' },
            { key: 'sunsetting', label: '📉 Sunsetting' },
            { key: 'custom', label: '⚙️ Custom' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-3 py-3 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <div className="text-gray-400 text-sm">Hali avtomatsiya yo'q</div>
            <button
              onClick={() => window.location.href = '/triggersets'}
              className="text-xs text-indigo-600 font-medium hover:underline"
            >
              Birinchi avtomatsiyani yaratish →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Holat</th>
                <th className="px-5 py-3 text-left">Nom</th>
                <th className="px-5 py-3 text-left">Amal</th>
                <th className="px-5 py-3 text-center">Ishga tushgan</th>
                <th className="px-5 py-3 text-left">Oxirgi yuguriш</th>
                <th className="px-5 py-3 text-left">Oxirgi holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className={`w-2 h-2 rounded-full inline-block ${a.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`}></div>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {a.actions.map((act, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          {ACTION_ICONS[act.type] || '⚙️'} {act.type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center font-semibold text-gray-700">{a.totalFires}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {a.lastRunAt ? new Date(a.lastRunAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {a.lastRunStatus ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[a.lastRunStatus] || 'text-gray-500 bg-gray-100'}`}>
                        {a.lastRunStatus}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
