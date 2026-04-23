'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, Dialog } from '@/components/ui'
import { useToast } from '@/components/ui/Toaster'
import Link from 'next/link'
import { Plus, Pencil, Users } from 'lucide-react'
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

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
}

export default function WorkspaceTeamPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { currentWorkspace, user } = useWorkspaceStore()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [pending, setPending] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteRaw, setInviteRaw] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [adAccounts, setAdAccounts] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    document.title = 'Team Members — Workspace settings | AdSpectr'
  }, [])

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
      setAdAccounts(metaData?.accounts?.length ? metaData.accounts.map((acc) => ({ id: acc.id, name: acc.name })) : [])
    } catch (e: any) {
      setError(e?.message ?? 'Roʻyxat yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => { void load() }, [load])

  const parsedEmails = parseEmails(inviteRaw)
  const emailsValid = parsedEmails.length > 0

  async function sendInvite() {
    if (!currentWorkspace?.id || !emailsValid) return
    setInviteBusy(true)
    try {
      await team.createInvites({ workspaceId: currentWorkspace.id, emails: parsedEmails, role: 'advertiser' })
      setInviteRaw('')
      setInviteOpen(false)
      toast(parsedEmails.length === 1 ? `Invite sent to ${parsedEmails[0]}.` : `${parsedEmails.length} invites sent.`)
      await load()
    } catch (e: any) {
      toast(e?.message ?? 'Failed to send invite', 'error')
    } finally {
      setInviteBusy(false)
    }
  }

  async function revoke(id: string) {
    try {
      await team.revokeInvite(id)
      toast('Invite revoked.')
      await load()
    } catch { /* noop */ }
  }

  async function updateRole(memberUserId: string, role: MemberRow['role']) {
    if (!currentWorkspace?.id) return
    try {
      await team.updateMemberRole({ workspaceId: currentWorkspace.id, memberUserId, role })
      toast('Role updated.')
      await load()
    } catch { /* noop */ }
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-surface shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-text-primary">{currentWorkspace?.name ?? '—'}</span>
              <Link href="/settings/workspace/profile" className="inline-flex rounded-lg p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-brand-mid" aria-label={t('common.edit', 'Edit')}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <Button size="sm" type="button" className="gap-1.5" onClick={() => setInviteOpen(true)} disabled={!currentWorkspace?.id}>
            <Plus className="h-3.5 w-3.5" />
            {t('workspaceSettings.team.invite', 'Invite member')}
          </Button>
        </div>

        {error && (
          <div className="p-5">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Members table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border/70 bg-surface-2/40">
              <tr className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                <th className="px-5 py-3">{t('workspaceSettings.team.colName', 'Member')}</th>
                <th className="px-5 py-3">{t('workspaceSettings.team.colEmail', 'Email')}</th>
                <th className="px-5 py-3">{t('workspaceSettings.team.colAdAccounts', 'Ad accounts')}</th>
                <th className="px-5 py-3">{t('workspaceSettings.team.colAccess', 'Role')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-text-tertiary">
                    {t('workspaceSettings.team.loading', 'Loading team…')}
                  </td>
                </tr>
              )}
              {!loading && members.map((m) => {
                const isYou = user?.id === m.userId
                const name = m.user?.name || m.user?.email || m.userId.slice(0, 8)
                const email = m.user?.email ?? '—'
                const count = Array.isArray(m.allowedAdAccountIds) ? m.allowedAdAccountIds.length : 0
                const initial = (name.charAt(0) || '?').toUpperCase()
                return (
                  <tr key={m.userId} className="transition-colors hover:bg-surface-2/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-lime/15 text-sm font-semibold text-brand-ink dark:text-brand-lime">
                          {initial}
                        </div>
                        <span className="font-medium text-text-primary">
                          {name}
                          {isYou && <span className="ml-1.5 text-xs font-normal text-text-tertiary">({t('workspaceSettings.team.you', 'you')})</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">{email}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-surface-2 px-2 text-xs font-semibold text-text-secondary tabular-nums">
                        {count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        className="rounded-lg border border-border/70 bg-surface px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-mid"
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
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-text-tertiary">
                    {t('workspaceSettings.team.empty', 'No members yet. Invite teammates or check your workspace API response.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pending invites */}
        {pending.length > 0 && (
          <div className="border-t border-border/70 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('workspaceSettings.team.pendingInvites', 'Pending invites')}
            </p>
            <ul className="mt-3 space-y-2">
              {pending.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-4 py-2.5 text-sm">
                  <span className="font-medium text-text-primary">{p.email}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">{p.role}</span>
                  <button type="button" onClick={() => void revoke(p.id)} className="text-xs text-red-500 hover:underline">
                    {t('workspaceSettings.team.revoke', 'Revoke')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Ad-account permissions */}
      {adAccounts.length > 0 && members.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-text-secondary">
            {t('workspaceSettings.team.adAccountsAccess', 'Member ad-account permissions')}
          </h3>
          <div className="mt-4 space-y-3">
            {members.map((m) => (
              <div key={m.userId} className="rounded-xl border border-border/70 p-4">
                <p className="mb-3 text-sm font-semibold text-text-primary">
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
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active ? 'border-brand-mid/40 bg-brand-lime/15 text-brand-ink dark:text-brand-lime' : 'border-border bg-surface text-text-tertiary hover:bg-surface-2'}`}
                      >
                        {acc.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite dialog — bulk emails */}
      {inviteOpen && (
        <Dialog open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteRaw('') }} title={t('workspaceSettings.team.invite', 'Invite team members')} className="max-w-md">
          <p className="mt-2 text-sm text-text-tertiary">
            Enter one or more email addresses — separated by commas, spaces, or new lines.
          </p>
          <div className="mt-4">
            <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary" htmlFor="invite-emails">
              Email addresses
            </label>
            <textarea
              id="invite-emails"
              className="mt-1.5 w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-brand-mid dark:bg-surface"
              rows={4}
              placeholder={'alice@example.com\nbob@example.com, carol@example.com'}
              value={inviteRaw}
              onChange={(e) => setInviteRaw(e.target.value)}
            />
            {parsedEmails.length > 0 && (
              <p className="mt-1 text-xs text-brand-mid dark:text-brand-lime">
                {parsedEmails.length} valid email{parsedEmails.length !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => { setInviteOpen(false); setInviteRaw('') }}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button size="sm" type="button" loading={inviteBusy} onClick={() => void sendInvite()} disabled={!emailsValid}>
              {t('common.send', 'Send invite')} {parsedEmails.length > 1 ? `(${parsedEmails.length})` : ''}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
