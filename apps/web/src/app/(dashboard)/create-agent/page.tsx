'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  Command as CommandIcon,
  Crosshair,
  Download,
  Gauge,
  Plus,
  SendHorizontal,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { aiAgent, workspaces as workspacesApi } from '@/lib/api-client'
import { Alert, Button, Card, Dialog } from '@/components/ui'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'
import { CommandPalette, type Command } from './_components/CommandPalette'
import { MarkdownMessage } from './_components/MarkdownMessage'
import { ThinkingDots } from './_components/ThinkingDots'
import { VoiceInputButton } from './_components/VoiceInputButton'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}
type AgentHireRole = 'targetologist' | 'optimizer'

type WizardPhase = 'idle' | 'questioning' | 'awaiting_confirm' | 'done'

type WizardState = {
  phase: WizardPhase
  step: number
  answers: string[]
}

const WIZARD_STEP_COUNT = 5
/** How many of the most recent messages we forward to the chat endpoint. */
const HISTORY_TRIM = 20
/** Max retries on 5xx; 4xx errors are not retried. */
const MAX_RETRIES = 2

function messagesKey(workspaceId: string) {
  return `adspectr-ai-assistant-${workspaceId}`
}

function roleKey(workspaceId: string) {
  return `adspectr-ai-assistant-role-${workspaceId}`
}

function wizardKey(workspaceId: string) {
  return `adspectr-ai-assistant-wizard-${workspaceId}`
}

function loadMessages(workspaceId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(messagesKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessage =>
        m &&
        typeof m === 'object' &&
        typeof (m as ChatMessage).id === 'string' &&
        ((m as ChatMessage).role === 'user' ||
          (m as ChatMessage).role === 'assistant' ||
          (m as ChatMessage).role === 'system') &&
        typeof (m as ChatMessage).content === 'string',
    )
  } catch {
    return []
  }
}

function loadRole(workspaceId: string): AgentHireRole {
  if (typeof window === 'undefined') return 'targetologist'
  try {
    const r = localStorage.getItem(roleKey(workspaceId))
    if (r === 'optimizer') return 'optimizer'
  } catch {
    /* ignore */
  }
  return 'targetologist'
}

function saveRole(workspaceId: string, role: AgentHireRole) {
  try {
    localStorage.setItem(roleKey(workspaceId), role)
  } catch {
    /* ignore */
  }
}

function loadWizard(workspaceId: string): WizardState {
  if (typeof window === 'undefined') {
    return { phase: 'idle', step: 0, answers: [] }
  }
  try {
    const raw = localStorage.getItem(wizardKey(workspaceId))
    if (!raw) return { phase: 'idle', step: 0, answers: [] }
    const o = JSON.parse(raw) as Partial<WizardState>
    const phase =
      o.phase === 'questioning' ||
      o.phase === 'awaiting_confirm' ||
      o.phase === 'done'
        ? o.phase
        : 'idle'
    const step = typeof o.step === 'number' && o.step >= 0 ? o.step : 0
    const answers = Array.isArray(o.answers)
      ? o.answers.filter((a) => typeof a === 'string')
      : []
    return { phase, step, answers }
  } catch {
    return { phase: 'idle', step: 0, answers: [] }
  }
}

function saveWizard(workspaceId: string, w: WizardState) {
  try {
    localStorage.setItem(wizardKey(workspaceId), JSON.stringify(w))
  } catch {
    /* ignore */
  }
}

function newId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function isQuotaError(err: unknown): boolean {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message ?? '')
      : ''
  return /quota|exceed|limit/i.test(msg)
}

function extractStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null
  const e = err as { status?: number; response?: { status?: number } }
  if (typeof e.status === 'number') return e.status
  if (e.response && typeof e.response.status === 'number') return e.response.status
  return null
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export default function AiAssistantPage() {
  const { t } = useI18n()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id ?? undefined

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentRole, setAgentRole] = useState<AgentHireRole>('targetologist')
  const [wizard, setWizard] = useState<WizardState>({
    phase: 'idle',
    step: 0,
    answers: [],
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  /** Interim voice transcript that hasn't been finalized yet — shown as a
   * ghost suffix in the textarea so users can see what the recognizer is
   * picking up before committing. */
  const [voiceDraft, setVoiceDraft] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /** Prevents the persona-changed system message from being injected on the
   * very first render after hydration. */
  const initialRoleRef = useRef<AgentHireRole | null>(null)

  useEffect(() => {
    if (!workspaceId) {
      setMessages([])
      setWizard({ phase: 'idle', step: 0, answers: [] })
      initialRoleRef.current = null
      return
    }
    const loadedMessages = loadMessages(workspaceId)
    const loadedWizard = loadWizard(workspaceId)
    if (loadedWizard.phase === 'questioning' && loadedMessages.length === 0) {
      saveWizard(workspaceId, { phase: 'idle', step: 0, answers: [] })
      setWizard({ phase: 'idle', step: 0, answers: [] })
    } else {
      setWizard(loadedWizard)
    }
    setMessages(loadedMessages)
    const loadedRole = loadRole(workspaceId)
    setAgentRole(loadedRole)
    initialRoleRef.current = loadedRole
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId || messages.length === 0) return
    try {
      localStorage.setItem(messagesKey(workspaceId), JSON.stringify(messages))
    } catch (e) {
      // Most likely QuotaExceededError — surface it so the user knows.
      setError(
        t(
          'aiAssistantPage.storageFull',
          'Local storage is full. Old messages may not be saved. Consider clearing the chat.',
        ),
      )
    }
  }, [workspaceId, messages, t])

  useEffect(() => {
    if (!workspaceId) return
    saveRole(workspaceId, agentRole)
  }, [workspaceId, agentRole])

  useEffect(() => {
    if (!workspaceId) return
    saveWizard(workspaceId, wizard)
  }, [workspaceId, wizard])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading, wizard.phase])

  // Cmd/Ctrl+K opens the palette anywhere on the page. We deliberately skip
  // this binding while a textarea/input is focused only for Cmd+L (clear).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const exportChat = useCallback(() => {
    if (messages.length === 0) return
    const header = [
      `# AI Assistant — ${currentWorkspace?.name ?? 'Workspace'}`,
      `_Exported ${new Date().toLocaleString()}_`,
      '',
      '---',
      '',
    ].join('\n')
    const body = messages
      .map((m) => {
        if (m.role === 'system') return `> ${m.content}\n`
        const author = m.role === 'user' ? '**You**' : `**AdSpectr · ${agentRole}**`
        return `${author}\n\n${m.content}\n`
      })
      .join('\n---\n\n')
    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adspectr-chat-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [messages, currentWorkspace?.name, agentRole])

  const questionKeys = useMemo(() => {
    const base =
      agentRole === 'optimizer'
        ? 'aiAssistantPage.wizard.optimizer'
        : 'aiAssistantPage.wizard.targetologist'
    return Array.from({ length: WIZARD_STEP_COUNT }, (_, i) => `${base}.q${i + 1}`)
  }, [agentRole])

  const summaryLabelKeys = useMemo(() => {
    const base =
      agentRole === 'optimizer'
        ? 'aiAssistantPage.wizard.summaryLabelsOpt'
        : 'aiAssistantPage.wizard.summaryLabelsTgt'
    return Array.from({ length: WIZARD_STEP_COUNT }, (_, i) => `${base}.l${i + 1}`)
  }, [agentRole])

  const starterPrompts = useMemo(
    () => [
      {
        icon: '📅',
        text: t(
          'aiAssistantPage.starter1',
          "Jamoa sifatida Meta haftalik natijalarini qanday ko'rib chiqishimiz kerak?",
        ),
      },
      {
        icon: '🚀',
        text: t(
          'aiAssistantPage.starter2',
          'Oddiy jarayon taklif qiling: yangi mahsulot → birinchi reklamalar → masshtab.',
        ),
      },
      {
        icon: '📈',
        text: t(
          'aiAssistantPage.starter3',
          'Byudjetni oshirishdan oldin qaysi metrikalarga qarab chiqish kerak?',
        ),
      },
    ],
    [t],
  )

  const appendAssistant = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: newId('a'), role: 'assistant', content }])
  }, [])

  const appendSystem = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: newId('s'), role: 'system', content }])
  }, [])

  // When the user switches persona mid-conversation, drop a small system note
  // so the chat history reflects what changed.
  const handleSelectRole = useCallback(
    (next: AgentHireRole) => {
      if (next === agentRole) return
      setAgentRole(next)
      if (messages.length > 0 && initialRoleRef.current !== null) {
        const label =
          next === 'optimizer'
            ? t('aiAssistantPage.agentRoleOptTitle', 'Optimizator')
            : t('aiAssistantPage.agentRoleTargetTitle', 'Targetolog')
        appendSystem(
          t('aiAssistantPage.personaSwitched', "Siz {role} rejimiga o'tdingiz. Keyingi javoblar shu rolga moslashadi.").replace(
            '{role}',
            label,
          ),
        )
      }
    },
    [agentRole, messages.length, t, appendSystem],
  )

  const buildSummary = useCallback(
    (answers: string[]) => {
      const head = t(
        'aiAssistantPage.wizard.summaryTitle',
        'Here is your agent brief',
      )
      const lines = answers.map((a, i) => {
        const label = t(summaryLabelKeys[i], `Answer ${i + 1}`)
        return `• **${label}**: ${a}`
      })
      const foot = t(
        'aiAssistantPage.wizard.confirmAsk',
        'If this looks right, confirm below to enable assisted mode (AI suggests changes; you approve before major actions).',
      )
      return [head, '', ...lines, '', foot].join('\n')
    },
    [t, summaryLabelKeys],
  )

  const startAgentWizard = useCallback(() => {
    if (!workspaceId) return
    setError(null)
    const intro =
      agentRole === 'optimizer'
        ? t('aiAssistantPage.wizard.optimizer.intro', '')
        : t('aiAssistantPage.wizard.targetologist.intro', '')
    const q1 = t(questionKeys[0], '')
    const first = [intro, intro && q1 ? '\n\n' : '', q1].filter(Boolean).join('')
    setWizard({ phase: 'questioning', step: 0, answers: [] })
    appendAssistant(first || q1)
  }, [workspaceId, agentRole, questionKeys, t, appendAssistant])

  const sendFreeChat = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !workspaceId || loading) return

      setError(null)
      const userId = newId('u')
      const assistantId = newId('a')
      const trimmedHistory = messages
        .filter((m) => m.role !== 'system')
        .slice(-HISTORY_TRIM)
        .map(({ role, content }) => ({ role: role as 'user' | 'assistant', content }))

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', content: trimmed },
      ])
      setLoading(true)

      try {
        let accumulated = ''
        let placeholderInserted = false
        for await (const delta of aiAgent.chatStream({
          workspaceId,
          message: trimmed,
          history: trimmedHistory,
          assistantPersona: agentRole,
        })) {
          accumulated += delta
          if (!placeholderInserted) {
            // Insert the assistant message on the first chunk so the
            // thinking-dots indicator can disappear at the same time.
            placeholderInserted = true
            setLoading(false)
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: 'assistant', content: accumulated },
            ])
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: accumulated } : m,
              ),
            )
          }
        }
        if (!placeholderInserted) {
          // Empty stream — surface a friendly message rather than a blank.
          appendAssistant(
            t('aiAssistantPage.emptyReply', 'No reply received. Try again.'),
          )
        }
        setInput('')
      } catch (e: unknown) {
        let msg: string
        if (isQuotaError(e)) {
          msg = t(
            'aiAssistantPage.quotaError',
            'Bu workspace uchun AI kvotasi tugagan. Iltimos, plan yangilang yoki keyinroq qayta urinib ko\'ring.',
          )
        } else if (
          e &&
          typeof e === 'object' &&
          'message' in e &&
          typeof (e as { message: string }).message === 'string'
        ) {
          msg = (e as { message: string }).message
        } else {
          msg = t(
            'aiAssistantPage.sendError',
            "Yordamchiga ulanib bo'lmadi. Internet aloqasini tekshirib qayta urining.",
          )
        }
        setError(msg)
        setMessages((prev) =>
          prev.filter((m) => m.id !== userId && m.id !== assistantId),
        )
        setInput(trimmed)
      } finally {
        setLoading(false)
        textareaRef.current?.focus()
      }
    },
    [workspaceId, loading, messages, t, appendAssistant, agentRole],
  )

  const handleWizardUserReply = useCallback(
    (trimmed: string) => {
      const userId = newId('u')
      setMessages((prev) => [...prev, { id: userId, role: 'user', content: trimmed }])

      const nextAnswers = [...wizard.answers, trimmed]
      const nextStep = wizard.step + 1

      if (nextStep < WIZARD_STEP_COUNT) {
        setWizard({ phase: 'questioning', step: nextStep, answers: nextAnswers })
        const q = t(questionKeys[nextStep], '')
        appendAssistant(q)
      } else {
        setWizard({
          phase: 'awaiting_confirm',
          step: WIZARD_STEP_COUNT,
          answers: nextAnswers,
        })
        appendAssistant(buildSummary(nextAnswers))
      }
      setInput('')
    },
    [wizard, questionKeys, t, appendAssistant, buildSummary],
  )

  const submitText = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !workspaceId || loading || confirmBusy) return

      if (wizard.phase === 'questioning') {
        handleWizardUserReply(trimmed)
        textareaRef.current?.focus()
        return
      }

      if (wizard.phase === 'awaiting_confirm') {
        setInput(trimmed)
        return
      }

      await sendFreeChat(trimmed)
    },
    [workspaceId, loading, confirmBusy, wizard.phase, handleWizardUserReply, sendFreeChat],
  )

  const reallyClearChat = useCallback(() => {
    setMessages([])
    setWizard({ phase: 'idle', step: 0, answers: [] })
    setError(null)
    setClearConfirmOpen(false)
    if (workspaceId) {
      try {
        localStorage.removeItem(messagesKey(workspaceId))
        localStorage.removeItem(wizardKey(workspaceId))
      } catch {
        /* ignore */
      }
    }
  }, [workspaceId])

  const onConfirmLaunch = useCallback(async () => {
    if (!workspaceId || wizard.phase !== 'awaiting_confirm') return
    setConfirmBusy(true)
    setError(null)
    try {
      const res = await workspacesApi.setAutopilot(workspaceId, 'assisted')
      const data = res.data as { autopilotMode?: string } | undefined
      const mode = data?.autopilotMode ?? 'assisted'
      if (currentWorkspace) {
        setCurrentWorkspace({ ...currentWorkspace, autopilotMode: mode })
      }
      appendAssistant(
        t(
          'aiAssistantPage.wizard.successBody',
          'Assisted mode is on. Important changes will ask for your approval first.',
        ),
      )
      setWizard({ phase: 'done', step: WIZARD_STEP_COUNT, answers: wizard.answers })
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === 'object' &&
        'message' in e &&
        typeof (e as { message: string }).message === 'string'
          ? (e as { message: string }).message
          : t(
              'aiAssistantPage.wizard.confirmError',
              'Could not update workspace. Try again from settings.',
            )
      setError(msg)
    } finally {
      setConfirmBusy(false)
    }
  }, [
    workspaceId,
    wizard.phase,
    wizard.answers,
    currentWorkspace,
    setCurrentWorkspace,
    appendAssistant,
    t,
  ])

  const onRejectLaunch = useCallback(() => {
    appendAssistant(
      t(
        'aiAssistantPage.wizard.cancelBody',
        'Understood — nothing was changed. You can adjust answers by clearing the chat or ask me anything in free mode.',
      ),
    )
    setWizard({ phase: 'done', step: WIZARD_STEP_COUNT, answers: wizard.answers })
  }, [appendAssistant, t, wizard.answers])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitText(input)
  }

  const handleVoiceTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setInput((prev) => (prev ? `${prev.trimEnd()} ${text}` : text))
        setVoiceDraft('')
      } else {
        setVoiceDraft(text)
      }
    },
    [],
  )

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'new-chat',
        label: 'Yangi suhbat',
        hint: 'Joriy suhbatni tozalab boshqasini boshlash',
        icon: <Plus className="h-3.5 w-3.5" />,
        disabled: messages.length === 0,
        run: () => setClearConfirmOpen(true),
      },
      {
        id: 'guided-setup',
        label: 'Guided setup (5 savol)',
        hint: 'Targetolog yoki optimizator rolini sozlash',
        icon: <Wand2 className="h-3.5 w-3.5" />,
        disabled: wizard.phase !== 'idle' && wizard.phase !== 'done',
        run: () => startAgentWizard(),
      },
      {
        id: 'persona-target',
        label: 'Rolni almashtirish: Targetolog',
        hint: 'Auditoriya, joylashuv, voronka',
        icon: <Crosshair className="h-3.5 w-3.5" />,
        disabled: agentRole === 'targetologist',
        run: () => handleSelectRole('targetologist'),
      },
      {
        id: 'persona-optimizer',
        label: 'Rolni almashtirish: Optimizator',
        hint: 'Stavkalar, byudjetlar, masshtab',
        icon: <Gauge className="h-3.5 w-3.5" />,
        disabled: agentRole === 'optimizer',
        run: () => handleSelectRole('optimizer'),
      },
      {
        id: 'export-md',
        label: 'Suhbatni Markdown sifatida yuklab olish',
        hint: '.md fayl sifatida saqlanadi',
        icon: <Download className="h-3.5 w-3.5" />,
        disabled: messages.length === 0,
        run: exportChat,
      },
      {
        id: 'clear',
        label: 'Suhbatni tozalash',
        hint: 'Barcha xabarlarni o\'chirish (tasdiq so\'raladi)',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        disabled: messages.length === 0,
        run: () => setClearConfirmOpen(true),
      },
    ],
    [
      messages.length,
      wizard.phase,
      agentRole,
      startAgentWizard,
      handleSelectRole,
      exportChat,
    ],
  )

  const inputLocked = wizard.phase === 'awaiting_confirm' || confirmBusy
  const assistantBadge =
    agentRole === 'optimizer'
      ? t('aiAssistantPage.badgeOptimizer', 'Optimizator')
      : t('aiAssistantPage.badgeTargetologist', 'Targetolog')

  const hero = (
    <section className="rounded-2xl border border-border/80 bg-surface px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-mid to-brand-lime ring-1 ring-brand-ink/10">
            <Sparkles className="h-5 w-5 text-brand-ink" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-text-primary md:text-lg">
              {t('navigation.aiAssistant', 'AI assistant')}
            </h1>
            {currentWorkspace?.name && (
              <p className="truncate text-xs text-text-tertiary">
                {currentWorkspace.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Persona pill switcher — compact, top-of-chat */}
          <div className="flex rounded-full border border-border bg-surface-2 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectRole('targetologist')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors',
                agentRole === 'targetologist'
                  ? 'bg-brand-mid text-brand-ink shadow-sm dark:bg-brand-lime'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <Crosshair className="h-3.5 w-3.5" />
              {t('aiAssistantPage.agentRoleTargetTitle', 'Targetolog')}
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('optimizer')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors',
                agentRole === 'optimizer'
                  ? 'bg-brand-mid text-brand-ink shadow-sm dark:bg-brand-lime'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <Gauge className="h-3.5 w-3.5" />
              {t('aiAssistantPage.agentRoleOptTitle', 'Optimizator')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 text-xs text-text-tertiary transition-colors hover:bg-surface md:flex"
            title="Buyruqlar palitrasi (⌘K)"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <kbd className="font-mono text-[10px]">⌘K</kbd>
          </button>
          {workspaceId && messages.length > 0 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={exportChat}
                className="gap-1.5"
                aria-label="Export chat"
                title="Suhbatni .md fayl sifatida yuklab olish"
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="hidden lg:inline">Export</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setClearConfirmOpen(true)}
                className="gap-1.5"
                aria-label={t('aiAssistantPage.clearChat', 'Clear chat')}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">
                  {t('aiAssistantPage.clearChat', 'Tozalash')}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )

  if (!workspaceId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">
        {hero}
        <Alert variant="warning">
          {t(
            'aiAssistantPage.noWorkspace',
            'Select or create a workspace to use the AI assistant.',
          )}
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col gap-4 pb-6">
      {hero}

      {error && (
        <Alert variant="error">
          <div className="flex items-start justify-between gap-3">
            <span className="flex-1">{error}</span>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-text-secondary underline-offset-2 hover:underline"
              onClick={() => setError(null)}
            >
              {t('aiAssistantPage.dismissError', 'Yopish')}
            </button>
          </div>
        </Alert>
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
            'scroll-smooth',
          )}
        >
          {messages.length === 0 && !loading && (
            <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 py-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-surface/90 shadow-inner dark:bg-surface-2/50">
                <Sparkles className="h-8 w-8 text-brand-mid dark:text-brand-lime" aria-hidden />
              </div>
              <div>
                <p className="text-heading text-text-primary">
                  {t('aiAssistantPage.emptyTitle', 'Suhbatni boshlang')}
                </p>
                <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">
                  {t(
                    'aiAssistantPage.emptyHintShort',
                    "Quyidagilardan birini tanlang yoki o'z savolingizni yozing — yordamchi yuqorida tanlangan rol bo'yicha javob beradi.",
                  )}
                </p>
              </div>

              {/* Starter prompts — primary entry */}
              <div className="flex w-full flex-col gap-2.5">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    disabled={loading || (wizard.phase !== 'idle' && wizard.phase !== 'done')}
                    onClick={() => void submitText(prompt.text)}
                    className={cn(
                      'group flex items-start gap-3 rounded-2xl border border-border/80 bg-surface px-4 py-3.5 text-left text-body-sm text-text-primary shadow-sm transition-all',
                      'hover:-translate-y-0.5 hover:border-brand-mid/50 hover:bg-surface-2/80 hover:shadow-md',
                      'dark:hover:bg-surface-elevated/80',
                      (loading || (wizard.phase !== 'idle' && wizard.phase !== 'done')) &&
                        'pointer-events-none opacity-50',
                    )}
                  >
                    <span className="text-base leading-none">{prompt.icon}</span>
                    <span className="flex-1">{prompt.text}</span>
                    <SendHorizontal
                      className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </button>
                ))}
              </div>

              {/* Guided setup as secondary link */}
              <button
                type="button"
                onClick={startAgentWizard}
                disabled={loading}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all',
                  'hover:border-brand-mid/40 hover:bg-surface-2 hover:text-text-primary',
                  loading && 'pointer-events-none opacity-50',
                )}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {t('aiAssistantPage.guidedSetupLink', 'yoki guided setup (5 savol)')}
              </button>
            </div>
          )}

          {messages.map((m) => {
            if (m.role === 'system') {
              return (
                <div
                  key={m.id}
                  className="mx-auto max-w-md text-center text-[11px] uppercase tracking-wide text-text-tertiary animate-in fade-in duration-200"
                >
                  <span className="rounded-full border border-dashed border-border/80 bg-surface/60 px-3 py-1">
                    {m.content}
                  </span>
                </div>
              )
            }
            return (
              <div
                key={m.id}
                className={cn(
                  'flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200',
                  m.role === 'user' ? 'justify-end' : 'justify-start',
                )}
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
                        {t('aiAssistantPage.assistantLabel', 'AdSpectr')} · {assistantBadge}
                      </span>
                    </div>
                  )}
                  {m.role === 'assistant' ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  )}
                </div>
              </div>
            )
          })}

          {loading && <ThinkingDots persona={assistantBadge} />}
        </div>

        {wizard.phase === 'awaiting_confirm' ? (
          <div className="border-t border-border/80 bg-surface-2/90 px-4 py-4 dark:border-brand-mid/20 dark:bg-surface-elevated/90 md:px-8">
            <p className="text-sm font-semibold text-text-primary">
              {t('aiAssistantPage.wizard.confirmBarTitle', 'Enable assisted mode?')}
            </p>
            <p className="mt-1 text-body-sm text-text-secondary">
              {t(
                'aiAssistantPage.wizard.confirmBarBody',
                'This turns on assisted autopilot for this workspace so AI can propose changes; you approve before major actions.',
              )}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="gap-2 sm:flex-1"
                disabled={confirmBusy}
                onClick={() => void onConfirmLaunch()}
              >
                {confirmBusy ? <Spinner size="sm" className="!border-t-white" /> : null}
                <span>{t('aiAssistantPage.wizard.confirmYes', 'Confirm & enable')}</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="sm:flex-1"
                disabled={confirmBusy}
                onClick={onRejectLaunch}
              >
                {t('aiAssistantPage.wizard.confirmNo', 'Not now')}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Sticky input bar — always visible at the bottom of the chat card */}
        <form
          onSubmit={onSubmit}
          className={cn(
            'sticky bottom-0 z-10 border-t border-border/80 bg-surface px-4 py-4 md:px-8 md:py-5',
            'dark:border-brand-mid/20 dark:bg-surface-elevated/95',
            'backdrop-blur supports-[backdrop-filter]:bg-surface/95',
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <div className="relative flex-1">
              <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                wizard.phase === 'questioning'
                  ? t('aiAssistantPage.wizard.answerPlaceholder', 'Javobingizni yozing…')
                  : wizard.phase === 'awaiting_confirm'
                    ? t(
                        'aiAssistantPage.wizard.waitConfirmPlaceholder',
                        'Yuqoridagi tugmalardan birini bosing.',
                      )
                    : t(
                        'aiAssistantPage.placeholder',
                        'Jarayonni tasvirlang, metrikalar haqida so\'rang yoki kampaniya savolini kiriting…',
                      )
              }
              rows={2}
              disabled={loading || inputLocked}
              readOnly={wizard.phase === 'awaiting_confirm'}
              className={cn(
                'min-h-[3.5rem] w-full resize-none rounded-2xl border-border/90 pr-12 transition-all',
                'focus:border-brand-mid/60 focus:shadow-[0_0_0_3px_rgba(94,234,118,0.12)] focus:ring-0',
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void submitText(input)
                }
              }}
            />
              <div className="absolute right-2 top-2">
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  disabled={loading || inputLocked}
                  lang="uz-UZ"
                />
              </div>
              {voiceDraft && (
                <p className="mt-1 px-2 text-xs italic text-text-tertiary">
                  🎤 {voiceDraft}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim() || inputLocked}
              className={cn(
                'group h-12 shrink-0 gap-2 rounded-2xl px-6 md:h-auto md:min-w-[7.5rem]',
                'transition-all active:scale-95',
              )}
            >
              {loading ? (
                <Spinner size="sm" className="!border-t-white" />
              ) : (
                <SendHorizontal className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
              {t('common.send', 'Yuborish')}
            </Button>
          </div>
          <p className="mt-3 text-caption text-text-tertiary">
            {t(
              'aiAssistantPage.footerHint',
              'Enter — yuborish · Shift+Enter — yangi qator · AI xato qilishi mumkin; muhim qadamlarni tekshiring.',
            )}
          </p>
        </form>
      </Card>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />

      {/* Clear-chat confirmation dialog */}
      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title={t('aiAssistantPage.clearConfirmTitle', 'Suhbatni tozalash?')}
        className="max-w-md"
      >
        <p className="text-body-sm text-text-secondary">
          {t(
            'aiAssistantPage.clearConfirmBody',
            'Barcha xabarlar va guided setup natijalari ushbu workspace uchun o\'chiriladi. Bu amalni qaytarib bo\'lmaydi.',
          )}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setClearConfirmOpen(false)}
          >
            {t('common.cancel', 'Bekor qilish')}
          </Button>
          <Button type="button" size="sm" onClick={reallyClearChat} className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            {t('aiAssistantPage.clearConfirmYes', 'Ha, tozalash')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
