/**
 * Creative Hub loyihalari — brauzer localStorage (cloud sync keyin).
 * Ad Library import ham shu kalit orqali loyiha qo‘shadi.
 */

export type CreativeProject = { id: string; name: string; updatedAt: number }

export function creativeProjectsStorageKey(workspaceId: string) {
  return `adspectr-creative-projects-${workspaceId}`
}

export function creativeImportDraftKey(workspaceId: string, projectId: string) {
  return `adspectr-creative-import-${workspaceId}-${projectId}`
}

export type CreativeImportDraft = {
  headline: string
  primaryText: string
  imageUrl?: string
  referenceAd: string
  savedAt: number
}

export function loadCreativeProjects(workspaceId: string): CreativeProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(creativeProjectsStorageKey(workspaceId))
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

export function writeCreativeProjects(workspaceId: string, projects: CreativeProject[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(creativeProjectsStorageKey(workspaceId), JSON.stringify(projects.slice(0, 200)))
  } catch {
    /* quota */
  }
}

export function appendCreativeProject(workspaceId: string, project: CreativeProject): void {
  const prev = loadCreativeProjects(workspaceId)
  const next = [{ ...project }, ...prev.filter((p) => p.id !== project.id)].slice(0, 200)
  writeCreativeProjects(workspaceId, next)
}

export function saveCreativeImportDraft(workspaceId: string, projectId: string, draft: Omit<CreativeImportDraft, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const payload: CreativeImportDraft = { ...draft, savedAt: Date.now() }
    localStorage.setItem(creativeImportDraftKey(workspaceId, projectId), JSON.stringify(payload))
  } catch {
    /* quota */
  }
}
