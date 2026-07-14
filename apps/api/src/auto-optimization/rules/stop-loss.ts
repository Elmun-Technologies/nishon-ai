import type {
  DetectedProblem,
  OptimizationAction,
} from "../types/optimization.types";

/** The rule-engine problem type emitted by the 24h Hard Stop-Loss checks. */
export const HARD_STOP_LOSS_PROBLEM = "hard_stop_loss_no_result";

/**
 * Turn Hard Stop-Loss detections into concrete pause actions.
 *
 * - An ad set → `pause_adset` (stops the whole group's delivery)
 * - An ad     → `pause_creative`
 *
 * These are high-risk by nature; they only auto-apply when the workspace has
 * opted in via `allowAutoStopLossPause` (see action-policy.ts). Otherwise they
 * surface as approval-required, exactly like any other pause.
 *
 * Pure and deterministic so it can be unit-tested in isolation.
 */
export function buildStopLossActions(
  problems: DetectedProblem[],
): OptimizationAction[] {
  return problems
    .filter((p) => p.type === HARD_STOP_LOSS_PROBLEM)
    .map((p) => ({
      type: p.targetType === "adset" ? "pause_adset" : "pause_creative",
      targetId: p.targetId,
      targetType: p.targetType,
      reason: p.message,
      expectedImpact: "Stop wasted spend immediately (Hard Stop-Loss).",
      priority: "critical",
      risk: "high",
      autoApplicable: true,
    }));
}
