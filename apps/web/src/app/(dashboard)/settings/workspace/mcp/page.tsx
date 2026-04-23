'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog } from '@/components/ui'
import { env } from '@/lib/env'
import { mcpCredentials } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { KeyRound, Link2, Lock, Copy, Check, Zap } from 'lucide-react'

const DOCS_URL = 'https://adspectr.com/docs'

const MCP_TOOLS = [
  { name: 'get_workspace_info', desc: "Workspace va ulangan platformalar haqida ma'lumot" },
  { name: 'list_campaigns', desc: "Barcha reklama kampaniyalar ro'yxati" },
  { name: 'list_ai_decisions', desc: 'AI qarorlar (pending/approved/rejected)' },
  { name: 'approve_decision', desc: 'AI qarorini tasdiqlash va bajarish' },
  { name: 'reject_decision', desc: 'AI qarorini rad etish' },
  { name: 'generate_strategy', desc: 'AI reklama strategiyasini generatsiya qilish' },
  { name: 'run_optimization', desc: 'Kampaniyalar optimizatsiya loopini ishga tushirish' },
  { name: 'analyze_competitor', desc: '72-parametrli raqobatchi tahlili' },
  { name: 'generate_creative', desc: 'Platform uchun reklama matni va skript yaratish' },
]

type Credential = {
  id: string
  clientId: string
  secretMasked: string
  createdAt: string
  revokedAt?: string | null
}

type ServerStatus = 'checking' | 'ok' | 'error'

