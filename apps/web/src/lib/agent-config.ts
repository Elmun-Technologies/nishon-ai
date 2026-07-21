/**
 * Persistence + mapping helpers for the autonomous AI agent's plan.
 *
 * Kept separate from the React setup card so the pure logic (localStorage
 * caching, backend-row → frontend-shape mapping) is unit-testable without
 * pulling in the component tree.
 *
 * The plan is the source of truth on the backend (agent_configs); localStorage
 * is only a fast client-side cache so the dashboard renders the "agent active"
 * state instantly on repeat visits.
 */
import { normalizeGoal, type AgentGoal } from '@/lib/funnel-allocator'

export const STOP_LOSS_DEFAULT_USD = 30

export interface AgentConfig {
  link: string
  goal: AgentGoal
  budget: number
  stopLossUsd: number
  activatedAt: string
}

function configKey(workspaceId: string) {
  return `nishon.agentConfig.${workspaceId}`
}

/** Read the cached agent config for a workspace, or null if none/invalid. */
export function loadAgentConfig(
  workspaceId: string | undefined,
): AgentConfig | null {
  if (!workspaceId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(configKey(workspaceId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AgentConfig
    return { ...parsed, goal: normalizeGoal(parsed.goal) }
  } catch {
    return null
  }
}

/** Cache an agent config in localStorage (best-effort; ignores quota errors). */
export function saveAgentConfigLocal(
  workspaceId: string | undefined,
  config: AgentConfig,
): void {
  if (!workspaceId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(configKey(workspaceId), JSON.stringify(config))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * Map a persisted backend agent config row to the frontend AgentConfig shape.
 * Returns null for a missing/empty row (workspace never activated the agent).
 * Pure so it can be unit-tested.
 */
export function agentConfigFromApi(raw: unknown): AgentConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  // A row that was never activated has no activatedAt — treat as not set up.
  if (!r.activatedAt) return null
  const budget = Number(r.budget)
  const stopLoss = Number(r.stopLossUsd)
  return {
    link: typeof r.link === 'string' ? r.link : '',
    goal: normalizeGoal(typeof r.goal === 'string' ? r.goal : undefined),
    budget: Number.isFinite(budget) && budget > 0 ? budget : 0,
    stopLossUsd:
      Number.isFinite(stopLoss) && stopLoss > 0 ? stopLoss : STOP_LOSS_DEFAULT_USD,
    activatedAt: String(r.activatedAt),
  }
}
