'use client'

import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspace.store'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  "Kampaniyam nima uchun to'xtadi?",
  'CTR qanday oshirsa bo\'ladi?',
  'Bugungi xarajat qancha?',
  'Eng yaxshi reklamam qaysi?',
]

export function ChatWidget() {
  const { currentWorkspace } = useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salom! Men Performa yordamchisiman. Kampaniyalaringiz, metrikalar yoki strategiya haqida savol bering.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading || !currentWorkspace) return

    const history = messages.slice(-6)
    const next: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('performa_access_token') : null
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${apiBase}/ai-agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          message: msg,
          history: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Xatolik yuz berdi.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Tarmoq xatosi. Iltimos qaytadan urinib ko'ring." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#111827] hover:bg-[#1F2937] shadow-lg flex items-center justify-center transition-all"
        aria-label="AI Chat"
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] flex flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#111827] border-b border-[#1F2937]">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">N</div>
            <div>
              <div className="text-white font-semibold text-sm">Performa</div>
              <div className="text-gray-400 text-xs">Kampaniya yordamchisi</div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#F9FAFB]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#111827] text-white rounded-br-sm'
                      : 'bg-white text-[#374151] rounded-bl-sm border border-[#E5E7EB]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 pt-2 flex flex-wrap gap-2 bg-white border-t border-[#E5E7EB]">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-[#E5E7EB] bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Savol bering..."
                className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827]/10"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#111827] disabled:opacity-40 flex items-center justify-center hover:bg-[#1F2937] transition-colors"
              >
                <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
