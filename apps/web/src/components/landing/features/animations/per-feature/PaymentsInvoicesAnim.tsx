'use client'

import { Download, CreditCard } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const INVOICES = [
  { id: 'INV-2026-0517', date: 'May 14', amount: '$99.00', status: 'Paid', method: 'Click' },
  { id: 'INV-2026-0416', date: 'Apr 14', amount: '$99.00', status: 'Paid', method: 'Payme' },
  { id: 'INV-2026-0316', date: 'Mar 14', amount: '$99.00', status: 'Paid', method: 'Card' },
]

export function PaymentsInvoicesAnim() {
  return (
    <MockFrame
      label="billing"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          Auto-renew on
        </span>
      }
    >
      <div
        className="overflow-hidden rounded-xl bg-gradient-to-br from-[#1b2e06] to-[#243a12] p-4 text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)]"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.1s both' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#a3e635]/85">Default method</p>
            <p className="mt-2 font-mono text-base tabular-nums tracking-wider">•••• 4242</p>
            <p className="mt-0.5 text-[10px] text-white/60">expires 09/28</p>
          </div>
          <CreditCard className="h-5 w-5 text-[#a3e635]/85" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-inset ring-[#eef3e3]">
        <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.6fr_auto] gap-2 border-b border-[#eef3e3] bg-[#fafdf5] px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
          <span>Invoice</span>
          <span>Date</span>
          <span className="text-right">Amount</span>
          <span>Method</span>
          <span></span>
        </div>
        {INVOICES.map((inv, i) => (
          <div
            key={inv.id}
            className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.6fr_auto] items-center gap-2 border-b border-[#eef3e3] px-3 py-2 last:border-0"
            style={{ animation: `mockFadeIn 0.4s ease-out ${0.2 + i * 0.12}s both` }}
          >
            <span className="truncate font-mono text-[10px] text-text-primary">{inv.id}</span>
            <span className="text-[10px] text-text-secondary">{inv.date}</span>
            <span className="text-right text-[11px] font-semibold tabular-nums text-text-primary">{inv.amount}</span>
            <span className="text-[10px] text-text-secondary">{inv.method}</span>
            <Download className="h-3 w-3 text-text-tertiary" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div
        className="mt-3 grid grid-cols-3 gap-2"
        style={{ animation: 'mockFadeIn 0.5s ease-out 0.7s both' }}
      >
        {[
          { k: 'Click', v: 'UZS' },
          { k: 'Payme', v: 'UZS' },
          { k: 'Card', v: 'USD' },
        ].map((m) => (
          <div key={m.k} className="rounded-lg bg-[#fafdf5] px-2.5 py-1.5 text-center ring-1 ring-inset ring-[#eef3e3]">
            <p className="text-[10px] font-semibold text-text-primary">{m.k}</p>
            <p className="text-[9px] text-text-tertiary">{m.v}</p>
          </div>
        ))}
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
