'use client'

import { Mail, MessageCircle, FileText } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

export function ReportingAnim() {
  return (
    <MockFrame
      label="report builder"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          Weekly · Mon 9:00
        </span>
      }
    >
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div
          className="relative overflow-hidden rounded-xl bg-white p-3.5 ring-1 ring-inset ring-[#eef3e3] shadow-[0_8px_24px_-16px_rgba(27,46,6,0.18)]"
          style={{ animation: 'mockFadeIn 0.5s ease-out 0.1s both' }}
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#1b2e06] text-[10px] font-bold text-[#d9f99d]">
              A
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
              Week 18 · Acme
            </p>
          </div>
          <h4 className="mt-3 text-base font-semibold tracking-tight text-text-primary">Performance summary</h4>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[
              { k: 'ROAS', v: '3.4×', d: '+0.6×' },
              { k: 'Spend', v: '$12K', d: '+8%' },
              { k: 'CTR', v: '4.2%', d: '+0.4%' },
            ].map((m) => (
              <div key={m.k} className="rounded-md bg-[#fafdf5] px-2 py-1.5 ring-1 ring-inset ring-[#eef3e3]">
                <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">{m.k}</p>
                <p className="text-xs font-semibold tabular-nums text-text-primary">{m.v}</p>
                <p className="text-[9px] tabular-nums text-[#3f6212]">{m.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { w: 'w-full', op: 'opacity-100' },
              { w: 'w-5/6', op: 'opacity-80' },
              { w: 'w-3/4', op: 'opacity-60' },
              { w: 'w-2/3', op: 'opacity-40' },
            ].map((l, i) => (
              <div key={i} className={`h-1.5 rounded-full bg-[#cfe8c0] ${l.w} ${l.op}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { icon: FileText, label: 'PDF' },
            { icon: Mail, label: 'Email' },
            { icon: MessageCircle, label: 'TG' },
          ].map((d, i) => (
            <div
              key={d.label}
              className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-[#fafdf5] text-[#3f6212] ring-1 ring-inset ring-[#eef3e3]"
              style={{ animation: `mockFadeIn 0.4s ease-out ${0.3 + i * 0.1}s both` }}
            >
              <d.icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-3 flex items-center justify-between rounded-xl bg-[#1b2e06] px-3.5 py-2.5 text-xs text-white"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.7s both' }}
      >
        <span>Sending to 4 recipients · custom branding</span>
        <span className="rounded-full bg-[#a3e635]/15 px-2 py-0.5 text-[10px] font-semibold text-[#d9f99d]">Scheduled</span>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
