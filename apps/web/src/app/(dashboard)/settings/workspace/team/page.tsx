'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog, PageHeader } from '@/components/ui'
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
    if (!currentWorkspace?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await team.listMembers(currentWorkspace.id)
      const body = data as { members?: MemberRow[]; pendingInvites?: PendingInvite[] }
      setMembers(body.members ?? [])
      setPending(body.pendingInvites ?? [])
      const meta = await fetchMetaDashboard(currentWorkspace.id).catch(() => null)
      if (meta?.accounts?.length) {
        setAdAccounts(meta.accounts.map((acc) => ({ id: acc.id, name: acc.name })))
      } else {
        setAdAccounts([])
      }
    } catch (e: any) {
      setError(e?.message ?? 'Roʻyxat yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    void load()
  }, [load])

  async function sendInvite() {
    if (!currentWorkspace?.id || !inviteEmail.trim()) return
    setInviteBusy(true)
    setInviteMsg('')
    try {
      await team.createInvites({
        workspaceId: currentWorkspace.id,
        emails: [inviteEmail.trim()],
        role: 'advertiser',
      })
      setInviteEmail('')
      setInviteOpen(false)
      setInviteMsg('')
      await load()
    } catch (e: any) {
      setInviteMsg(e?.message ?? 'Xato')
    } finally {
      setInviteBusy(false)
    }
  }

  async function revoke(id: string) {
    try {
      await team.revokeInvite(id)
      await load()
    } catch {
      /* noop */
    }
  }

  async function updateRole(memberUserId: string, role: MemberRow['role']) {
    if (!currentWorkspace?.id) return
    try {
      await team.updateMemberRole({
        workspaceId: currentWorkspace.id,
        memberUserId,
        role,
      })
      await load()
    } catch {
      // noop
    }
  }

  async function toggleAccount(member: MemberRow, accountId: string) {
    if (!currentWorkspace?.id) return
    const current = new Set(member.allowedAdAccountIds ?? [])
    if (current.has(accountId)) current.delete(accountId)
    else current.add(accountId)
    try {
      await team.updateMemberAdAccounts({
        workspaceId: currentWorkspace.id,
        memberUserId: member.userId,
        allowedAdAccountIds: Array.from(current),
      })
      await load()
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('workspaceSettings.tabs.team', 'Team members')}
        subtitle={currentWorkspace?.name ?? t('workspaceSettings.title', 'Workspace settings')}
        actions={
          <Button size="sm" type="button" onClick={() => setInviteOpen(true)} disabled={!currentWorkspace?.id}>
            + {t('workspaceSettings.team.invite', 'Invite team member')}
          </Button>
        }
      />

      <Card>
        {error && (
          <Alert variant="error" className="mt-4">{error}</Alert>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border bg-surface-2/80 text-xs uppercase tracking-wide text-text-tertiary">
              <tr>
                <th className="px-4 py-3">Ism</th>
                <th className="px-4 py-3">Ad accounts</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ruxsat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-tertiary">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!loading &&
                members.map((m) => {
                  const isYou = user?.id === m.userId
                  const name = m.user?.name || m.user?.email || m.userId.slice(0, 8)
                  const email = m.user?.email ?? '—'
                  const count = Array.isArray(m.allowedAdAccountIds) ? m.allowedAdAccountIds.length : 0
                  return (
                    <tr key={m.userId} className="bg-surface/30">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {name}
                        {isYou && (
                          <span className="ml-2 text-xs font-normal text-text-tertiary">(siz)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {count}
                        {count > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(m.allowedAdAccountIds ?? []).slice(0, 3).map((id) => (
                              <span key={id} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-tertiary">
                                {id.slice(0, 6)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-tertiary">{email}</td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-secondary"
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
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-text-tertiary">
                    A&apos;zo yozuvlari topilmadi (yangi workspace yoki API javobi bo'sh).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pending.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-secondary">{t('workspaceSettings.team.pendingInvites', 'Pending invites')}</h3>
            <ul className="mt-2 space-y-2">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-text-primary">{p.email}</span>
                  <span className="text-xs text-text-tertiary">{p.role}</span>
                  <button
                    type="button"
                    onClick={() => revoke(p.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Bekor qilish
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {adAccounts.length > 0 && members.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-text-secondary">{t('workspaceSettings.team.adAccountsAccess', 'Member ad-account permissions')}</h3>
          <div className="mt-3 space-y-3">
            {members.map((m) => (
              <div key={m.userId} className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm font-medium text-text-primary">
                  {m.user?.name || m.user?.email || m.userId.slice(0, 8)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {adAccounts.map((acc) => {
                    const active = (m.allowedAdAccountIds ?? []).includes(acc.id)
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => void toggleAccount(m, acc.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          active
                            ? 'border-violet-400/40 bg-violet-500/10 text-violet-200'
                            : 'border-border bg-surface text-text-tertiary hover:bg-surface-2'
                        }`}
                      >
                        {acc.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {inviteOpen && (
        <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('workspaceSettings.team.invite', 'Invite team member')} className="max-w-md">
          <p className="mt-1 text-sm text-text-tertiary">
            {t('workspaceSettings.team.inviteHint', 'Send an email invitation. The user should be registered with the same email.')}
          </p>
          <label className="mt-4 block text-xs text-text-tertiary" htmlFor="invite-email">
            Email
          </label>
          <Input
            id="invite-email"
            className="mt-1"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          {inviteMsg && <p className="mt-2 text-sm text-amber-300">{inviteMsg}</p>}
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
