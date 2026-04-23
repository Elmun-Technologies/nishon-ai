'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  Trash2,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react'
import { team } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { fetchMetaDashboard } from '@/lib/meta'
import { useI18n } from '@/i18n/use-i18n'

type MemberRow = {
  userId: string
  role: 'owner' | 'admin' | 'advertiser'
  allowedAdAccountIds?: string[]
  createdAt?: string
  user?: { id: string; email: string; name: string | null } | null
}

type PendingInvite = {
  id: string
  email: string
  role: string
  status: string
  createdAt?: string
}

type ConfirmAction =
  | { type: 'role'; member: MemberRow; newRole: MemberRow['role'] }
  | { type: 'remove'; member: MemberRow }

const ROLE_CONFIG: Record<
  MemberRow['role'],
  { label: string; variant: 'success' | 'warning' | 'info'; icon: React.ReactNode }
> = {
  owner:      { label: 'Owner',      variant: 'success', icon: <ShieldCheck className="h-3 w-3" /> },
  admin:      { label: 'Admin',      variant: 'warning', icon: <Briefcase className="h-3 w-3" /> },
  advertiser: { label: 'Advertiser', variant: 'info',    icon: <UserCircle2 className="h-3 w-3" /> },
}

const AVATAR_PALETTE = [
  'from-emerald-400/25 to-brand-mid/25 text-emerald-700 dark:text-emerald-300',
  'from-amber-400/25  to-orange-400/25  text-amber-700  dark:text-amber-300',
  'from-sky-400/25    to-cyan-400/25    text-sky-700    dark:text-sky-300',
  'from-rose-400/25   to-pink-400/25    text-rose-700   dark:text-rose-300',
  'from-brand-mid/25  to-brand-lime/25  text-brand-ink  dark:text-brand-lime',
]
function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function relativeDate(iso?: string) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border/60 bg-white/60 p-5 dark:bg-slate-900/40">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-surface-2" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-36 rounded bg-surface-2" />
          <div className="h-3 w-52 rounded bg-surface-2" />
        </div>
        <div className="h-6 w-20 rounded-full bg-surface-2" />
      </div>
      <div className="mt-4 h-3 w-28 rounded bg-surface-2" />
    </div>
  )
}

