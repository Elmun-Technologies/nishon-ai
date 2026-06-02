import { aiAgent, aiDecisions } from '@/lib/api-client'
import type {
  AgentAction,
  AgentRecommendation,
  ApprovalStatus,
  MyAgent,
} from './mock-data'

/** Raw AiDecision shape from the backend (apps/api/src/ai-decisions/entities/ai-decision.entity.ts). */
export interface ApiAiDecision {
  id: string
  actionType:
    | 'pause_ad'
    | 'scale_budget'
    | 'stop_campaign'
    | 'create_ad'
    | 'shift_budget'
    | 'generate_strategy'
    | 'adjust_targeting'
    | 'rotate_creative'
    | null
  reason: string
  beforeState: Record<string, any> | null
  afterState: Record<string, any> | null
  estimatedImpact: string | null
  isApproved: boolean | null
  isExecuted: boolean
  createdAt: string
  workspaceId: string | null
  campaignId: string | null
}

/** Map backend actionType enum to frontend AgentAction. */
const ACTION_MAP: Record<NonNullable<ApiAiDecision['actionType']>, AgentAction> = {
  pause_ad: 'pause_ad',
  scale_budget: 'budget_increase',
  stop_campaign: 'pause_ad',
  create_ad: 'launch_ad',
  shift_budget: 'reallocate',
  generate_strategy: 'reallocate',
  adjust_targeting: 'reallocate',
  rotate_creative: 'creative_swap',
}

/**
 * Virtual agent assignment: each backend decision is attributed to one of the
 * three Platform Agents based on its actionType. This is purely a UI grouping —
 * the backend has a single optimizer producing decisions.
 */
type AgentRole = 'media_buyer' | 'creative' | 'analyst'

function classifyAgent(actionType: ApiAiDecision['actionType']): AgentRole {
  switch (actionType) {
    case 'rotate_creative':
    case 'create_ad':
      return 'creative'
    case 'generate_strategy':
    case 'adjust_targeting':
      return 'analyst'
    default:
      return 'media_buyer'
  }
}

const AGENT_PROFILES: Record<
  AgentRole,
  { name: string; emoji: string; accent: string; description: string }
> = {
  media_buyer: {
    name: 'Media Buyer Pro',
    emoji: '📊',
    accent: '#0284c7',
    description: 'Byudjet, pacing, scaling — bu agent boshqaradi',
  },
  creative: {
    name: 'Creative Studio AI',
    emoji: '🎨',
    accent: '#db2777',
    description: 'Kreativlar va A/B test — bu agent boshqaradi',
  },
  analyst: {
    name: 'Analyst Bot',
    emoji: '🔍',
    accent: '#7c3aed',
    description: 'Strategiya va targeting — bu agent boshqaradi',
  },
}

/** Build a friendlier title from the decision's actionType + reason. */
function decisionTitle(d: ApiAiDecision): string {
  const action = d.actionType
  const reasonHead = d.reason ? d.reason.split(/[.\n]/)[0] : ''
  if (reasonHead) return reasonHead
  switch (action) {
    case 'pause_ad':
      return 'Reklamani to\'xtatish'
    case 'scale_budget':
      return 'Byudjetni oshirish'
    case 'stop_campaign':
      return 'Kampaniyani to\'xtatish'
    case 'create_ad':
      return 'Yangi reklama yaratish'
    case 'shift_budget':
      return 'Byudjetni qayta taqsim'
    case 'generate_strategy':
      return 'Yangi strategiya'
    case 'adjust_targeting':
      return 'Targeting o\'zgartirish'
    case 'rotate_creative':
      return 'Kreativ almashtirish'
    default:
      return 'AI tavsiya'
  }
}

/** Estimate impact in USD from the estimatedImpact text or beforeState. */
function decisionImpactUsd(d: ApiAiDecision): number {
  const txt = d.estimatedImpact ?? ''
  const match = txt.match(/\$?\s*(\d+(?:\.\d+)?)/)
  if (match) return Math.round(Number(match[1]))
  return 0
}

