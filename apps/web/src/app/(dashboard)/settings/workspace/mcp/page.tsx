'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog } from '@/components/ui'
import { env } from '@/lib/env'
import { mcpCredentials } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { KeyRound, Link2, Lock, Copy, Check } from 'lucide-react'

const DOCS_URL = 'https://adspectr.com/docs'

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
  const [copiedField, setCopiedField] = useState<'id' | 'secret' | null>(null)

  const loadCredentials = useCallback(async () => {
    if (!currentWorkspace?.id) { setLoading(false); return }
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

  useEffect(() => { void loadCredentials() }, [loadCredentials])

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

  async function copyField(value: string, field: 'id' | 'secret') {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 2000)
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="space-y-4">
      {/* Credentials card */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-text-tertiary">…</p>
        ) : credentials.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-text-primary">
              {t('workspaceSettings.mcp.noCredentials', 'No credentials yet')}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-tertiary">
              {t('workspaceSettings.mcp.noCredentialsBody', 'Generate a Client ID and Client Secret to connect AI agents to this workspace.')}
            </p>
            <div className="mt-4 max-w-sm rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left text-xs text-amber-800 dark:text-amber-200">
              {t('workspaceSettings.mcp.securityNote', 'Secrets are shown only once when generated. Copy them immediately to your secure vault.')}
            </div>
            <button
              type="button"
              disabled={!currentWorkspace?.id || creating}
              onClick={() => void createCredential()}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? '…' : `+ ${t('workspaceSettings.mcp.createCredentials', 'Create Client ID / Client Secret')}`}
            </button>
            {error && <Alert className="mt-4 text-left w-full" variant="error">{error}</Alert>}
          </div>
        ) : (
          <div className="px-6 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {t('workspaceSettings.mcp.title', 'MCP integration')}
                </h2>
                <p className="mt-0.5 max-w-2xl text-sm text-text-tertiary">
                  {t('workspaceSettings.mcp.securityNote', 'Secrets are shown only once when generated. Copy them to your secure vault.')}
                </p>
              </div>
              <button
                type="button"
                disabled={!currentWorkspace?.id || creating}
                onClick={() => void createCredential()}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? '…' : `+ ${t('workspaceSettings.mcp.createCredentials', 'Create Client ID / Client Secret')}`}
              </button>
            </div>
            {error && <Alert className="mt-3" variant="error">{error}</Alert>}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {t('workspaceSettings.mcp.existingCredentials', 'Existing credentials')}
              </p>
              {credentials.map((item) => (
                <div key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2/20 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-text-primary">{item.clientId}</p>
                    <p className="text-xs text-text-tertiary">
                      {item.secretMasked} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" type="button" onClick={() => void revokeCredential(item.id)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Server & docs */}
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-lg font-semibold text-text-primary">
            {t('workspaceSettings.mcp.serverAndDocs', 'Server and documentation')}
          </h3>
          <p className="mt-0.5 text-sm text-text-tertiary">
            Use this MCP server URL and documentation to connect AI agents.
          </p>
        </div>
        <div className="grid gap-3 px-6 pb-6 pt-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2/10 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
              <Link2 className="h-3.5 w-3.5" />MCP Server URL
            </p>
            <p className="mt-2 break-all font-mono text-sm text-text-secondary">
              {env.apiBaseUrl?.replace(/\/$/, '') ?? '(NEXT_PUBLIC_API_BASE_URL)'}/mcp
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2/10 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-text-tertiary">
              <KeyRound className="h-3.5 w-3.5" />Documentation
            </p>
            <a href={DOCS_URL} className="mt-2 inline-block text-sm font-medium text-emerald-600 underline dark:text-emerald-400"
              target="_blank" rel="noreferrer">
              {DOCS_URL}
            </a>
          </div>
        </div>
      </div>

      {/* Secret reveal dialog */}
      <Dialog open={showSecretModal} onClose={() => setShowSecretModal(false)}
        title={t('workspaceSettings.mcp.credentialsModalTitle', 'Your new credentials')} className="max-w-lg">
        <p className="mt-2 text-sm text-text-tertiary">
          {t('workspaceSettings.mcp.credentialsModalHint', 'Copy these now and store them somewhere safe. You will not be able to see the Client Secret again.')}
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-text-tertiary">Client ID</label>
            <div className="mt-1 flex gap-2">
              <Input readOnly value={newClientId} className="font-mono text-xs" />
              <Button type="button" size="sm" variant="secondary" className="shrink-0 px-3"
                onClick={() => void copyField(newClientId, 'id')} disabled={!newClientId}>
                {copiedField === 'id' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-tertiary">Client Secret</label>
            <div className="mt-1 flex gap-2">
              <Input readOnly value={newClientSecret} className="font-mono text-xs" />
              <Button type="button" size="sm" variant="secondary" className="shrink-0 px-3"
                onClick={() => void copyField(newClientSecret, 'secret')} disabled={!newClientSecret}>
                {copiedField === 'secret' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="secondary" type="button"
            onClick={() => { setShowSecretModal(false); setNewClientSecret('') }}>
            Cancel
          </Button>
          <Button size="sm" type="button"
            onClick={() => { setShowSecretModal(false); setNewClientSecret('') }}>
            {t('workspaceSettings.mcp.savedCredentials', "I've saved my credentials")}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
