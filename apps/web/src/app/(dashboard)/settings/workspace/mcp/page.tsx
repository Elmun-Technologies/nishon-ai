'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog, PageHeader } from '@/components/ui'
import { env } from '@/lib/env'
import { mcpCredentials } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'

/** Keyinchalik env orqali; hozircha placeholder */
const DOCS_URL = 'https://performa.ai/docs'

type Credential = {
  id: string
  clientId: string
  secretMasked: string
  createdAt: string
  revokedAt?: string | null
}

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

  async function loadCredentials() {
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
  }

  useEffect(() => {
    void loadCredentials()
  }, [currentWorkspace?.id])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('workspaceSettings.tabs.mcp', 'MCP')}
        subtitle={currentWorkspace?.name ?? t('workspaceSettings.title', 'Workspace settings')}
      />
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            🔐
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-text-primary">{t('workspaceSettings.mcp.title', 'MCP integration')}</h2>
            <p className="mt-1 text-sm text-text-tertiary">
              AI agentlar (Cursor, Claude va hokazo) workspace bilan xavfsiz ulanishi uchun Client ID / Secret.
            </p>
            <p className="mt-3 text-sm text-amber-200/80">
              Client ID / Secret yaratish endpointi ulangan. Secret faqat bir marta ko'rinadi, keyin maskalangan holda saqlanadi.
            </p>
            <Button className="mt-4" size="sm" type="button" loading={creating} onClick={() => void createCredential()} disabled={!currentWorkspace?.id}>
              + {t('workspaceSettings.mcp.createCredentials', 'Create Client ID / Client Secret')}
            </Button>
            {error && <Alert className="mt-2" variant="error">{error}</Alert>}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-text-primary">Server va hujjatlar</h3>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-text-tertiary">MCP Server URL</p>
            <p className="mt-1 break-all font-mono text-text-secondary">
              {env.apiBaseUrl?.replace(/\/$/, '') ?? '(NEXT_PUBLIC_API_BASE_URL)'}/mcp{' '}
              <span className="text-text-tertiary">— rejalashtirilmoqda</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Documentation</p>
            <a href={DOCS_URL} className="mt-1 inline-block text-violet-400 underline" target="_blank" rel="noreferrer">
              {DOCS_URL}
            </a>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-text-primary">{t('workspaceSettings.mcp.existingCredentials', 'Existing credentials')}</h3>
        {loading ? (
          <p className="mt-3 text-sm text-text-tertiary">Yuklanmoqda...</p>
        ) : credentials.length === 0 ? (
          <p className="mt-3 text-sm text-text-tertiary">{t('workspaceSettings.mcp.noCredentials', 'No credentials yet')}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {credentials.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.clientId}</p>
                  <p className="text-xs text-text-tertiary">
                    {item.secretMasked} · {new Date(item.createdAt).toLocaleString()}
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
        )}
      </Card>

      <Dialog open={showSecretModal} onClose={() => setShowSecretModal(false)} title="Yangi credentialslar" className="max-w-lg">
        <p className="mt-2 text-sm text-text-tertiary">
          Secret faqat bir marta ko'rinadi — nusxalab saqlang.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-text-tertiary">Client ID</label>
            <Input readOnly value={newClientId} className="mt-1 font-mono text-xs" />
          </div>
          <div>
            <label className="text-xs text-text-tertiary">Client Secret</label>
            <Input readOnly value={newClientSecret} className="mt-1 font-mono text-xs" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            size="sm"
            type="button"
            onClick={() => {
              setShowSecretModal(false)
              setNewClientSecret('')
            }}
          >
            Saqladim
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
