/**
 * Jamoaviy izohlar, activity log, tasdiq (MVP — server xotira). Production: DB + WebSocket.
 */

export interface TeamComment {
  id: string
  workspaceId: string
  campaignId: string
  body: string
  authorName: string
  createdAt: string
}

export interface TeamActivity {
  id: string
  workspaceId: string
  actorName: string
  message: string
  createdAt: string
}

export interface PendingApproval {
  id: string
  workspaceId: string
  campaignId: string
  campaignName: string
  requestedBy: string
  createdAt: string
}

const comments: TeamComment[] = []
const activities: TeamActivity[] = []
const approvals: PendingApproval[] = []

const MAX = 400

export function appendComment(input: {
  workspaceId: string
  campaignId: string
  body: string
  authorName: string
}): TeamComment {
  const c: TeamComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    workspaceId: input.workspaceId,
    campaignId: input.campaignId,
    body: input.body.slice(0, 2000),
    authorName: input.authorName.slice(0, 120),
    createdAt: new Date().toISOString(),
  }
  comments.unshift(c)
  if (comments.length > MAX) comments.length = MAX
  return c
}

export function listComments(workspaceId: string, campaignId: string, limit = 80) {
  return comments.filter((c) => c.workspaceId === workspaceId && c.campaignId === campaignId).slice(0, limit)
}

export function appendActivity(workspaceId: string, actorName: string, message: string): TeamActivity {
  const a: TeamActivity = {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    workspaceId,
    actorName: actorName.slice(0, 120),
    message: message.slice(0, 500),
    createdAt: new Date().toISOString(),
  }
  activities.unshift(a)
  if (activities.length > MAX) activities.length = MAX
  return a
}

export function listActivity(workspaceId: string, limit = 40) {
  return activities.filter((a) => a.workspaceId === workspaceId).slice(0, limit)
}

export function requestApproval(input: {
  workspaceId: string
  campaignId: string
  campaignName: string
  requestedBy: string
}): PendingApproval {
  const dup = approvals.find(
    (p) => p.workspaceId === input.workspaceId && p.campaignId === input.campaignId,
  )
  if (dup) return dup
  const p: PendingApproval = {
    id: `ap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    workspaceId: input.workspaceId,
    campaignId: input.campaignId,
    campaignName: input.campaignName.slice(0, 200),
    requestedBy: input.requestedBy.slice(0, 120),
    createdAt: new Date().toISOString(),
  }
  approvals.unshift(p)
  if (approvals.length > 200) approvals.length = 200
  appendActivity(input.workspaceId, input.requestedBy, `Kampaniya tasdiqqa yuborildi: ${input.campaignName}`)
  return p
}

export function listPendingApprovals(workspaceId: string) {
  return approvals.filter((p) => p.workspaceId === workspaceId)
}

export function resolveApproval(id: string, workspaceId: string, actorName: string, approved: boolean): boolean {
  const i = approvals.findIndex((p) => p.id === id && p.workspaceId === workspaceId)
  if (i < 0) return false
  const [row] = approvals.splice(i, 1)
  appendActivity(
    workspaceId,
    actorName,
    approved ? `Tasdiqladi: ${row.campaignName}` : `Rad etdi: ${row.campaignName}`,
  )
  return true
}

/** Birinchi ochilganda — faqat shu kampaniya uchun namuna izohlar. */
export function seedCampaignCommentsIfEmpty(workspaceId: string, campaignId: string) {
  if (comments.some((c) => c.workspaceId === workspaceId && c.campaignId === campaignId)) return
  appendComment({
    workspaceId,
    campaignId,
    body: 'CTR past — yangi sarlavha sinab ko‘ramiz.',
    authorName: 'Dilnoza',
  })
  appendComment({
    workspaceId,
    campaignId,
    body: 'Yangi kreativ yukladim — 3-variant A/B.',
    authorName: 'Sardor',
  })
}

export function seedWorkspaceActivityIfEmpty(workspaceId: string) {
  if (activities.some((a) => a.workspaceId === workspaceId)) return
  appendActivity(workspaceId, 'Aziz', 'Budget oshirdi — IG-1')
}