// ─── Tag‑email input ──────────────────────────────────────────────────────────
function EmailTagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commit(raw: string) {
    const emails = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !tags.includes(e))
    if (emails.length) onChange([...tags, ...emails])
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key)) {
      e.preventDefault()
      commit(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    commit(e.clipboardData.getData('text'))
  }

  return (
    <div
      className="mt-1.5 flex min-h-[42px] cursor-text flex-wrap gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 transition-colors focus-within:border-brand-mid/70 focus-within:ring-2 focus-within:ring-brand-mid/20"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-lg border border-brand-mid/30 bg-brand-lime/15 px-2 py-0.5 text-xs font-medium text-brand-ink dark:text-brand-lime"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)) }}
            className="ml-0.5 rounded text-text-tertiary hover:text-red-500"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        onBlur={() => input && commit(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[160px] flex-1 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
      />
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  action,
  onConfirm,
  onClose,
  busy,
}: {
  action: ConfirmAction
  onConfirm: () => void
  onClose: () => void
  busy: boolean
}) {
  const isOwnerPromotion = action.type === 'role' && action.newRole === 'owner'
  const isRemove = action.type === 'remove'
  const name =
    action.member.user?.name || action.member.user?.email || action.member.userId.slice(0, 8)

  const title =
    isRemove
      ? `Remove ${name}?`
      : isOwnerPromotion
      ? `Transfer ownership to ${name}?`
      : `Change role to ${action.type === 'role' ? action.newRole : ''}?`

  const description =
    isRemove
      ? `${name} will immediately lose access to this workspace.`
      : isOwnerPromotion
      ? `${name} will become the workspace owner. This action cannot easily be undone.`
      : `${name}'s role will be updated.`

  return (
    <Dialog open onClose={onClose} title={title} className="max-w-sm">
      <div className="mt-3 flex gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 dark:border-amber-700/30 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={isRemove ? 'danger' : 'primary'}
          size="sm"
          type="button"
          loading={busy}
          onClick={onConfirm}
        >
          {isRemove ? 'Remove' : 'Confirm'}
        </Button>
      </div>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkspaceTeamPage() {
  const { t } = useI18n()
  const { currentWorkspace, user } = useWorkspaceStore()

  const [members, setMembers]         = useState<MemberRow[]>([])
  const [pending, setPending]         = useState<PendingInvite[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [adAccounts, setAdAccounts]   = useState<{ id: string; name: string }[]>([])

  // invite dialog
  const [inviteOpen, setInviteOpen]   = useState(false)
  const [inviteEmails, setInviteEmails] = useState<string[]>([])
  const [inviteRole, setInviteRole]   = useState<'admin' | 'advertiser'>('advertiser')
  const [inviteBusy, setInviteBusy]   = useState(false)
  const [inviteErr, setInviteErr]     = useState('')

  // confirm dialog
  const [confirm, setConfirm]         = useState<ConfirmAction | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  // role dropdown
  const [openRole, setOpenRole]       = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentWorkspace?.id) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await team.listMembers(currentWorkspace.id)
      const body = data as { members?: MemberRow[]; pendingInvites?: PendingInvite[] }
      setMembers(body.members ?? [])
      setPending(body.pendingInvites ?? [])
      const meta = await fetchMetaDashboard(currentWorkspace.id).catch(() => null)
      setAdAccounts(meta?.accounts?.length ? meta.accounts.map((a: any) => ({ id: a.id, name: a.name })) : [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => { void load() }, [load])

  // ── invite ────────────────────────────────────────────────────────────────
  function openInvite() {
    setInviteEmails([])
    setInviteRole('advertiser')
    setInviteErr('')
    setInviteOpen(true)
  }

  async function sendInvite() {
    if (!currentWorkspace?.id || inviteEmails.length === 0) return
    setInviteBusy(true)
    setInviteErr('')
    try {
      await team.createInvites({
        workspaceId: currentWorkspace.id,
        emails: inviteEmails,
        role: inviteRole,
      })
      setInviteOpen(false)
      await load()
    } catch (e: any) {
      setInviteErr(e?.message ?? 'Error')
    } finally {
      setInviteBusy(false)
    }
  }

  // ── revoke pending invite ─────────────────────────────────────────────────
  async function revoke(id: string) {
    try {
      await team.revokeInvite(id)
      setPending((prev) => prev.filter((p) => p.id !== id))
    } catch { /* noop */ }
  }

  // ── role change ───────────────────────────────────────────────────────────
  function requestRoleChange(member: MemberRow, newRole: MemberRow['role']) {
    setOpenRole(null)
    if (newRole === member.role) return
    if (newRole === 'owner' || member.role === 'owner') {
      setConfirm({ type: 'role', member, newRole })
    } else {
      void applyRoleChange(member, newRole)
    }
  }

  async function applyRoleChange(member: MemberRow, newRole: MemberRow['role']) {
    if (!currentWorkspace?.id) return
    setMembers((prev) => prev.map((m) => m.userId === member.userId ? { ...m, role: newRole } : m))
    try {
      await team.updateMemberRole({ workspaceId: currentWorkspace.id, memberUserId: member.userId, role: newRole })
    } catch { await load() }
  }

  // ── remove member ─────────────────────────────────────────────────────────
  async function applyRemove(member: MemberRow) {
    if (!currentWorkspace?.id) return
    setConfirmBusy(true)
    try {
      await team.removeMember(currentWorkspace.id, member.userId)
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId))
      setConfirm(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to remove member')
      setConfirm(null)
    } finally {
      setConfirmBusy(false)
    }
  }

  // ── confirm dispatcher ────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!confirm) return
    if (confirm.type === 'remove') {
      await applyRemove(confirm.member)
    } else {
      setConfirmBusy(true)
      await applyRoleChange(confirm.member, confirm.newRole)
      setConfirmBusy(false)
      setConfirm(null)
    }
  }

  // ── ad account toggle ─────────────────────────────────────────────────────
  async function toggleAccount(member: MemberRow, accountId: string) {
    if (!currentWorkspace?.id) return
    const cur = new Set(member.allowedAdAccountIds ?? [])
    if (cur.has(accountId)) cur.delete(accountId)
    else cur.add(accountId)
    const next = Array.from(cur)
    setMembers((prev) => prev.map((m) => m.userId === member.userId ? { ...m, allowedAdAccountIds: next } : m))
    try {
      await team.updateMemberAdAccounts({ workspaceId: currentWorkspace.id, memberUserId: member.userId, allowedAdAccountIds: next })
    } catch { await load() }
  }

  const isOwner = (m: MemberRow) =>
    currentWorkspace && (user?.id === currentWorkspace.userId || members.find((x) => x.userId === user?.id)?.role === 'owner')

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
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
                  aria-label="Edit workspace name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="text-xs text-text-tertiary">
                {loading
                  ? 'Loading…'
                  : members.length === 0
                  ? 'No members yet'
                  : `${members.length} member${members.length !== 1 ? 's' : ''}`}
                {pending.length > 0 && ` · ${pending.length} pending`}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            type="button"
            className="gap-1.5 shadow-sm"
            onClick={openInvite}
            disabled={!currentWorkspace?.id}
          >
            <Plus className="h-4 w-4" />
            {t('workspaceSettings.team.invite', 'Invite member')}
          </Button>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-4 border-t border-red-200/50 bg-red-50/80 px-6 py-3 dark:border-red-800/30 dark:bg-red-950/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
      </Card>

      {/* ── Member cards ── */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : members.length === 0 && !error ? (
        <Card className="py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lime/15">
            <Users className="h-8 w-8 text-brand-mid" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-text-primary">No team members yet</h3>
          <p className="mt-1.5 mx-auto max-w-xs text-sm text-text-tertiary">
            Invite teammates to collaborate on your ad campaigns.
          </p>
          <Button size="sm" className="mx-auto mt-5 gap-1.5" onClick={openInvite} disabled={!currentWorkspace?.id}>
            <Plus className="h-4 w-4" />
            Invite member
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const isYou = user?.id === m.userId
            const name  = m.user?.name || m.user?.email || m.userId.slice(0, 8)
            const email = m.user?.email ?? '—'
            const init  = (name.charAt(0) || '?').toUpperCase()
            const color = avatarColor(m.userId)
            const rc    = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.advertiser
            const adCnt = m.allowedAdAccountIds?.length ?? 0
            const joined = relativeDate(m.createdAt)
            const canManage = !isYou && isOwner(m)

            return (
              <div
                key={m.userId}
                className="group relative rounded-2xl border border-border/60 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:border-brand-mid/30 hover:shadow-md dark:bg-slate-900/60"
              >
                {/* Remove button — top right, visible on hover */}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'remove', member: m })}
                    className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-500 group-hover:flex dark:hover:bg-red-900/20"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold ${color}`}>
                    {init}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-text-primary">{name}</span>
                      {isYou && (
                        <span className="shrink-0 rounded-full bg-brand-lime/20 px-2 py-0.5 text-[10px] font-semibold text-brand-ink dark:text-brand-lime">
                          you
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-text-tertiary">
                      {joined && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Joined {joined}
                        </span>
                      )}
                      {adCnt > 0 && (
                        <span>{adCnt} ad account{adCnt !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Role dropdown */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenRole(openRole === m.userId ? null : m.userId)}
                      className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-surface-2"
                      aria-label="Change role"
                    >
                      <Badge variant={rc.variant} size="sm" dot>
                        {t(`workspaceSettings.team.role.${m.role}`, rc.label)}
                      </Badge>
                      <ChevronDown className="h-3 w-3 text-text-tertiary" />
                    </button>

                    {openRole === m.userId && (
                      <div className="absolute right-0 top-9 z-20 min-w-[148px] overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:bg-slate-900">
                        {(['owner', 'admin', 'advertiser'] as const).map((r) => {
                          const rr = ROLE_CONFIG[r]
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => requestRoleChange(m, r)}
                              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2 ${m.role === r ? 'font-semibold text-brand-mid' : 'text-text-secondary'}`}
                            >
                              {rr.icon}
                              {t(`workspaceSettings.team.role.${r}`, rr.label)}
                              {m.role === r && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-mid" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad account access toggles */}
                {adAccounts.length > 0 && (
                  <div className="mt-4 border-t border-border/50 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                      Ad account access
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {adAccounts.map((acc) => {
                        const active = (m.allowedAdAccountIds ?? []).includes(acc.id)
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => void toggleAccount(m, acc.id)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                              active
                                ? 'border-brand-mid/40 bg-brand-lime/15 text-brand-ink dark:border-brand-mid/60 dark:text-brand-lime'
                                : 'border-border bg-surface text-text-tertiary hover:border-brand-mid/25 hover:bg-surface-2'
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

      {/* Click‑outside for role dropdown */}
      {openRole && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenRole(null)} aria-hidden />
      )}

      {/* ── Pending invites ── */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Pending invites ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/50 bg-amber-50/50 px-4 py-3 dark:border-amber-700/25 dark:bg-amber-950/15"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/40 bg-amber-100/50 dark:border-amber-700/35 dark:bg-amber-900/25">
                    <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.email}</p>
                    <p className="text-[11px] capitalize text-text-tertiary">
                      {p.role}
                      {p.createdAt && ` · sent ${relativeDate(p.createdAt)}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void revoke(p.id)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite dialog ── */}
      {inviteOpen && (
        <Dialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          title="Invite team members"
          className="max-w-md"
        >
          <p className="mt-1 text-sm text-text-tertiary">
            Enter one or more email addresses. Press <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">Enter</kbd> or <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono">,</kbd> after each.
          </p>

          <label className="mt-5 block text-xs font-medium text-text-secondary">
            Email addresses
          </label>
          <EmailTagInput
            tags={inviteEmails}
            onChange={setInviteEmails}
            placeholder="colleague@company.com"
          />

          <label className="mt-4 block text-xs font-medium text-text-secondary">Role</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(['advertiser', 'admin'] as const).map((r) => {
              const rc = ROLE_CONFIG[r]
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteRole(r)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all ${
                    inviteRole === r
                      ? 'border-brand-mid/50 bg-brand-lime/10 font-semibold text-brand-ink dark:text-brand-lime'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  {rc.icon}
                  {rc.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-text-tertiary">
            {inviteRole === 'admin'
              ? 'Admins can manage campaigns, ad accounts, and invite advertisers.'
              : 'Advertisers can view and manage campaigns on their assigned ad accounts.'}
          </p>

          {inviteErr && <p className="mt-3 text-sm text-red-500">{inviteErr}</p>}

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              {inviteEmails.length > 0
                ? `${inviteEmails.length} email${inviteEmails.length !== 1 ? 's' : ''} added`
                : 'No emails yet'}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                type="button"
                loading={inviteBusy}
                disabled={inviteEmails.length === 0}
                onClick={() => void sendInvite()}
              >
                Send {inviteEmails.length > 1 ? `${inviteEmails.length} invites` : 'invite'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── Confirm dialog ── */}
      {confirm && (
        <ConfirmDialog
          action={confirm}
          busy={confirmBusy}
          onConfirm={() => void handleConfirm()}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
