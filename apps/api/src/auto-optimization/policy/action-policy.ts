import type { ActionType, OptimizationAction, OptimizationConstraints } from '../types/optimization.types';

// ─── Governance types ─────────────────────────────────────────────────────────

export type GovernanceDecision = 'AUTO_APPLY_ALLOWED' | 'APPROVAL_REQUIRED' | 'BLOCKED';

export interface GovernedAction {
  action: OptimizationAction;
  governance: GovernanceDecision;
  governanceReason: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface GovernanceSummary {
  total: number;
  autoApply: number;
  approvalRequired: number;
  blocked: number;
}

// ─── Workspace policy ─────────────────────────────────────────────────────────

/**
 * Per-workspace safety configuration.
 * Controls what the auto-apply mode is allowed to do.
 * When not provided, SAFE_DEFAULTS are used — the system does nothing without approval.
 */
export interface WorkspacePolicy {
  /** Allow any automatic budget mutation. Default: false */
  allowAutoBudgetChange: boolean;
  /** Max % budget change allowed automatically (0 = no auto changes). Default: 0 */
  maxAutoBudgetChangePct: number;
  /** Allow auto-generating creative refresh suggestions. Default: true (content only) */
  allowAutoCreativeRefresh: boolean;
  /** Allow auto-pausing individual creatives. Default: false */
  allowAutoPauseCreative: boolean;
  /** Allow audience targeting changes automatically. Default: false */
  allowAudienceChanges: boolean;
  /** Campaign IDs that must never be auto-acted on */
  protectedCampaignIds: string[];
  /** AdSet IDs that must never be auto-acted on */
  protectedAdSetIds: string[];
}

/**
 * Conservative defaults — system does nothing dangerous without explicit approval.
 * Applied whenever a workspace has no custom policy configured.
 */
export const SAFE_DEFAULTS: WorkspacePolicy = {
  allowAutoBudgetChange:     false,
  maxAutoBudgetChangePct:    0,
  allowAutoCreativeRefresh:  true,   // safe — generates content, no platform mutation
  allowAutoPauseCreative:    false,
  allowAudienceChanges:      false,
  protectedCampaignIds:      [],
  protectedAdSetIds:         [],
};

// ─── Risk matrix ──────────────────────────────────────────────────────────────

/**
 * Deterministic base risk per action type.
 * This is policy-independent — it reflects inherent danger of each action type.
 */
export const ACTION_RISK: Record<ActionType, 'low' | 'medium' | 'high'> = {
  // Content generation — never mutates ad platform state
  flag_fatigue:          'low',
  rotate_creative:       'low',
  rewrite_headline:      'low',
  rewrite_primary_text:  'low',
  generate_video_script: 'low',
  test_new_angle:        'low',
  refresh_creative:      'low',
  // Platform changes — moderate impact, reversible
  duplicate_winner:      'medium',
  shift_budget:          'medium',
  narrow_audience:       'medium',
  broaden_audience:      'medium',
  // Platform changes — high impact, hard to reverse
  pause_creative:        'high',
  pause_adset:           'high',
  increase_budget:       'high',
  decrease_budget:       'high',
};

// ─── Core governance function ─────────────────────────────────────────────────

/**
 * Classify a single proposed action into AUTO_APPLY_ALLOWED, APPROVAL_REQUIRED, or BLOCKED.
 *
 * Decision logic (in order):
 *   1. Protected ID check → BLOCKED immediately
 *   2. Base risk from risk matrix
 *   3. Policy overrides (workspace-specific permissions)
 *   4. Mode-independent classification (high-risk always requires approval)
 */
export function governAction(
  action: OptimizationAction,
  policy: WorkspacePolicy,
  constraints?: OptimizationConstraints,
): GovernedAction {
  const riskLevel = ACTION_RISK[action.type] ?? 'high';

  // ── 1. Protected ID check ──────────────────────────────────────────────────
  if (policy.protectedCampaignIds.includes(action.targetId) ||
      policy.protectedAdSetIds.includes(action.targetId)) {
    return {
      action,
      governance: 'BLOCKED',
      governanceReason: `Target ID "${action.targetId}" is in the protected list — no automated actions allowed.`,
      riskLevel,
    };
  }

  if (constraints?.doNotPause?.includes(action.targetId) &&
      (action.type === 'pause_creative' || action.type === 'pause_adset')) {
    return {
      action,
      governance: 'BLOCKED',
      governanceReason: `Target ID "${action.targetId}" is in the doNotPause constraint list.`,
      riskLevel,
    };
  }

  // ── 2. High-risk actions — always require approval ─────────────────────────
  if (riskLevel === 'high') {
    if (action.type === 'pause_creative' && policy.allowAutoPauseCreative) {
      // Exception: workspace explicitly opted in to auto-pause creatives
      return approved(action, riskLevel, 'Workspace policy allows automatic creative pausing.');
    }

    if ((action.type === 'increase_budget' || action.type === 'decrease_budget') &&
        policy.allowAutoBudgetChange &&
        policy.maxAutoBudgetChangePct > 0) {
      return approved(action, riskLevel,
        `Workspace policy allows automatic budget changes up to ${policy.maxAutoBudgetChangePct}%.`);
    }

    return requireApproval(action, riskLevel, highRiskReason(action.type));
  }

  // ── 3. Medium-risk actions ─────────────────────────────────────────────────
  if (riskLevel === 'medium') {
    if ((action.type === 'broaden_audience' || action.type === 'narrow_audience') &&
        !policy.allowAudienceChanges) {
      return requireApproval(action, riskLevel,
        'Audience changes require approval — enable allowAudienceChanges in workspace policy to auto-apply.');
    }

    if ((action.type === 'shift_budget' || action.type === 'duplicate_winner') &&
        !policy.allowAutoBudgetChange) {
      return requireApproval(action, riskLevel,
        'Budget reallocation requires approval — enable allowAutoBudgetChange in workspace policy.');
    }

    // Medium risk allowed if no specific constraint applies
    return approved(action, riskLevel, 'Medium-risk action — within policy limits.');
  }

  // ── 4. Low-risk actions — auto-apply by default ───────────────────────────
  if (action.type === 'refresh_creative' || action.type === 'rotate_creative' ||
      action.type === 'rewrite_headline' || action.type === 'rewrite_primary_text' ||
      action.type === 'generate_video_script') {
    if (!policy.allowAutoCreativeRefresh) {
      return requireApproval(action, riskLevel,
        'Creative refresh actions require approval — enable allowAutoCreativeRefresh in workspace policy.');
    }
  }

  return approved(action, riskLevel, 'Low-risk content action — auto-apply permitted.');
}

/**
 * Apply governance to a list of actions.
 * Returns governed actions + a summary.
 */
export function governActions(
  actions: OptimizationAction[],
  policy: WorkspacePolicy,
  constraints?: OptimizationConstraints,
): { governed: GovernedAction[]; summary: GovernanceSummary } {
  const governed = actions.map(a => governAction(a, policy, constraints));

  const summary: GovernanceSummary = {
    total:            governed.length,
    autoApply:        governed.filter(g => g.governance === 'AUTO_APPLY_ALLOWED').length,
    approvalRequired: governed.filter(g => g.governance === 'APPROVAL_REQUIRED').length,
    blocked:          governed.filter(g => g.governance === 'BLOCKED').length,
  };

  return { governed, summary };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function approved(action: OptimizationAction, riskLevel: 'low' | 'medium' | 'high', reason: string): GovernedAction {
  return { action, governance: 'AUTO_APPLY_ALLOWED', governanceReason: reason, riskLevel };
}

function requireApproval(action: OptimizationAction, riskLevel: 'low' | 'medium' | 'high', reason: string): GovernedAction {
  return { action, governance: 'APPROVAL_REQUIRED', governanceReason: reason, riskLevel };
}

function highRiskReason(type: ActionType): string {
  const reasons: Partial<Record<ActionType, string>> = {
    pause_creative:   'Pausing a creative directly affects running campaigns — human review required.',
    pause_adset:      'Pausing an ad set stops delivery and may impact revenue — human review required.',
    increase_budget:  'Automatic budget increases require explicit approval to prevent overspend.',
    decrease_budget:  'Budget reductions may hurt campaign performance — human review required.',
  };
  return reasons[type] ?? 'High-risk action — human approval required by default policy.';
}