export default function WorkspaceMcpPage() {
  const { t } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [newClientId, setNewClientId] = useState('')
  const [newClientSecret, setNewClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<'id' | 'secret' | 'config' | null>(null)
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking')
  const [toolCount, setToolCount] = useState(0)

  const checkServerHealth = useCallback(async () => {
    setServerStatus('checking')
    try {
      const res = await mcpCredentials.health()
      const data = res.data as any
      if (data?.status === 'ok') {
        setServerStatus('ok')
        setToolCount(data.tools ?? 0)
      } else {
        setServerStatus('error')
      }
    } catch {
      setServerStatus('error')
    }
  }, [])

  const loadCredentials = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await mcpCredentials.list(currentWorkspace.id)
      setCredentials((res.data as Credential[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'MCP credentials olinmadi')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    void loadCredentials()
    void checkServerHealth()
  }, [loadCredentials, checkServerHealth])

  async function createCredential() {
    if (!currentWorkspace?.id) return
    setCreating(true)
    setError('')
    try {
      const res = await mcpCredentials.create(currentWorkspace.id)
      setNewClientId((res.data as any)?.clientId ?? '')
      setNewClientSecret((res.data as any)?.clientSecret ?? '')
      setShowSecretModal(true)
      await loadCredentials()
    } catch (e: any) {
      setError(e?.message ?? 'Credential yaratilmagan')
    } finally {
      setCreating(false)
    }
  }

  async function revokeCredential(id: string) {
    if (!currentWorkspace?.id) return
    await mcpCredentials.revoke(id, currentWorkspace.id)
    await loadCredentials()
  }

  async function copyField(value: string, field: 'id' | 'secret' | 'config') {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  const mcpServerUrl = `${env.apiBaseUrl?.replace(/\/$/, '') ?? ''}/mcp`

  const claudeConfig =
    newClientId && newClientSecret
      ? JSON.stringify(
          {
            mcpServers: {
              adspectr: {
                url: mcpServerUrl,
                headers: {
                  'X-MCP-Client-Id': newClientId,
                  'X-MCP-Client-Secret': newClientSecret,
                },
              },
            },
          },
          null,
          2,
        )
      : ''

  const hasCredentials = credentials.length > 0

  const statusDot =
    serverStatus === 'ok'
      ? 'bg-emerald-500'
      : serverStatus === 'error'
        ? 'bg-red-500'
        : 'bg-amber-400 animate-pulse'

  const statusLabel =
    serverStatus === 'ok'
      ? `Ishlayapti · ${toolCount} ta tool`
      : serverStatus === 'error'
        ? 'Server javob bermayapti'
        : 'Tekshirilmoqda…'

  return (
    <div className="space-y-6">
      {/* Credentials card */}
      <Card className="rounded-2xl border border-border/70 bg-white/95 p-6 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-8">
        {loading ? (
          <p className="py-10 text-center text-sm text-text-tertiary">…</p>
        ) : !hasCredentials ? (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-text-primary">
              {t('workspaceSettings.mcp.noCredentials', 'Credentials yoʼq')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
              {t(
                'workspaceSettings.mcp.noCredentialsBody',
                "Client ID va Client Secret yarating — AI agentlarni workspace'ga ulash uchun.",
              )}
            </p>
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-800 dark:text-amber-200">
              {t(
                'workspaceSettings.mcp.securityNote',
                "Secret faqat bir marta ko'rsatiladi. Darhol nusxa oling.",
              )}
            </p>
            <Button
              className="mt-6"
              size="sm"
              type="button"
              loading={creating}
              onClick={() => void createCredential()}
              disabled={!currentWorkspace?.id}
            >
              + {t('workspaceSettings.mcp.createCredentials', 'Client ID / Client Secret yaratish')}
            </Button>
            {error && (
              <Alert className="mt-4 text-left" variant="error">
                {error}
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {t('workspaceSettings.mcp.title', 'MCP integratsiya')}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-text-tertiary">
                  {t(
                    'workspaceSettings.mcp.securityNote',
                    "Secret faqat bir marta ko'rsatiladi. Darhol nusxa oling.",
                  )}
                </p>
              </div>
              <Button
                size="sm"
                type="button"
                loading={creating}
                onClick={() => void createCredential()}
                disabled={!currentWorkspace?.id}
              >
                + {t('workspaceSettings.mcp.createCredentials', 'Yangi credentials')}
              </Button>
            </div>
            {error && <Alert variant="error">{error}</Alert>}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary">
                {t('workspaceSettings.mcp.existingCredentials', 'Mavjud credentials')}
              </h3>
              {credentials.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 dark:bg-slate-950/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-text-primary">
                      {item.clientId}
                    </p>
                    <p className="text-label text-text-tertiary">
                      {item.secretMasked} &middot; {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => void revokeCredential(item.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Server status + URL */}
      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {t('workspaceSettings.mcp.serverAndDocs', 'Server va hujjatlar')}
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <span className={`inline-block h-2 w-2 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          AI agentlarni ulash uchun MCP server URL va hujjatlardan foydalaning.
        </p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2/40 p-3 dark:bg-slate-950/40">
            <p className="flex items-center gap-2 text-label text-text-tertiary">
              <Link2 className="h-3.5 w-3.5" />
              MCP Server URL
            </p>
            <p className="mt-2 break-all font-mono text-text-secondary">{mcpServerUrl}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/40 p-3 dark:bg-slate-950/40">
            <p className="flex items-center gap-2 text-label text-text-tertiary">
              <KeyRound className="h-3.5 w-3.5" />
              Hujjatlar
            </p>
            <a
              href={DOCS_URL}
              className="mt-2 inline-block font-medium text-violet-600 underline dark:text-violet-400"
              target="_blank"
              rel="noreferrer"
            >
              {DOCS_URL}
            </a>
          </div>
        </div>
      </Card>

      {/* Tool catalog */}
      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-violet-500" />
          <h3 className="text-lg font-semibold text-text-primary">
            Mavjud MCP tool&apos;lar ({MCP_TOOLS.length} ta)
          </h3>
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          AI agent ulangandan so&apos;ng quyidagi amallarni bajarishi mumkin:
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {MCP_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="rounded-lg border border-border bg-surface-2/30 px-3 py-2 dark:bg-slate-950/30"
            >
              <p className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
                {tool.name}
              </p>
              <p className="mt-0.5 text-xs text-text-tertiary">{tool.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* New credentials modal */}
      <Dialog
        open={showSecretModal}
        onClose={() => setShowSecretModal(false)}
        title={t('workspaceSettings.mcp.credentialsModalTitle', 'Yangi credentials')}
        className="max-w-lg"
      >
        <p className="mt-2 text-sm text-text-tertiary">
          {t(
            'workspaceSettings.mcp.credentialsModalHint',
            "Quyidagi ma'lumotlarni hozir nusxa oling. Client Secret qayta ko'rsatilmaydi.",
          )}
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-label text-text-tertiary">Client ID</label>
            <div className="mt-1 flex gap-2">
              <Input readOnly value={newClientId} className="font-mono text-xs" />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0 px-3"
                onClick={() => void copyField(newClientId, 'id')}
                disabled={!newClientId}
              >
                {copiedField === 'id' ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-label text-text-tertiary">Client Secret</label>
            <div className="mt-1 flex gap-2">
              <Input readOnly value={newClientSecret} className="font-mono text-xs" />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0 px-3"
                onClick={() => void copyField(newClientSecret, 'secret')}
                disabled={!newClientSecret}
              >
                {copiedField === 'secret' ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {claudeConfig && (
            <div>
              <label className="text-label text-text-tertiary">
                Claude Desktop konfiguratsiyasi
              </label>
              <div className="relative mt-1">
                <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-surface-2/40 p-3 font-mono text-xs dark:bg-slate-950/50">
                  {claudeConfig}
                </pre>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute right-2 top-2 px-2 py-1 text-xs"
                  onClick={() => void copyField(claudeConfig, 'config')}
                >
                  {copiedField === 'config' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="mt-1 text-xs text-text-tertiary">
                Bu JSON&apos;ni{' '}
                <code className="rounded bg-surface-2 px-1">claude_desktop_config.json</code>{' '}
                faylingizdagi <code className="rounded bg-surface-2 px-1">mcpServers</code>{' '}
                bo&apos;limiga qo&apos;shing.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => {
              setShowSecretModal(false)
              setNewClientSecret('')
            }}
          >
            Bekor qilish
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => {
              setShowSecretModal(false)
              setNewClientSecret('')
            }}
          >
            {t('workspaceSettings.mcp.savedCredentials', 'Saqladim')}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
