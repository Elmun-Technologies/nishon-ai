'use client'

import { Building2, CreditCard, Shield, Users } from 'lucide-react'
import type { ReactNode } from 'react'

interface NodeDef {
  icon: ReactNode
  title: string
  subtitle: string
  badge?: string
}

export interface WorkspaceOrgDemoProps {
  rootTitle?: string
  rootSubtitle?: string
  nodes?: NodeDef[]
}

const DEFAULT_NODES: NodeDef[] = [
  { icon: <Users className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Team', subtitle: '4 members · 2 roles', badge: 'Owner' },
  { icon: <Shield className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Ad accounts', subtitle: 'Meta · Google · TikTok', badge: 'OK' },
  { icon: <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />, title: 'Billing', subtitle: 'Growth · monthly', badge: 'Active' },
]

export function WorkspaceOrgDemo({
  rootTitle = 'Acme Marketing',
  rootSubtitle = 'workspace · UZ',
  nodes = DEFAULT_NODES,
}: WorkspaceOrgDemoProps) {
  return (
    <div
      role="img"
      aria-label="Workspace structure demonstration"
      className="relative isolate overflow-hidden rounded-3xl bg-white ring-1 ring-[#e6efd9] shadow-[0_30px_60px_-30px_rgba(27,46,6,0.32),0_8px_24px_-16px_rgba(27,46,6,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,#f4f9ea_0%,transparent_55%)]" />

      <div className="flex items-center justify-between border-b border-[#eef3e3] px-5 py-3">
        <p className="text-[11px] font-medium text-text-tertiary">workspace</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          Synced
        </span>
      </div>

      <div className="space-y-4 p-6">
        <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl bg-[#1b2e06] px-4 py-3 text-white shadow-[0_8px_24px_-12px_rgba(27,46,6,0.45)] [animation:wsFadeIn_0.5s_ease-out_both]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#243a12] text-[#d9f99d] ring-1 ring-inset ring-[#365314]/60">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium tracking-tight">{rootTitle}</p>
            <p className="text-[11px] text-white/65">{rootSubtitle}</p>
          </div>
        </div>

        <svg viewBox="0 0 300 40" className="block h-10 w-full" role="presentation" aria-hidden="true">
          <defs>
            <linearGradient id="ws-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#65a30d" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#65a30d" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M 150 0 L 150 16 L 50 16 L 50 40 M 150 16 L 150 40 M 150 16 L 250 16 L 250 40"
            fill="none"
            stroke="url(#ws-line)"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: 'wsLineDraw 0.9s ease-out 0.3s both' }}
          />
        </svg>

        <div className="grid grid-cols-3 gap-3">
          {nodes.map((node, i) => (
            <div
              key={node.title}
              className="flex flex-col rounded-2xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3] [animation:wsFadeIn_0.5s_ease-out_both]"
              style={{ animationDelay: `${0.7 + i * 0.15}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#3f6212] ring-1 ring-inset ring-[#dfeacb]">
                  {node.icon}
                </span>
                {node.badge ? (
                  <span className="rounded-full bg-[#ecfccb] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#3f6212]">
                    {node.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-medium tracking-tight text-text-primary">{node.title}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-text-tertiary">{node.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes wsFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wsLineDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="wsFadeIn"], [style*="wsLineDraw"] { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  )
}
