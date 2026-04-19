'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'

const TERMS = [
  {
    id: 'custom-audience',
    title: 'Customer List Custom Audiences Terms',
    description:
      'Required when uploading customer lists or using custom audiences derived from your data for targeting.',
    href: 'https://www.facebook.com/legal/terms/customaudience',
  },
  {
    id: 'business-tools',
    title: 'Meta Business Tools Terms',
    description:
      'Covers use of Meta Business Suite, Ads Manager, and related tools when managing assets on behalf of a business.',
    href: 'https://www.facebook.com/legal/MetaBusinessTools',
  },
] as const

type MetaTermsReviewModalProps = {
  open: boolean
  onClose: () => void
}

export function MetaTermsReviewModal({ open, onClose }: MetaTermsReviewModalProps) {
  const [ack, setAck] = useState<Record<string, boolean>>({})

  const allAck = TERMS.every((t) => ack[t.id])

  const resetAndClose = () => {
    setAck({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={resetAndClose} className="max-w-lg p-0 overflow-hidden">
      <>
      <div className="p-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary pr-2">
              Review &amp; Accept Meta Terms of Service
            </h2>
            <p className="text-sm text-text-tertiary mt-2 leading-relaxed">
              To let AdSpectr pause or activate campaigns, adjust budgets, and manage audiences on your behalf, Meta
              requires you to accept these terms in your Business account.
            </p>
            <div className="flex justify-center gap-1.5 mt-4" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === 2 ? 'bg-violet-500 w-2' : 'bg-border'}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4 max-h-[min(60vh,420px)] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="text-text-secondary">
            Review the required Meta terms. You&apos;ll be redirected to Facebook to accept them.
          </p>
          <span className="shrink-0 text-amber-600 dark:text-amber-400 font-medium">Pending approvals</span>
        </div>

        <ul className="space-y-3">
          {TERMS.map((term) => (
            <li
              key={term.id}
              className="rounded-xl border border-border bg-surface-2/60 p-4 space-y-3 dark:bg-slate-900/40"
            >
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <p className="text-sm font-semibold text-text-primary">{term.title}</p>
                <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/25 dark:text-amber-300">
                  Not accepted
                </span>
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed">{term.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={term.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors"
                >
                  Open on Facebook
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
                <label className="inline-flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!ack[term.id]}
                    onChange={(e) => setAck((prev) => ({ ...prev, [term.id]: e.target.checked }))}
                    className="rounded border-border text-violet-600 focus:ring-violet-500/30"
                  />
                  I&apos;ve accepted this on Meta
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 py-4 border-t border-border bg-surface-2/40 flex justify-end gap-2 dark:bg-slate-900/50">
        <button
          type="button"
          onClick={resetAndClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-2 border border-transparent"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!allAck}
          onClick={resetAndClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
        >
          Continue
        </button>
      </div>
      </>
    </Dialog>
  )
}
