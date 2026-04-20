'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { auth, workspaces } from '@/lib/api-client'
import { useI18n } from '@/i18n/use-i18n'

export default function WorkspaceUserProfilePage() {
  const { t } = useI18n()
  const { user, currentWorkspace, setUser, setCurrentWorkspace } = useWorkspaceStore()
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [userForm, setUserForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  })
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
    } catch (e: any) {
      setNote(e?.message ?? 'Error')
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
      setCurrentWorkspace({
        ...(currentWorkspace as any),
        ...(data as any),
        name: workspaceForm.name,
        industry: workspaceForm.businessType,
      })
      setWorkspaceModalOpen(false)
      setNote(t('workspaceSettings.profile.savedWorkspace', 'Workspace settings saved.'))
    } catch (e: any) {
      setNote(e?.message ?? 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-border/70 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-blue-500/10 text-xl font-bold text-violet-700 dark:text-violet-200">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">{user?.name ?? '—'}</h2>
              <p className="mt-1 text-sm text-text-tertiary">
                {t('workspaceSettings.profile.userId', 'User ID')}:{' '}
                <span className="font-mono text-text-secondary">{user?.id ?? '—'}</span>
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    {t('workspaceSettings.profile.personalEmail', 'Personal email')}
                  </label>
                  <div className="mt-1.5 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-sm text-text-primary">
                    {user?.email ?? '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    {t('workspaceSettings.profile.phone', 'Phone number')}
                  </label>
                  <div className="mt-1.5 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-sm text-text-primary">
                    {phoneDisplay || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button
              size="sm"
              variant="secondary"
              type="button"
              className="border-violet-500/40 text-violet-700 dark:text-violet-200"
              onClick={() => setEditUserOpen(true)}
            >
              {t('workspaceSettings.profile.editUserInfo', 'Edit user info')}
            </Button>
            <Button size="sm" type="button" onClick={() => setWorkspaceModalOpen(true)}>
              {t('workspaceSettings.profile.setupWorkspace', 'Set up workspace')}
            </Button>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
            >
              {t('workspaceSettings.profile.classicSettings', 'Classic settings')}
            </Link>
          </div>
        </div>
        <p className="mt-6 border-t border-border/70 pt-4 text-sm text-text-tertiary">
          {t(
            'workspaceSettings.profile.helpText',
            'Update your identity and workspace basics. Changes sync to your account when you save.',
          )}
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/settings/workspace/language"
            className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
          >
            {t('workspaceSettings.profile.languageSettingsLink', 'Interface language settings →')}
          </Link>
        </p>
        {note && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{note}</p>}
      </Card>

      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} title={t('workspaceSettings.profile.editModalTitle', 'Edit user info')} className="max-w-md">
        <div className="mt-2 space-y-3">
          <Input
            label={t('workspaceSettings.profile.name', 'Name')}
            value={userForm.name}
            onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label={t('workspaceSettings.profile.email', 'Email')}
            value={userForm.email}
            onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => setEditUserOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void saveUser()}>
            Save
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        title={t('workspaceSettings.profile.workspaceModalTitle', 'Set up your workspace')}
        className="max-w-lg"
      >
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Input
            label={t('workspaceSettings.profile.workspaceName', 'Workspace name')}
            value={workspaceForm.name}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label={t('workspaceSettings.profile.businessType', 'Business type (Brand / Agency)')}
            value={workspaceForm.businessType}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, businessType: e.target.value }))}
          />
          <Input
            label={t('workspaceSettings.profile.supportPhone', 'Support phone')}
            value={workspaceForm.supportPhone}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, supportPhone: e.target.value }))}
          />
          <Input
            label={t('workspaceSettings.profile.supportEmail', 'Support email')}
            value={workspaceForm.supportEmail}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, supportEmail: e.target.value }))}
          />
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          {t(
            'workspaceSettings.profile.workspaceModalNote',
            'Business type maps to industry; support phone maps to target audience in the API.',
          )}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => setWorkspaceModalOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" type="button" loading={saving} onClick={() => void saveWorkspace()}>
            Save
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
