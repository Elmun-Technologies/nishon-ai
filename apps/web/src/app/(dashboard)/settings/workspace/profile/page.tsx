'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, PageHeader } from '@/components/ui'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { auth, workspaces } from '@/lib/api-client'

export default function WorkspaceUserProfilePage() {
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
      })
      setEditUserOpen(false)
      setNote('User profile saqlandi.')
    } catch (e: any) {
      setNote(e?.message ?? 'Saqlashda xato')
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
      setNote('Workspace sozlamalari saqlandi.')
    } catch (e: any) {
      setNote(e?.message ?? 'Workspace saqlanmadi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle={currentWorkspace?.name ?? 'Workspace profile'}
      />
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xl font-bold text-text-secondary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{user?.name ?? '—'}</h2>
              <p className="text-sm text-text-tertiary">User ID: {user?.id?.slice(0, 8) ?? '—'}…</p>
              <p className="mt-2 text-sm text-text-secondary">Shaxsiy email: {user?.email ?? '—'}</p>
              <p className="mt-1 text-sm text-text-secondary">Phone: {workspaceForm.supportPhone || currentWorkspace?.targetAudience || '—'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" type="button" onClick={() => setEditUserOpen(true)}>
              Edit User Info
            </Button>
            <Button size="sm" type="button" onClick={() => setWorkspaceModalOpen(true)}>
              Set up workspace
            </Button>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2"
            >
              Klassik settings
            </Link>
          </div>
        </div>
        <p className="mt-4 text-sm text-text-tertiary">Bu bo‘lim endi user profil va workspace setup modalini qo‘llaydi.</p>
        {note && <p className="mt-3 text-sm text-emerald-300">{note}</p>}
      </Card>

      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} title="Edit User Info" className="max-w-md">
        <div className="mt-2 space-y-3">
          <Input label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} />
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

      <Dialog open={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} title="Set up your workspace" className="max-w-lg">
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Input
            label="Workspace name"
            value={workspaceForm.name}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Business type (Brand / Agency)"
            value={workspaceForm.businessType}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, businessType: e.target.value }))}
          />
          <Input
            label="Support phone"
            value={workspaceForm.supportPhone}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, supportPhone: e.target.value }))}
          />
          <Input
            label="Support email"
            value={workspaceForm.supportEmail}
            onChange={(e) => setWorkspaceForm((p) => ({ ...p, supportEmail: e.target.value }))}
          />
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          Eslatma: hozir backendda business type -> `industry`, support phone -> `targetAudience` maydoniga saqlanadi.
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
