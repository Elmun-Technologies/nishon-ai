'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Folder, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { Button, Alert, Card, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

type CreativeProject = { id: string; name: string; updatedAt: number }

function storageKey(workspaceId: string) {
  return `adspectr-creative-projects-${workspaceId}`
}

function loadProjects(workspaceId: string): CreativeProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (p): p is CreativeProject =>
          p &&
          typeof p === 'object' &&
          typeof (p as CreativeProject).id === 'string' &&
          typeof (p as CreativeProject).name === 'string' &&
          typeof (p as CreativeProject).updatedAt === 'number',
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export default function CreativeProjectsPage() {
  const { t, language } = useI18n()
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [projects, setProjects] = useState<CreativeProject[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    if (!workspaceId) {
      setProjects([])
      return
    }
    setProjects(loadProjects(workspaceId))
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId || projects.length === 0) return
    try {
      localStorage.setItem(storageKey(workspaceId), JSON.stringify(projects))
    } catch {
      /* quota */
    }
  }, [workspaceId, projects])

  const localeTag = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const formatUpdated = useCallback(
    (ts: number) =>
      new Date(ts).toLocaleString(localeTag, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [localeTag],
  )

  const addProject = () => {
    const trimmed = name.trim()
    if (!trimmed || !workspaceId) return
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`
    setProjects((prev) => [{ id, name: trimmed, updatedAt: Date.now() }, ...prev])
    setName('')
  }

  const removeProject = (id: string) => {
    if (!window.confirm(t('creativeProjectsPage.deleteConfirm', 'Delete this project? This cannot be undone.'))) {
      return
    }
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (workspaceId && next.length === 0) {
        try {
          localStorage.removeItem(storageKey(workspaceId))
        } catch {
          /* ignore */
        }
      }
      return next
    })
  }

  const hero = (
    <section
      className={cn(
        'rounded-3xl border border-border/80 bg-gradient-to-br p-5 shadow-sm md:p-6',
        'from-white via-surface to-surface-2/95',
        'dark:from-[#1e3310] dark:via-brand-ink dark:to-[#152508]',
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md ring-1',
              'bg-gradient-to-br from-brand-mid to-brand-lime ring-brand-ink/10',
            )}
          >
            <Folder className="h-7 w-7 text-brand-ink" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-[1.75rem]">
              {t('navigation.projects', 'Projects')}
            </h1>
            <p className="mt-1.5 max-w-2xl text-body-sm text-text-secondary md:text-body">
              {t(
                'creativeProjectsPage.subtitle',
                'Group image, video, and UGC experiments per brand or campaign. Stored in this browser for the current workspace until cloud sync ships.',
              )}
            </p>
          </div>
        </div>
        <Link
          href="/creative-hub"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-border px-4 py-2 text-sm font-medium',
            'bg-white/80 text-text-primary transition-all hover:bg-white active:scale-95 md:self-center',
            'dark:bg-slate-900/70 dark:hover:bg-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          )}
        >
          {t('creativeProjectsPage.openCreativeHub', 'Open Creative Hub')}
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>
    </section>
  )

  if (!workspaceId) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
        {hero}
        <Alert variant="warning">{t('creativeProjectsPage.noWorkspace', 'Select or create a workspace to manage creative projects.')}</Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
      {hero}

      <Alert variant="info">{t('creativeProjectsPage.syncNotice', '')}</Alert>

      <Card padding="md" className="border-border/80 shadow-sm">
        <h2 className="mb-4 text-heading font-semibold text-text-primary">
          {t('creativeProjectsPage.newProject', 'New project')}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              label={t('creativeProjectsPage.projectName', 'Project name')}
              placeholder={t('creativeProjectsPage.projectNamePlaceholder', 'e.g., Spring launch / Client Acme')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addProject()
                }
              }}
            />
          </div>
          <Button type="button" className="h-10 gap-2 rounded-2xl sm:h-[42px]" onClick={addProject} disabled={!name.trim()}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('creativeProjectsPage.createProject', 'Create project')}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-heading font-semibold text-text-primary">
          {t('creativeProjectsPage.yourProjects', 'Your projects')}
        </h2>

        {projects.length === 0 ? (
          <Card
            padding="lg"
            className="border-dashed border-border/90 bg-surface-2/40 text-center dark:bg-surface-2/20"
          >
            <Folder className="mx-auto mb-3 h-10 w-10 text-brand-mid opacity-80 dark:text-brand-lime" aria-hidden />
            <p className="font-semibold text-text-primary">{t('creativeProjectsPage.emptyTitle', 'No projects yet')}</p>
            <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">
              {t(
                'creativeProjectsPage.emptyHint',
                'Create a project to track a creative line, seasonal push, or client folder — then build assets in Creative Hub.',
              )}
            </p>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Card
                  padding="md"
                  className="flex h-full flex-col justify-between gap-3 border-border/80 transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">{p.name}</p>
                    <p className="mt-1 text-caption text-text-tertiary">
                      {t('creativeProjectsPage.updated', 'Updated')} · {formatUpdated(p.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/creative-hub"
                      className={cn(
                        'inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-xs font-medium',
                        'bg-white/80 text-text-primary hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900',
                      )}
                    >
                      {t('creativeProjectsPage.openCreativeHub', 'Open Creative Hub')}
                    </Link>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={() => removeProject(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t('creativeProjectsPage.delete', 'Delete')}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
