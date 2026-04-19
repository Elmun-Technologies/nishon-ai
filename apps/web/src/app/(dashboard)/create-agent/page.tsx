'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, MessageCircle, SendHorizontal, Sparkles, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { aiAgent } from '@/lib/api-client'
import { Button, Alert, Card } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string }

function storageKey(workspaceId: string) {
  return `adspectr-ai-assistant-${workspaceId}`
}

function loadStored(workspaceId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessage =>
        m &&
        typeof m === 'object' &&
        typeof (m as ChatMessage).id === 'string' &&
        ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
        typeof (m as ChatMessage).content === 'string',
    )
  } catch {
    return []
  }
}

export default function AiAssistantPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!workspaceId) {
      setMessages([])
      return
    }
    setMessages(loadStored(workspaceId))
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId || messages.length === 0) return
    try {
      localStorage.setItem(storageKey(workspaceId), JSON.stringify(messages))
    } catch {
      /* ignore quota */
    }
  }, [workspaceId, messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const starterPrompts = useMemo(
    () => [
      t('aiAssistantPage.starter1', 'How should we review weekly Meta performance as a team?'),
      t('aiAssistantPage.starter2', 'Suggest a simple workflow: new product → first ads → scale.'),
      t('aiAssistantPage.starter3', 'What metrics should I watch before increasing budget?'),
    ],
    [t],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !workspaceId || loading) return

      setError(null)
      const userId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `u-${Date.now()}`
      const historyPayload = messages.map(({ role, content }) => ({ role, content }))

      setMessages((prev) => [...prev, { id: userId, role: 'user', content: trimmed }])
      setLoading(true)

      try {
        const { data } = await aiAgent.chat({
          workspaceId,
          message: trimmed,
          history: historyPayload,
        })
        const reply = typeof data?.reply === 'string' ? data.reply : ''
        const assistantId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `a-${Date.now()}`
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: reply || t('aiAssistantPage.emptyReply', 'No reply received. Try again.'),
          },
        ])
        setInput('')
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e && typeof (e as { message: string }).message === 'string'
            ? (e as { message: string }).message
            : t('aiAssistantPage.sendError', 'Could not reach the assistant. Check your connection and try again.')
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== userId))
        setInput(trimmed)
      } finally {
        setLoading(false)
        textareaRef.current?.focus()
      }
    },
    [workspaceId, loading, messages, t],
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    if (workspaceId) {
      try {
        localStorage.removeItem(storageKey(workspaceId))
      } catch {
        /* ignore */
      }
    }
  }, [workspaceId])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const hero = (
    <section
      className={cn(
        'rounded-3xl border border-border/80 bg-gradient-to-br p-5 shadow-sm md:p-6',
        'from-white via-surface to-surface-2/95',
        'dark:from-[#1e3310] dark:via-brand-ink dark:to-[#152508]',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
              'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
            )}
          >
            <Sparkles className="h-7 w-7 text-brand-ink" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
              {t('navigation.aiAssistant', 'AI Assistant')}
            </h1>
            <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
              {t(
                'aiAssistantPage.subtitle',
                'Brainstorm campaigns, metrics, and workflows with AdSpectr AI. Messages are saved in this browser for this workspace.',
              )}
            </p>
            {currentWorkspace?.name && (
              <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-surface/90 px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm backdrop-blur-sm dark:bg-surface-elevated/60">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-brand-mid dark:text-brand-lime" aria-hidden />
                <span className="truncate">{currentWorkspace.name}</span>
              </p>
            )}
          </div>
        </div>
        {workspaceId && messages.length > 0 ? (
          <Button type="button" variant="secondary" size="sm" onClick={clearChat} className="shrink-0 gap-2 self-start lg:self-center">
            <Trash2 className="h-4 w-4" aria-hidden />
            {t('aiAssistantPage.clearChat', 'Clear chat')}
          </Button>
        ) : null}
      </div>
    </section>
  )

  if (!workspaceId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-6">
        {hero}
        <Alert variant="warning">
          {t('aiAssistantPage.noWorkspace', 'Select or create a workspace to use the AI assistant.')}
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col gap-6 pb-6">
      {hero}

      {error && (
        <div className="flex flex-col gap-2">
          <Alert variant="error">{error}</Alert>
          <button
            type="button"
            className="self-start text-xs font-medium text-text-secondary underline decoration-border underline-offset-2 hover:text-text-primary"
            onClick={() => setError(null)}
          >
            {t('aiAssistantPage.dismissError', 'Dismiss')}
          </button>
        </div>
      )}

      <Card
        padding="none"
        className={cn(
          'flex min-h-[min(72vh,680px)] flex-1 flex-col overflow-hidden',
          'rounded-3xl border-border/80 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            'flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 md:px-8',
            'bg-[linear-gradient(180deg,var(--c-surface-2)_0%,var(--c-surface)_45%,var(--c-surface)_100%)]',
            'dark:bg-[linear-gradient(180deg,#1a2d0d_0%,var(--c-surface)_50%,var(--c-surface)_100%)]',
          )}
        >
          {messages.length === 0 && !loading && (
            <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-4 text-center">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border/80',
                  'bg-surface/90 shadow-inner dark:bg-surface-2/50',
                )}
              >
                <Sparkles className="h-8 w-8 text-brand-mid dark:text-brand-lime" aria-hidden />
              </div>
              <div>
                <p className="text-heading text-text-primary">
                  {t('aiAssistantPage.emptyTitle', 'Start a conversation')}
                </p>
                <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">
                  {t(
                    'aiAssistantPage.emptyHint',
                    'Ask about Meta campaigns, troubleshooting, automation, or how your team should run weekly reviews.',
                  )}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2.5">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(prompt)}
                    className={cn(
                      'rounded-2xl border border-border/80 bg-surface px-4 py-3.5 text-left text-body-sm text-text-primary shadow-sm transition-all',
                      'hover:border-brand-mid/50 hover:bg-surface-2/80 hover:shadow dark:hover:bg-surface-elevated/80',
                      loading && 'pointer-events-none opacity-50',
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[min(100%,40rem)] rounded-2xl px-4 py-3.5 text-body-sm leading-relaxed shadow-sm',
                  m.role === 'user'
                    ? 'bg-brand-ink text-brand-lime dark:bg-[#243a12] dark:text-brand-lime dark:ring-1 dark:ring-brand-mid/25'
                    : cn(
                        'border border-border/80 bg-surface text-text-primary',
                        'dark:border-brand-mid/20 dark:bg-surface-elevated/90',
                        'ring-1 ring-black/[0.02] dark:ring-white/[0.04]',
                      ),
                )}
              >
                {m.role === 'assistant' && (
                  <div className="mb-2 flex items-center gap-2 border-b border-border/50 pb-2 dark:border-brand-mid/15">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mid/15 dark:bg-brand-lime/10">
                      <Bot className="h-4 w-4 text-brand-mid dark:text-brand-lime" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary dark:text-brand-lime/90">
                      {t('aiAssistantPage.assistantLabel', 'AdSpectr')}
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-border/80 bg-surface px-4 py-3 shadow-sm',
                  'dark:border-brand-mid/20 dark:bg-surface-elevated/90',
                )}
              >
                <Spinner size="sm" className="border-t-brand-mid" />
                <span className="text-body-sm text-text-secondary">{t('aiAssistantPage.thinking', 'Thinking…')}</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className={cn(
            'border-t border-border/80 bg-surface px-4 py-4 md:px-8 md:py-5',
            'dark:border-brand-mid/20 dark:bg-surface-elevated/95',
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(
                'aiAssistantPage.placeholder',
                'Describe a process, ask about metrics, or paste a campaign question…',
              )}
              rows={3}
              disabled={loading}
              className={cn(
                'min-h-[5.25rem] flex-1 rounded-2xl border-border/90 md:min-h-[4.75rem]',
                'focus:border-brand-mid/60 focus:ring-2 focus:ring-brand-mid/15',
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage(input)
                }
              }}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-12 shrink-0 gap-2 rounded-2xl px-6 md:h-auto md:min-w-[7.5rem]"
            >
              {loading ? <Spinner size="sm" className="!border-t-white" /> : <SendHorizontal className="h-4 w-4" />}
              {t('common.send', 'Send')}
            </Button>
          </div>
          <p className="mt-3 text-caption text-text-tertiary">
            {t(
              'aiAssistantPage.footerHint',
              'Enter sends · Shift+Enter for a new line · AI can make mistakes; verify critical actions.',
            )}
          </p>
        </form>
      </Card>
    </div>
  )
}
