'use client'

import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const ACCOUNTS = [
  { name: 'Acme · Meta Ads', id: 'act_8240...', status: 'ok', updated: '2 min ago' },
  { name: 'Acme · Google Ads', id: '341-002-991', status: 'ok', updated: '5 min ago' },
  { name: 'Acme · TikTok', id: '7224...', status: 'warn', updated: 'reauth needed' },
  { name: 'Client X · Meta', id: 'act_1180...', status: 'syncing', updated: 'syncing now' },
]

const STATUS: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  ok: { icon: CheckCircle2, color: 'text-[#3f6212]', bg: 'bg-[#ecfccb]', label: 'OK' },
  warn: { icon: AlertCircle, color: 'text-[#a16207]', bg: 'bg-[#fef3c7]', label: 'Reauth' },
  syncing: { icon: RefreshCw, color: 'text-[#1d4ed8]', bg: 'bg-[#dbeafe]', label: 'Sync' },
}

export function AdAccountsAnim() {
  return (
    <MockFrame
      label="ad accounts"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          4 connected
        </span>
      }
    >
      <ul className="space-y-2">
        {ACCOUNTS.map((a, i) => {
          const s = STATUS[a.status]
          const Icon = s.icon
          return (
            <li
              key={a.name}
              className="flex items-center gap-3 rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]"
              style={{ animation: `mockFadeIn 0.4s ease-out ${i * 0.12}s both` }}
            >
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <Icon className={`h-3.5 w-3.5 ${a.status === 'syncing' ? 'animate-spin' : ''}`} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{a.name}</p>
                <p className="font-mono text-[10px] text-text-tertiary">{a.id}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-text-tertiary">{a.updated}</span>
              </div>
            </li>
          )
        })}
      </ul>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
