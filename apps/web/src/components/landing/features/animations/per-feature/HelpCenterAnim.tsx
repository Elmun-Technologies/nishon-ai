'use client'

import { Search, BookOpen, Video, MessageSquare } from 'lucide-react'
import { MockFrame, SHARED_ANIM_STYLES } from '../MockFrame'

const SUGGESTIONS = [
  { icon: BookOpen, kind: 'Article', title: 'Connecting AmoCRM via OAuth', read: '3 min' },
  { icon: Video, kind: 'Video', title: 'Launch your first Meta campaign', read: '1:24' },
  { icon: BookOpen, kind: 'Article', title: 'Reading the AI decision log', read: '4 min' },
  { icon: MessageSquare, kind: 'Expert', title: 'Pixel setup · 5 specialists online', read: 'from $5' },
]

const KIND_COLOR: Record<string, string> = {
  Article: 'bg-[#e0f2fe] text-[#1d4ed8]',
  Video: 'bg-[#fce7f3] text-[#9d174d]',
  Expert: 'bg-[#ecfccb] text-[#3f6212]',
}

export function HelpCenterAnim() {
  return (
    <MockFrame
      label="help center"
      badge={
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-semibold text-[#3f6212]">
          24/7
        </span>
      }
    >
      <div
        className="flex items-center gap-2 rounded-2xl bg-[#fafdf5] px-3.5 py-3 ring-1 ring-inset ring-[#eef3e3]"
        style={{ animation: 'mockFadeIn 0.4s ease-out both' }}
      >
        <Search className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
        <span className="flex-1 text-sm text-text-primary">
          How to connect Meta Pixel
          <span className="ml-0.5 inline-block h-3.5 w-0.5 align-middle bg-[#1b2e06] [animation:helpCaret_0.9s_steps(2)_infinite]" />
        </span>
        <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary ring-1 ring-inset ring-[#eef3e3]">
          ⌘ K
        </span>
      </div>

      <p
        className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary"
        style={{ animation: 'mockFadeIn 0.4s ease-out 0.2s both' }}
      >
        4 suggestions
      </p>

      <ul className="mt-2 space-y-2">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.icon
          return (
            <li
              key={s.title}
              className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-inset ring-[#eef3e3]"
              style={{ animation: `mockFadeIn 0.4s ease-out ${0.3 + i * 0.1}s both` }}
            >
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${KIND_COLOR[s.kind]}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{s.title}</p>
                <p className="text-[10px] text-text-tertiary">{s.kind} · {s.read}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <style>{`
        ${SHARED_ANIM_STYLES}
        @keyframes helpCaret {
          50% { opacity: 0; }
        }
      `}</style>
    </MockFrame>
  )
}
