import type {
  OptimizationAction,
  ScoredAction,
  RuleAnalysisResult,
} from './types/optimization.types';

/**
 * Scores and ranks optimization actions by expected impact.
 *
 * Score (0–100) = weighted sum of:
 *   - Priority weight  (40 pts)  — how urgent is this action
 *   - Confidence       (35 pts)  — how certain are we it will help
 *   - Effort weight    (25 pts)  — inverse of effort (low effort = higher score)
 *
 * Actions are returned sorted highest score first.
 * All pure functions — no side effects, no DI.
 */
export function scoreAndRankActions(
  actions: OptimizationAction[],
  ruleAnalysis: RuleAnalysisResult,
): ScoredAction[] {
  const scored = actions.map(action => scoreAction(action, ruleAnalysis));
  return scored.sort((a, b) => b.score - a.score);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreAction(
  action: OptimizationAction,
  ruleAnalysis: RuleAnalysisResult,
): ScoredAction {
  const priorityScore   = priorityWeight(action.priority)   * 40;
  const confidenceScore = computeConfidence(action, ruleAnalysis) * 35;
  const effortLevel     = computeEffort(action.type);
  const effortScore     = effortInverseWeight(effortLevel)  * 25;

  const score = Math.min(100, Math.round(priorityScore + confidenceScore + effortScore));

  return {
    action,
    score,
    confidence: computeConfidence(action, ruleAnalysis),
    effortLevel,
  };
}

// ─── Priority weight (0–1) ────────────────────────────────────────────────────

function priorityWeight(priority: OptimizationAction['priority']): number {
  switch (priority) {
    case 'critical': return 1.00;
    case 'high':     return 0.75;
    case 'medium':   return 0.50;
    case 'low':      return 0.25;
  }
}

// ─── Confidence (0–1) ─────────────────────────────────────────────────────────
// Combination of rule engine's data confidence and whether this specific
// target was flagged by the deterministic rule engine (corroborated = higher).

function computeConfidence(
  action: OptimizationAction,
  ruleAnalysis: RuleAnalysisResult,
): number {
  const base = ruleAnalysis.confidence;  // 0.30 / 0.60 / 0.90 from data volume

  // Corroboration bonus: if the rule engine also flagged this target, we're more confident
  const corroborated = ruleAnalysis.problems.some(p => p.targetId === action.targetId);
  const bonus = corroborated ? 0.10 : 0;

  // Winners get a confidence boost on scale/duplicate actions
  const isWinnerAction = ['increase_budget', 'duplicate_winner', 'shift_budget'].includes(action.type);
  const isWinner       = ruleAnalysis.winners.includes(action.targetId);
  const winnerBonus    = isWinnerAction && isWinner ? 0.08 : 0;

  return Math.min(1.0, base + bonus + winnerBonus);
}

// ─── Effort level ─────────────────────────────────────────────────────────────

function computeEffort(type: OptimizationAction['type']): 'low' | 'medium' | 'high' {
  const lowEffort: OptimizationAction['type'][] = [
    'flag_fatigue', 'rotate_creative', 'pause_creative', 'pause_adset',
    'increase_budget', 'decrease_budget',
  ];
  const mediumEffort: OptimizationAction['type'][] = [
    'shift_budget', 'rewrite_headline', 'rewrite_primary_text', 'refresh_creative',
    'duplicate_winner',
  ];

  if (lowEffort.includes(type))    return 'low';
  if (mediumEffort.includes(type)) return 'medium';
  return 'high';  // generate_video_script, test_new_angle, broaden_audience, etc.
}

function effortInverseWeight(effort: 'low' | 'medium' | 'high'): number {
  switch (effort) {
    case 'low':    return 1.00;  // easy win — boost score
    case 'medium': return 0.65;
    case 'high':   return 0.30;  // high effort actions score lower unless priority is critical
  }
}