/** Stub confidence — backend doesn't yet expose this. */
function decisionConfidence(d: ApiAiDecision): number {
  if (d.isApproved === true && d.isExecuted) return 0.95
  if (d.actionType === 'pause_ad' || d.actionType === 'stop_campaign') return 0.85
  if (d.actionType === 'scale_budget') return 0.9
  return 0.8
}

function approvalStatus(d: ApiAiDecision): ApprovalStatus {
  if (d.isApproved === true && d.isExecuted) return 'approved'
  if (d.isApproved === true) return 'auto_approved'
  if (d.isApproved === false) return 'rejected'
  return 'pending'
}

function mapDecisionToRecommendation(d: ApiAiDecision, agentRole: AgentRole): AgentRecommendation {
  const profile = AGENT_PROFILES[agentRole]
  return {
    id: d.id,
    agentId: agentRole,
    agentName: profile.name,
    action: d.actionType ? ACTION_MAP[d.actionType] ?? 'reallocate' : 'reallocate',
    title: decisionTitle(d),
    rationale: d.reason || 'AI tavsiya',
    confidence: decisionConfidence(d),
    estimatedImpactUsd: decisionImpactUsd(d),
    campaignName: d.campaignId ? `Kampaniya ${d.campaignId.slice(0, 8)}` : 'Umumiy',
    createdAt: d.createdAt,
    approvalStatus: approvalStatus(d),
  }
}

/**
 * Group decisions into three virtual Platform Agents and return MyAgent[] for the UI.
 * Each agent's stats (impact, recommendationsCount, etc.) are aggregated from decisions
 * that match its role.
 */
export function buildAgentsFromDecisions(decisions: ApiAiDecision[]): MyAgent[] {
  const byRole: Record<AgentRole, ApiAiDecision[]> = {
    media_buyer: [],
    creative: [],
    analyst: [],
  }
  for (const d of decisions) {
    byRole[classifyAgent(d.actionType)].push(d)
  }

  return (Object.keys(byRole) as AgentRole[]).map((role) => {
    const profile = AGENT_PROFILES[role]
    const list = byRole[role]
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const startedAt = sorted.length > 0 ? sorted[sorted.length - 1].createdAt : new Date().toISOString()
    const approvedCount = list.filter((d) => d.isApproved === true).length
    const impactUsd = list
      .filter((d) => d.isApproved === true)
      .reduce((sum, d) => sum + decisionImpactUsd(d), 0)

    return {
      id: role,
      name: profile.name,
      role: role,
      vertical: 'ecommerce',
      status: list.length > 0 ? 'active' : 'paused',
      source: 'platform',
      startedAt,
      recommendationsCount: list.length,
      approvedCount,
      impactUsd,
      autoApprove: role === 'analyst',
      emoji: profile.emoji,
      accent: profile.accent,
      recent: sorted.slice(0, 10).map((d) => mapDecisionToRecommendation(d, role)),
    }
  })
}

/** Fetch decisions for a workspace and map them to the UI agents model. */
export async function fetchAgentsForWorkspace(workspaceId: string): Promise<MyAgent[]> {
  const res = await aiDecisions.list(workspaceId)
  const decisions = ((res.data ?? []) as ApiAiDecision[])
  return buildAgentsFromDecisions(decisions)
}

/**
 * Approve a pending recommendation. Routes through `/ai-agent/decisions/:id/approve`,
 * which actually EXECUTES the action on the connected platform (via the
 * decision loop → connector), not just `/ai-decisions/:id/approve` which only
 * flips the DB flag. The human click is the approval gate; execution only
 * happens for decisions tied to a real campaign + connected account.
 */
export async function approveRecommendation(id: string): Promise<void> {
  await aiAgent.approveDecision(id)
}

/** Reject a pending recommendation (no execution). */
export async function rejectRecommendation(id: string): Promise<void> {
  await aiAgent.rejectDecision(id)
}

/** Trigger a new optimization loop — AI re-analyzes the workspace and produces new decisions. */
export async function triggerOptimization(workspaceId: string): Promise<void> {
  await aiAgent.optimize(workspaceId)
}
