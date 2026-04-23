'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog } from '@/components/ui'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { team } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { fetchMetaDashboard } from '@/lib/meta'
import { useI18n } from '@/i18n/use-i18n'

type MemberRow = {
  userId: string
  role: 'owner' | 'admin' | 'advertiser'
  allowedAdAccountIds?: string[]
  user?: { id: string; email: string; name: string | null } | null
}

type PendingInvite = {
  id: string
  email: string
  role: string
  status: string
}

export default function WorkspaceTeamPage() {
  const { t } = useI18n()
  const { currentWorkspace, user } = useWorkspaceStore()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [pending, setPending] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [adAccounts, setAdAccounts] = useState<Array<{ id: string; name: string }>>([])

  const load = useCallback(async () => {
    if (!currentWorkspace?.id) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await team.listMembers(currentWorkspace.id)
      const body = data as { members?: MemberRow[]; pendingInvites?: PendingInvite[] }
      setMembers(body.members ?? [])
      setPending(body.pendingInvites ?? [])
      const metaData = await fetchMetaDashboard(currentWorkspace.id).catch(() => null)
      setAdAccounts(metaData?.accounts?.length ? metaData.accounts.map((a) => ({ id: a.id, name: a.name })) : [])
    } catch (e: any) {
      setError(e?.message ?? 'Roʻyxat yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => { void load() }, [load])

  async function sendInvite() {
    if (!currentWorkspace?.id || !inviteEmail.trim()) return
    setInviteBusy(true)
    setInviteMsg('')
    try {
      await team.createInvites({ workspaceId: currentWorkspace.id, emails: [inviteEmail.trim()], role: 'advertiser' })
      setInviteEmail('')
      setInviteOpen(false)
      await load()
    } catch (e: any) {
      setInviteMsg(e?.message ?? 'Xato')
    } finally {
      setInviteBusy(false)
    }
  }

  async function revoke(id: string) {
    try { await team.revokeInvite(id); await load() } catch { /* noop */ }
  }

  async function updateRole(memberUserId: string, role: MemberRow['role']) {
    if (!currentWorkspace?.id) return
    try { await team.updateMemberRole({ workspaceId: currentWorkspace.id, memberUserId, role }); await load() } catch { /* noop */ }
  }

  async function toggleAccount(member: MemberRow, accountId: string) {
    if (!currentWorkspace?.id) return
    const current = new Set(member.allowedAdAccountIds ?? [])
    if (current.has(accountId)) current.delete(accountId)
    else current.add(accountId)
    try {
      await team.updateMemberAdAccounts({ workspaceId: currentWorkspace.id, memberUserId: member.userId, allowedAdAccountIds: Array.from(current) })
      await load()
    } catch { /* noop */ }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{currentWorkspace?.name ?? '—'}</span>
            <Link href="/settings/workspace/profile"
              className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-emerald-600"
              aria-label={t('common.edit', 'Edit')}>
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            disabled={!currentWorkspace?.id}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('workspaceSettings.team.invite', 'Invite team member')}
          </button>
        </div>

        {error && <div className="px-6 pt-4"><Alert variant="error">{error}</Alert></div>}

        <div className="overflow-x-auto px-6 pb-6 pt-4">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              <tr>
                <th className="pb-2 pr-4">{t('workspaceSettings.team.colName', 'Full name')}</th>
                <th className="pb-2 pr-4">{t('workspaceSettings.team.colAdAccounts', 'Ad accounts')}</th>
                <th className="pb-2 pr-4">{t('workspaceSettings.team.colEmail', 'Email')}</th>
                <th className="pb-2">{t('workspaceSettings.team.colAccess', 'Access')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && (
                <tr><td colSpan={4} className="py-8 text-center text-text-tertiary">
                  {t('workspaceSettings.team.loading', 'Loading team…')}
                </td></tr>
              )}
              {!loading && members.map((m) => {
                const isYou = user?.id === m.userId
                const name = m.user?.name || m.user?.email || m.userId.slice(0, 8)
                const email = m.user?.email ?? '—'
                const count = Array.isArray(m.allowedAdAccountIds) ? m.allowedAdAccountIds.length : 0
                return (
                  <tr key={m.userId}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                          {(name.charAt(0) || '?').toUpperCase()}
                        </div>
                        <span className="font-medium text-text-primary">
                          {name}
                          {isYou && <span className="ml-1.5 text-xs font-normal text-text-tertiary">({t('workspaceSettings.team.you', 'you')})</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">
                      <span className="tabular-nums">{count}</span>
                      {count > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(m.allowedAdAccountIds ?? []).slice(0, 3).map((id) => (
                            <span key={id} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-tertiary">{id.slice(0, 6)}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-text-tertiary">{email}</td>
                    <td className="py-3">
                      <select
                        className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-secondary dark:bg-slate-800"
                        value={m.role}
                        onChange={(e) => void updateRole(m.userId, e.target.value as MemberRow['role'])}
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="advertiser">advertiser</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
              {!loading && members.length === 0 && !error && (
                <tr><td colSpan={4} className="py-8 text-center text-text-tertiary">
                  {t('workspaceSettings.team.empty', 'No members yet. Invite teammates or check your workspace API response.')}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pending.length > 0 && (
          <div className="border-t border-border px-6 pb-6 pt-4">
            <h3 className="text-sm font-semibold text-text-secondary">
              {t('workspaceSettings.team.pendingInvites', 'Pending invites')}
            </h3>
            <ul className="mt-2 space-y-2">
              {pending.map((p) => (
                <li key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="text-text-primary">{p.email}</span>
                  <span className="text-xs text-text-tertiary">{p.role}</span>
                  <button type="button" onClick={() => revoke(p.id)}
                    className="text-xs text-red-500 hover:underline dark:text-red-400">
                    {t('workspaceSettings.team.revoke', 'Revoke')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ad account permissions */}
      {adAccounts.length > 0 && members.length > 0 && (
        <div className="rounded-2xl border border-border bg-white shadow-sm dark:bg-slate-900">
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-sm font-semibold text-text-secondary">
              {t('workspaceSettings.team.adAccountsAccess', 'Member ad-account permissions')}
            </h3>
          </div>
          <div className="space-y-3 px-6 pb-6">
            {members.map((m) => (
              <div key={m.userId} className="rounded-xl border border-border p-3">
                <p className="mb-2.5 text-sm font-medium text-text-primary">
                  {m.user?.name || m.user?.email || m.userId.slice(0, 8)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {adAccounts.map((acc) => {
                    const active = (m.allowedAdAccountIds ?? []).includes(acc.id)
                    return (
                      <button key={acc.id} type="button"
                        onClick={() => void toggleAccount(m, acc.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          active
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-border bg-surface text-text-tertiary hover:bg-surface-2'
                        }`}>
                        {acc.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite dialog */}
      {inviteOpen && (
        <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}
          title={t('workspaceSettings.team.invite', 'Invite team member')} className="max-w-md">
          <p className="mt-1 text-sm text-text-tertiary">
            {t('workspaceSettings.team.inviteHint', 'Send an email invitation. The user should be registered with the same email.')}
          </p>
          <label className="mt-4 block text-xs text-text-tertiary" htmlFor="invite-email">Email</label>
          <Input id="invite-email" className="mt-1" placeholder="user@example.com"
            value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          {inviteMsg && <p className="mt-2 text-sm text-amber-500">{inviteMsg}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setInviteOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" type="button" loading={inviteBusy} onClick={() => void sendInvite()}>
              {t('common.send', 'Send')}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
