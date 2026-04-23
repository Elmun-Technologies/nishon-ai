'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { auth, workspaces } from '@/lib/api-client'
import { useI18n } from '@/i18n/use-i18n'
import { useToast } from '@/components/ui/Toaster'
import { User, Building2, Globe } from 'lucide-react'

export default function WorkspaceUserProfilePage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const { user, currentWorkspace, setUser, setCurrentWorkspace } = useWorkspaceStore()
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    document.title = 'User Profile — Workspace settings | AdSpectr'
  }, [])
  const [userForm, setUserForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [workspaceForm, setWorkspaceForm] = useState({
    name: currentWorkspace?.name ?? '',
    businessType: currentWorkspace?.industry ?? 'Brand',
    supportPhone: '',
    supportEmail: user?.email ?? '',
  })

  const phoneDisplay = workspaceForm.supportPhone || currentWorkspace?.targetAudience || ''

  async function saveUser() {
    setSaving(true)
    setNote('')
    try {
      const { data } = await auth.updateMe(userForm)
      setUser({
        id: (data as any).id ?? user?.id ?? '',
        name: (data as any).name ?? userForm.name,
        email: (data as any).email ?? userForm.email,
        plan: (data as any).plan ?? user?.plan ?? 'free',
        trialEndsAt: (data as any).trialEndsAt ?? user?.trialEndsAt ?? null,
        isAdmin: (data as any).isAdmin ?? user?.isAdmin ?? false,
      })
      setEditUserOpen(false)
      setNote(t('workspaceSettings.profile.savedProfile', 'Profile saved.'))
      toast(t('workspaceSettings.profile.savedProfile', 'Profile saved.'))
    } catch (e: any) {
      setNote(e?.message ?? 'Error')
      toast(e?.message ?? 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function saveWorkspace() {
    if (!currentWorkspace?.id) return
    setSaving(true)
    setNote('')
    try {
      const { data } = await workspaces.update(currentWorkspace.id, {
        name: workspaceForm.name,
        industry: workspaceForm.businessType,
        targetAudience: workspaceForm.supportPhone || null,
      })
      setCurrentWorkspace({ ...(currentWorkspace as any), ...(data as any), name: workspaceForm.name, industry: workspaceForm.businessType })
      setWorkspaceModalOpen(false)
      setNote(t('workspaceSettings.profile.savedWorkspace', 'Workspace settings saved.'))
      toast(t('workspaceSettings.profile.savedWorkspace', 'Workspace settings saved.'))
    } catch (e: any) {
      setNote(e?.message ?? 'Error')
      toast(e?.message ?? 'Failed to save workspace', 'error')
    } finally {
      setSaving(false)
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="space-y-6">
      {/* User profile card */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
            <User className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {t('workspaceSettings.profile.editModalTitle', 'User profile')}
            </h2>
            <p className="mt-0.5 text-xs text-text-tertiary">
              {t('workspaceSettings.profile.helpText', 'Update your identity and workspace basics. Changes sync to your account when you save.')}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-brand-lime/30 bg-brand-lime/10 text-2xl font-bold text-brand-ink dark:text-brand-lime">
            {initial}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-text-primary">{user?.name ?? '—'}</h3>
            <p className="mt-0.5 font-mono text-xs text-text-tertiary">
              {t('workspaceSettings.profile.userId', 'ID')}: {user?.id ?? '—'}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                  {t('workspaceSettings.profile.personalEmail', 'Personal email')}
                </p>
                <div className="mt-1.5 rounded-xl border border-border/70 bg-surface-2/30 px-3 py-2.5 text-sm text-text-primary">
                  {user?.email ?? '—'}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                  {t('workspaceSettings.profile.phone', 'Phone number')}
                </p>
                <div className="mt-1.5 rounded-xl border border-border/70 bg-surface-2/30 px-3 py-2.5 text-sm text-text-primary">
                  {phoneDisplay || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {note && <p className="mt-4 rounded-xl border border-brand-lime/20 bg-brand-lime/10 px-3 py-2.5 text-sm font-medium text-brand-ink dark:text-brand-lime">{note}</p>}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-5">
          <Button
            size="sm"
            variant="secondary"
            type="button"
            onClick={() => setEditUserOpen(true)}
          >
            {t('workspaceSettings.profile.editUserInfo', 'Edit user info')}
          </Button>
          <Button size="sm" type="button" onClick={() => setWorkspaceModalOpen(true)}>
            {t('workspaceSettings.profile.setupWorkspace', 'Set up workspace')}
          </Button>
        </div>
      </section>

      {/* Language link */}
      <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/15 text-brand-mid dark:text-brand-lime">
            <Globe className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {t('workspaceSettings.profile.languageSettingsLink', 'Interface language settings')}
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">Change the display language for this account.</p>
          </div>
          <Link
            href="/settings/workspace/language"
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary"
          >
            Open →
          </Link>
        </div>
      </section>

      {/* Edit user dialog */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} title={t('workspaceSettings.profile.editModalTitle', 'Edit user info')} className="max-w-md">
        <div className="mt-4 space-y-3">
          <Input label={t('workspaceSettings.profile.name', 'Name')} value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label={t('workspaceSettings.profile.email', 'Email')} value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => setEditUserOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void saveUser()}>{t('common.save', 'Save')}</Button>
        </div>
      </Dialog>

      {/* Workspace setup dialog */}
      <Dialog open={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} title={t('workspaceSettings.profile.workspaceModalTitle', 'Set up your workspace')} className="max-w-lg">
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label={t('workspaceSettings.profile.workspaceName', 'Workspace name')} value={workspaceForm.name} onChange={(e) => setWorkspaceForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label={t('workspaceSettings.profile.businessType', 'Business type')} value={workspaceForm.businessType} onChange={(e) => setWorkspaceForm((p) => ({ ...p, businessType: e.target.value }))} placeholder="Brand / Agency" />
          <Input label={t('workspaceSettings.profile.supportPhone', 'Support phone')} value={workspaceForm.supportPhone} onChange={(e) => setWorkspaceForm((p) => ({ ...p, supportPhone: e.target.value }))} />
          <Input label={t('workspaceSettings.profile.supportEmail', 'Support email')} value={workspaceForm.supportEmail} onChange={(e) => setWorkspaceForm((p) => ({ ...p, supportEmail: e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => setWorkspaceModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void saveWorkspace()}>{t('common.save', 'Save')}</Button>
        </div>
      </Dialog>
    </div>
  )
}
