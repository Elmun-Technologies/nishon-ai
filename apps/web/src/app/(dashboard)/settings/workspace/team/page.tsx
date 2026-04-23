'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui'
import Link from 'next/link'
import {
  Plus,
  Pencil,
  Mail,
  ShieldCheck,
  Users,
  RefreshCw,
  X,
  ChevronDown,
  Briefcase,
  UserCircle2,
} from 'lucide-react'
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

const ROLE_CONFIG: Record<
  MemberRow['role'],
  { label: string; variant: 'success' | 'warning' | 'info'; icon: React.ReactNode }
> = {
  owner: {
    label: 'Owner',
    variant: 'success',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  admin: {
    label: 'Admin',
    variant: 'warning',
    icon: <Briefcase className="h-3 w-3" />,
  },
  advertiser: {
    label: 'Advertiser',
    variant: 'info',
    icon: <UserCircle2 className="h-3 w-3" />,
  },
}

const AVATAR_COLORS = [
  'from-emerald-400/30 to-brand-mid/30 text-emerald-700 dark:text-emerald-300',
  'from-amber-400/30 to-orange-400/30 text-amber-700 dark:text-amber-300',
  'from-blue-400/30 to-cyan-400/30 text-blue-700 dark:text-blue-300',
  'from-rose-400/30 to-pink-400/30 text-rose-700 dark:text-rose-300',
  'from-brand-mid/30 to-brand-lime/30 text-brand-ink dark:text-brand-lime',
]

function getAvatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function MemberCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border/60 bg-white/60 p-5 dark:bg-slate-900/40">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-surface-2" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-md bg-surface-2" />
          <div className="h-3 w-48 rounded-md bg-surface-2" />
        </div>
        <div className="h-6 w-20 rounded-full bg-surface-2" />
      </div>
      <div className="mt-4 h-3 w-24 rounded-md bg-surface-2" />
    </div>
  )
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
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null)

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
      setAdAccounts(meta?.accounts?.length ? meta.accounts.map((acc) => ({ id: acc.id, name: acc.name })) : [])
    } catch (e: any) {
      setError(e?.message ?? t('workspaceSettings.team.loadError', 'Failed to load team'))
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id, t])

  useEffect(() => { void load() }, [load])

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
      await load()
    } catch (e: any) {
      setInviteMsg(e?.message ?? t('common.error', 'Error'))
    } finally {
      setInviteBusy(false)
    }
  }

  async function revoke(id: string) {
    try {
      await team.revokeInvite(id)
      await load()
    } catch { /* noop */ }
  }

  async function updateRole(memberUserId: string, role: MemberRow['role']) {
    if (!currentWorkspace?.id) return
    setOpenRoleMenu(null)
    try {
      await team.updateMemberRole({ workspaceId: currentWorkspace.id, memberUserId, role })
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberUserId ? { ...m, role } : m))
      )
    } catch { /* noop */ }
  }

  async function toggleAccount(member: MemberRow, accountId: string) {
    if (!currentWorkspace?.id) return
    const current = new Set(member.allowedAdAccountIds ?? [])
    if (current.has(accountId)) current.delete(accountId)
    else current.add(accountId)
    const next = Array.from(current)
    setMembers((prev) =>
      prev.map((m) => (m.userId === member.userId ? { ...m, allowedAdAccountIds: next } : m))
    )
    try {
      await team.updateMemberAdAccounts({
        workspaceId: currentWorkspace.id,
        memberUserId: member.userId,
        allowedAdAccountIds: next,
      })
    } catch {
      await load()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-lime/10 to-brand-mid/5 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/20">
              <Users className="h-5 w-5 text-brand-ink dark:text-brand-lime" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-text-primary">
                  {currentWorkspace?.name ?? '—'}
                </span>
                <Link
                  href="/settings/workspace/profile"
                  className="inline-flex rounded-lg p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-brand-mid"
                  aria-label={t('common.edit', 'Edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="text-xs text-text-tertiary">
                {members.length > 0
                  ? t(
                      'workspaceSettings.team.memberCount',
                      `${members.length} member${members.length !== 1 ? 's' : ''}`,
                    )
                  : t('workspaceSettings.team.noMembers', 'No members yet')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            type="button"
            className="gap-1.5 shadow-sm"
            onClick={() => setInviteOpen(true)}
            disabled={!currentWorkspace?.id}
          >
            <Plus className="h-4 w-4" />
            {t('workspaceSettings.team.invite', 'Invite member')}
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-4 border-t border-red-200/50 bg-red-50/80 px-6 py-3 dark:border-red-800/30 dark:bg-red-950/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}
      </Card>

      {/* Member cards grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => <MemberCardSkeleton key={i} />)}
        </div>
      ) : members.length === 0 && !error ? (
        <Card className="py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lime/15">
            <Users className="h-8 w-8 text-brand-mid" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-text-primary">
            {t('workspaceSettings.team.emptyTitle', 'No team members yet')}
          </h3>
          <p className="mt-1.5 text-sm text-text-tertiary">
            {t(
              'workspaceSettings.team.emptyHint',
              'Invite teammates to collaborate on your ad campaigns.',
            )}
          </p>
          <Button
            size="sm"
            className="mx-auto mt-5 gap-1.5"
            onClick={() => setInviteOpen(true)}
            disabled={!currentWorkspace?.id}
          >
            <Plus className="h-4 w-4" />
            {t('workspaceSettings.team.invite', 'Invite member')}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const isYou = user?.id === m.userId
            const name = m.user?.name || m.user?.email || m.userId.slice(0, 8)
            const email = m.user?.email ?? '—'
            const initial = (name.charAt(0) || '?').toUpperCase()
            const avatarColor = getAvatarColor(m.userId)
            const roleConf = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.advertiser
            const adCount = m.allowedAdAccountIds?.length ?? 0

            return (
              <div
                key={m.userId}
                className="group relative rounded-2xl border border-border/60 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:border-brand-mid/40 hover:shadow-md dark:bg-slate-900/60"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold ${avatarColor}`}
                  >
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-text-primary">{name}</span>
                      {isYou && (
                        <span className="shrink-0 rounded-full bg-brand-lime/20 px-2 py-0.5 text-[10px] font-semibold text-brand-ink dark:text-brand-lime">
                          {t('workspaceSettings.team.you', 'you')}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    {adCount > 0 && (
                      <p className="mt-1.5 text-[11px] text-text-tertiary">
                        {adCount} {t('workspaceSettings.team.adAccountsLinked', 'ad account(s) linked')}
                      </p>
                    )}
                  </div>

                  {/* Role selector */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenRoleMenu(openRoleMenu === m.userId ? null : m.userId)}
                      className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-surface-2"
                      aria-label="Change role"
                    >
                      <Badge variant={roleConf.variant} size="sm" dot>
                        {t(`workspaceSettings.team.role.${m.role}`, roleConf.label)}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-text-tertiary" />
                    </button>
                    {openRoleMenu === m.userId && (
                      <div className="absolute right-0 top-8 z-20 min-w-[140px] overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-slate-900">
                        {(['owner', 'admin', 'advertiser'] as const).map((r) => {
                          const rc = ROLE_CONFIG[r]
                          return (
                            <button
                              key={r}
                              type="button"
                              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${m.role === r ? 'text-brand-mid font-medium' : 'text-text-secondary'}`}
                              onClick={() => void updateRole(m.userId, r)}
                            >
                              {rc.icon}
                              {t(`workspaceSettings.team.role.${r}`, rc.label)}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad account toggles */}
                {adAccounts.length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                      {t('workspaceSettings.team.adAccountsAccess', 'Ad account access')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {adAccounts.map((acc) => {
                        const active = (m.allowedAdAccountIds ?? []).includes(acc.id)
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => void toggleAccount(m, acc.id)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                              active
                                ? 'border-brand-mid/40 bg-brand-lime/15 text-brand-ink dark:border-brand-mid/60 dark:text-brand-lime'
                                : 'border-border bg-surface text-text-tertiary hover:border-brand-mid/30 hover:bg-surface-2'
                            }`}
                          >
                            {acc.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Click-outside for role menu */}
      {openRoleMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenRoleMenu(null)}
          aria-hidden
        />
      )}

      {/* Pending invites */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('workspaceSettings.team.pendingInvites', 'Pending invites')} ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 dark:border-amber-700/30 dark:bg-amber-950/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/50 bg-amber-100/60 dark:border-amber-700/40 dark:bg-amber-900/30">
                    <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text-primary">{p.email}</span>
                    <p className="text-[11px] text-text-tertiary capitalize">{p.role} · pending</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void revoke(p.id)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('workspaceSettings.team.revoke', 'Revoke')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite dialog */}
      {inviteOpen && (
        <Dialog
          open={inviteOpen}
          onClose={() => { setInviteOpen(false); setInviteEmail(''); setInviteMsg('') }}
          title={t('workspaceSettings.team.invite', 'Invite team member')}
          className="max-w-md"
        >
          <p className="mt-1 text-sm text-text-tertiary">
            {t(
              'workspaceSettings.team.inviteHint',
              'The user must already be registered with this email address.',
            )}
          </p>
          <label className="mt-5 block text-xs font-medium text-text-secondary" htmlFor="invite-email">
            {t('workspaceSettings.team.emailLabel', 'Email address')}
          </label>
          <Input
            id="invite-email"
            className="mt-1.5"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void sendInvite()}
            autoFocus
          />
          {inviteMsg && (
            <p className="mt-2 text-sm text-amber-500">{inviteMsg}</p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => { setInviteOpen(false); setInviteEmail(''); setInviteMsg('') }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              type="button"
              loading={inviteBusy}
              disabled={!inviteEmail.trim()}
              onClick={() => void sendInvite()}
            >
              {t('workspaceSettings.team.sendInvite', 'Send invite')}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
