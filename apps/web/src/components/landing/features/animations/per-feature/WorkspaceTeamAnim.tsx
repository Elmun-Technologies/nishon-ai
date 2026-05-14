'use client'

import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const MEMBERS = [
  { initials: 'AB', name: 'Aziza B.', role: 'Owner', tone: 'bg-[#1b2e06] text-[#d9f99d]' },
  { initials: 'JS', name: 'Jamshid S.', role: 'Manager', tone: 'bg-[#243a12] text-[#d9f99d]' },
  { initials: 'NK', name: 'Nilufar K.', role: 'Analyst', tone: 'bg-[#fef3c7] text-[#a16207]' },
  { initials: 'RT', name: 'Rustam T.', role: 'Analyst', tone: 'bg-[#fef3c7] text-[#a16207]' },
  { initials: 'GU', name: 'Guest · Acme', role: 'Read-only', tone: 'bg-[#eef3e3] text-text-tertiary' },
]

const ROLE_COLOR: Record<string, string> = {
  Owner: 'bg-[#ecfccb] text-[#3f6212]',
  Manager: 'bg-[#ecfccb] text-[#3f6212]',
  Analyst: 'bg-[#fef3c7] text-[#a16207]',
  'Read-only': 'bg-[#eef3e3] text-text-tertiary',
}

export function WorkspaceTeamAnim() {
  return (
    <MockFrame
      label="team & roles"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          5 seats · SSO on
        </span>
      }
    >
      <ul className="space-y-2">
        {MEMBERS.map((m, i) => (
          <li
            key={m.name}
            className="flex items-center gap-3 rounded-xl bg-[#fafdf5] p-3 ring-1 ring-inset ring-[#eef3e3]"
            style={{ animation: `mockFadeIn 0.4s ease-out ${i * 0.12}s both` }}
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${m.tone}`}
            >
              {m.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{m.name}</p>
              <p className="text-[10px] text-text-tertiary">last seen 3 min ago</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLOR[m.role]}`}>
              {m.role}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#cfe8c0] px-3.5 py-2 text-[11px] text-text-tertiary"
        style={{ animation: 'mockFadeIn 0.4s ease-out 0.7s both' }}
      >
        <span>+ Invite via magic-link</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#3f6212]">audit · ✓</span>
      </div>

      <style>{SHARED_ANIM_STYLES}</style>
    </MockFrame>
  )
}
