'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { UserPlus, Shield, ClipboardCopy, Check } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui'
import { Alert } from '@/components/ui'
import { team } from '@/lib/api-client'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useI18n } from '@/i18n/use-i18n'

type MemberRow = {
  userId: string
  role: 'owner' | 'admin' | 'advertiser'
  user?: { id: string; email: string; name: string | null } | null
}

type PendingInvite = { id: string; email: string; role: string; status: string }

type ActivityRow = { id: string; actorName: string; message: string; createdAt: string }

type PendingAppr = {
  id: string
  campaignId: string
  campaignName: string
  requestedBy: string
  createdAt: string
}

function roleBadge(role: string) {
  if (role === 'owner') return { label: 'Owner', className: 'bg-amber-500/15 text-amber-800 dark:text-amber-200' }
  if (role === 'admin') return { label: 'Admin', className: 'bg-violet-500/15 text-violet-800 dark:text-violet-200' }
  return { label: 'Editor', className: 'bg-sky-500/15 text-sky-800 dark:text-sky-200' }
}

export default function TeamPage() {
  const { t } = useI18n()
  const { currentWorkspace, user } = useWorkspaceStore()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [pending, setPending] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'advertiser'>('advertiser')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [approvals, setApprovals] = useState<PendingAppr[]>([])

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
      const [a, p] = await Promise.all([
        fetch(`/api/team/collab/activity?workspaceId=${encodeURIComponent(currentWorkspace.id)}`).then((r) => r.json()),
        fetch(`/api/team/collab/approvals?workspaceId=${encodeURIComponent(currentWorkspace.id)}`).then((r) => r.json()),
      ])
      setActivity((a as { activity?: ActivityRow[] }).activity ?? [])
      setApprovals((p as { pending?: PendingAppr[] }).pending ?? [])
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Yuklanmadi')
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
    setInviteLink('')
    setError('')
    try {
      const res = await team.createInvites({
        workspaceId: currentWorkspace.id,
        emails: [inviteEmail.trim()],
        role: inviteRole,
      })
      const data = res.data as { invites?: Array<{ token: string }> }
      const tok = data.invites?.[0]?.token
      if (tok && typeof window !== 'undefined') {
        setInviteLink(`${window.location.origin}/invite/${tok}`)
      }
      setInviteEmail('')
      await load()
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Taklif yuborilmadi')
    } finally {
      setInviteBusy(false)
    }
  }

  async function resolveAppr(id: string, approved: boolean) {
    if (!currentWorkspace?.id) return
    try {
      await fetch('/api/team/collab/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          workspaceId: currentWorkspace.id,
          actorName: user?.name ?? user?.email ?? 'Owner',
          approved,
        }),
      })
      await load()
    } catch {
      /* noop */
    }
  }

  async function copyInvite() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-sm text-text-secondary">
        {t('team.needWorkspace', 'Workspace tanlang.')}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 space-y-6">
      <PageHeader
        title={t('team.title', 'Jamoa')}
        subtitle={t(
          'team.subtitle',
          'Rollar: Owner, Admin, Editor (targetolog). Taklif havolasi, izohlar, activity, tasdiq.',
        )}
        actions={
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/settings/workspace/team">{t('team.legacySettings', 'Workspace team (detal)')}</Link>
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card className="p-5 border-border/80">
        <h2 className="text-sm font-semibold text-text-primary mb-3">{t('team.rolesTitle', 'Rollar (O‘zbekiston jamoasi)')}</h2>
        <ul className="text-sm text-text-secondary space-y-2 list-disc pl-5">
          <li>
            <strong className="text-text-primary">Owner</strong> — hamma narsa, billing.
          </li>
          <li>
            <strong className="text-text-primary">Admin</strong> — kampaniya + jamoa; billing ko‘radi, o‘zgartirmaydi.
          </li>
          <li>
            <strong className="text-text-primary">Editor</strong> — kampaniya yaratish/tahrirlash; billing yo‘q.
          </li>
          <li>
            <strong className="text-text-primary">Viewer</strong> — faqat ko‘rish (keyingi API versiyasi; hozir Editor bilan cheklangan).
          </li>
        </ul>
      </Card>

      <Card className="p-5 border-border/80">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-violet-500" />
          <h2 className="text-base font-semibold text-text-primary">{t('team.inviteTitle', 'Taklif')}</h2>
        </div>
        <p className="text-xs text-text-tertiary mb-3">
          {t('team.inviteHint', "Email yuboriladi; qo'shimcha: 1 click — havolani nusxalang.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <Input
            type="email"
            placeholder="email@company.uz"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="rounded-xl flex-1"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'advertiser')}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="advertiser">{t('team.roleEditor', 'Editor (targetolog)')}</option>
            <option value="admin">{t('team.roleAdmin', 'Admin')}</option>
          </select>
          <Button className="rounded-xl shrink-0" loading={inviteBusy} onClick={() => void sendInvite()}>
            {t('team.sendInvite', 'Yuborish')}
          </Button>
        </div>
        {inviteLink ? (
          <div className="mt-4 rounded-xl border border-border bg-surface-2/60 p-3">
            <p className="text-xs text-text-tertiary mb-1">{t('team.inviteLink', 'Havola (1 click join)')}</p>
            <div className="flex items-center gap-2">
              <code className="text-[11px] text-text-secondary break-all flex-1">{inviteLink}</code>
              <Button type="button" size="sm" variant="secondary" className="shrink-0 rounded-lg gap-1" onClick={() => void copyInvite()}>
                <ClipboardCopy className="h-3.5 w-3.5" />
                {copied ? <Check className="h-3.5 w-3.5" /> : null}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {approvals.length > 0 && (
        <Card className="p-5 border-amber-500/25 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-semibold text-text-primary">{t('team.approvalsTitle', 'Tasdiq kutilmoqda')}</h2>
          </div>
          <ul className="space-y-3">
            {approvals.map((p) => (
              <li key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-text-primary">{p.campaignName}</p>
                  <p className="text-xs text-text-tertiary">
                    {p.requestedBy} · {new Date(p.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-lg" onClick={() => void resolveAppr(p.id, true)}>
                    {t('team.approve', 'Tasdiqlash')}
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-red-500" onClick={() => void resolveAppr(p.id, false)}>
                    {t('team.reject', 'Rad')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5 border-border/80">
        <h2 className="text-base font-semibold text-text-primary mb-3">
          {t('team.membersTitle', 'A‘zolar')} ({loading ? '…' : members.length})
        </h2>
        {loading ? (
          <p className="text-sm text-text-tertiary">{t('team.loading', 'Yuklanmoqda…')}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {members.map((m) => {
              const badge = roleBadge(m.role)
              const name = m.user?.name || m.user?.email || m.userId.slice(0, 8)
              return (
                <li key={m.userId} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{name}</p>
                    <p className="text-xs text-text-tertiary">{m.user?.email ?? '—'}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
                </li>
              )
            })}
          </ul>
        )}
        {pending.length > 0 ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-semibold text-text-tertiary mb-2">{t('team.pendingInvites', 'Kutilayotgan takliflar')}</p>
            <ul className="text-sm space-y-1">
              {pending.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.email}</span>
                  <span className="text-text-tertiary">{p.role}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="p-5 border-border/80">
        <h2 className="text-base font-semibold text-text-primary mb-3">{t('team.activityTitle', 'Activity log')}</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          {activity.map((a) => (
            <li key={a.id}>
              <span className="font-medium text-text-primary">{a.actorName}</span> — {a.message}{' '}
              <span className="text-text-tertiary text-xs">({new Date(a.createdAt).toLocaleString('uz-UZ')})</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-text-tertiary mt-3">
          {t('team.activityNote', "Kampaniya sahifasida har kampaniya uchun «Izohlar» paneli — real-time (poll).")}
        </p>
      </Card>
    </div>
  )
}
