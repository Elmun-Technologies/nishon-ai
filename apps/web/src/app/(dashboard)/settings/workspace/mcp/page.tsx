'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog } from '@/components/ui'
import { useToast } from '@/components/ui/Toaster'
import { env } from '@/lib/env'
import { mcpCredentials } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'
import { KeyRound, Link2, Lock, Copy, Check, Plug, Plus, Wifi, WifiOff } from 'lucide-react'

const DOCS_URL = 'https://adspectr.com/docs'

type Credential = {
  id: string
  clientId: string
  secretMasked: string
  createdAt: string
  revokedAt?: string | null
}

type ConnectionState = 'idle' | 'checking' | 'ok' | 'error'

export default function WorkspaceMcpPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { currentWorkspace } = useWorkspaceStore()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [newClientId, setNewClientId] = useState('')
  const [newClientSecret, setNewClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<'id' | 'secret' | null>(null)
  const [connState, setConnState] = useState<ConnectionState>('idle')
  const [connLatencyMs, setConnLatencyMs] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'MCP Integration — Workspace settings | AdSpectr'
  }, [])

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
      toast(e?.message ?? 'Credential yaratilmagan', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function revokeCredential(id: string) {
    if (!currentWorkspace?.id) return
    try {
      await mcpCredentials.revoke(id, currentWorkspace.id)
      toast('Credential revoked.')
      await loadCredentials()
    } catch (e: any) {
      toast(e?.message ?? 'Failed to revoke', 'error')
    }
  }

  async function copyField(value: string, field: 'id' | 'secret') {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 2000)
    } catch { /* clipboard blocked */ }
  }

  async function testConnection() {
    const mcpUrl = `${env.apiBaseUrl?.replace(/\/$/, '') ?? ''}/mcp`
    setConnState('checking')
    setConnLatencyMs(null)
    const start = Date.now()
    try {
      const res = await fetch(mcpUrl, { method: 'GET', signal: AbortSignal.timeout(8000) })
      const ms = Date.now() - start
      setConnLatencyMs(ms)
      if (res.ok || res.status === 401 || res.status === 405) {
        setConnState('ok')
        toast(`MCP server reachable — ${ms}ms`)
      } else {
        setConnState('error')
        toast(`MCP server returned ${res.status}`, 'error')
      }
    } catch {
      setConnLatencyMs(null)
      setConnState('error')
      toast('MCP server unreachable', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Credentials */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <Plug className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {t('workspaceSettings.mcp.title', 'MCP integration')}
              </h2>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {t('workspaceSettings.mcp.securityNote', 'Secrets are shown only once when generated. Copy them immediately to your secure vault.')}
              </p>
            </div>
          </div>
          {credentials.length > 0 && (
            <Button size="sm" type="button" loading={creating} onClick={() => void createCredential()} disabled={!currentWorkspace?.id} className="gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              {t('workspaceSettings.mcp.createCredentials', 'New credential')}
            </Button>
          )}
        </div>

        {error && <Alert className="mt-4" variant="error">{error}</Alert>}

        <div className="mt-5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2/60" />)}
            </div>
          ) : credentials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-2/20 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lime/10 text-brand-mid dark:text-brand-lime">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {t('workspaceSettings.mcp.noCredentials', 'No credentials yet')}
              </h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-text-tertiary">
                {t('workspaceSettings.mcp.noCredentialsBody', 'Generate a Client ID and Client Secret to connect AI agents to this workspace.')}
              </p>
              <div className="mx-auto mt-4 max-w-xs rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-700 dark:text-amber-200">
                {t('workspaceSettings.mcp.securityNote', 'Secrets are shown only once when generated. Copy them immediately to your secure vault.')}
              </div>
              <Button className="mt-5 gap-1.5" size="sm" type="button" loading={creating} onClick={() => void createCredential()} disabled={!currentWorkspace?.id}>
                <Plus className="h-3.5 w-3.5" />
                {t('workspaceSettings.mcp.createCredentials', 'Create Client ID / Secret')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {t('workspaceSettings.mcp.existingCredentials', 'Existing credentials')}
              </p>
              {credentials.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-2/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-text-primary">{item.clientId}</p>
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      {item.secretMasked} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" type="button" onClick={() => void revokeCredential(item.id)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Server info + Test connection */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <Link2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {t('workspaceSettings.mcp.serverAndDocs', 'Server and documentation')}
              </h3>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Use this MCP server URL and documentation to connect AI agents to your workspace.
              </p>
            </div>
          </div>

          {/* Test connection button */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Button
              size="sm"
              variant="secondary"
              type="button"
              loading={connState === 'checking'}
              onClick={() => void testConnection()}
              className="gap-1.5"
            >
              {connState === 'ok'
                ? <Wifi className="h-3.5 w-3.5 text-brand-mid" />
                : connState === 'error'
                ? <WifiOff className="h-3.5 w-3.5 text-red-500" />
                : <Wifi className="h-3.5 w-3.5" />
              }
              Test connection
            </Button>
            {connState === 'ok' && connLatencyMs !== null && (
              <span className="text-[11px] text-brand-mid dark:text-brand-lime">
                Reachable · {connLatencyMs}ms
              </span>
            )}
            {connState === 'error' && (
              <span className="text-[11px] text-red-500">Unreachable</span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              <Link2 className="h-3.5 w-3.5" />
              MCP Server URL
            </p>
            <p className="mt-2 break-all font-mono text-sm text-text-secondary">
              {env.apiBaseUrl?.replace(/\/$/, '') ?? '(NEXT_PUBLIC_API_BASE_URL)'}/mcp
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              <KeyRound className="h-3.5 w-3.5" />
              Documentation
            </p>
            <a href={DOCS_URL} className="mt-2 inline-block text-sm font-medium text-brand-mid underline-offset-2 hover:underline dark:text-brand-lime" target="_blank" rel="noreferrer">
              {DOCS_URL}
            </a>
          </div>
        </div>
      </section>

      {/* New credential modal */}
      <Dialog open={showSecretModal} onClose={() => setShowSecretModal(false)} title={t('workspaceSettings.mcp.credentialsModalTitle', 'Your new credentials')} className="max-w-lg">
        <p className="mt-2 text-sm text-text-tertiary">
          {t('workspaceSettings.mcp.credentialsModalHint', 'Copy these now and store them somewhere safe. You will not be able to see the Client Secret again.')}
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Client ID</label>
            <div className="mt-1.5 flex gap-2">
              <Input readOnly value={newClientId} className="font-mono text-xs" />
              <Button type="button" size="sm" variant="secondary" className="shrink-0 px-3" onClick={() => void copyField(newClientId, 'id')} disabled={!newClientId}>
                {copiedField === 'id' ? <Check className="h-4 w-4 text-brand-mid" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Client Secret</label>
            <div className="mt-1.5 flex gap-2">
              <Input readOnly value={newClientSecret} className="font-mono text-xs" />
              <Button type="button" size="sm" variant="secondary" className="shrink-0 px-3" onClick={() => void copyField(newClientSecret, 'secret')} disabled={!newClientSecret}>
                {copiedField === 'secret' ? <Check className="h-4 w-4 text-brand-mid" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button size="sm" type="button" variant="secondary" onClick={() => { setShowSecretModal(false); setNewClientSecret('') }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" type="button" onClick={() => { setShowSecretModal(false); setNewClientSecret(''); toast('Credentials saved. Keep them secure.') }}>
            {t('workspaceSettings.mcp.savedCredentials', "I've saved my credentials")}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
