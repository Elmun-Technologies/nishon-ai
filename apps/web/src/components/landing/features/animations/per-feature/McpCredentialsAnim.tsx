'use client'

import { Key, Eye, EyeOff, Shield } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const KEYS = [
  { name: 'campaigns-agent', scopes: ['read', 'launch'], created: 'May 10', last: '2 min ago', hidden: true },
  { name: 'analytics-bot', scopes: ['read'], created: 'Apr 22', last: '1h ago', hidden: true },
  { name: 'creative-grader', scopes: ['read', 'score'], created: 'Apr 03', last: '12h ago', hidden: false },
]

const SCOPE_COLOR: Record<string, string> = {
  read: 'bg-[#e0f2fe] text-[#1d4ed8]',
  launch: 'bg-[#ecfccb] text-[#3f6212]',
  score: 'bg-[#fef3c7] text-[#a16207]',
}

export function McpCredentialsAnim() {
  return (
    <MockFrame
      label="MCP keys"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          <Shield className="h-2.5 w-2.5" aria-hidden="true" />
          Rotated
        </span>
      }
      glow="sky"
    >
      <ul className="space-y-2">
        {KEYS.map((k, i) => (
          <li
            key={k.name}
            className="rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]"
            style={{ animation: `mockFadeIn 0.4s ease-out ${i * 0.12}s both` }}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1b2e06] text-[#d9f99d]">
                <Key className="h-3 w-3" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{k.name}</p>
                <p className="font-mono text-[10px] text-text-tertiary">
                  {k.hidden ? '••••••••••••••••' : 'mcp_sk_4f9a2b8...'}
                </p>
              </div>
              {k.hidden ? (
                <EyeOff className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {k.scopes.map((s) => (
                <span key={s} className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${SCOPE_COLOR[s]}`}>
                  {s}
                </span>
              ))}
              <span className="ml-auto text-[10px] text-text-tertiary">used {k.last}</span>
            </div>
          </li>
        ))}
      </ul>

      <div
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#cfe8c0] px-3.5 py-2 text-[11px] text-text-tertiary"
        style={{ animation: 'mockFadeIn 0.4s ease-out 0.5s both' }}
      >
        <span>+ Generate key · pick scopes</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#3f6212]">audit · ✓</span>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
