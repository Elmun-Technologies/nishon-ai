import { governAction, SAFE_DEFAULTS, WorkspacePolicy } from "./action-policy";
import type { OptimizationAction } from "../types/optimization.types";

function pauseAdset(
  overrides: Partial<OptimizationAction> = {},
): OptimizationAction {
  return {
    type: "pause_adset",
    targetId: "adset-loser-1",
    targetType: "adset",
    reason: "Spent $40 with 0 conversions",
    expectedImpact: "Stop the bleed",
    priority: "critical",
    risk: "high",
    autoApplicable: false,
    ...overrides,
  };
}

describe("action-policy — Hard Stop-Loss", () => {
  it("requires approval to pause an ad set under SAFE_DEFAULTS", () => {
    const res = governAction(pauseAdset(), SAFE_DEFAULTS);
    expect(res.governance).toBe("APPROVAL_REQUIRED");
  });

  it("auto-applies a stop-loss pause when the workspace opts in", () => {
    const policy: WorkspacePolicy = {
      ...SAFE_DEFAULTS,
      allowAutoStopLossPause: true,
    };
    const res = governAction(pauseAdset(), policy);
    expect(res.governance).toBe("AUTO_APPLY_ALLOWED");
    expect(res.governanceReason).toContain("stop-loss");
  });

  it("still blocks a stop-loss pause for a protected/doNotPause target", () => {
    const policy: WorkspacePolicy = {
      ...SAFE_DEFAULTS,
      allowAutoStopLossPause: true,
    };
    const res = governAction(pauseAdset({ targetId: "adset-vip" }), policy, {
      doNotPause: ["adset-vip"],
    } as never);
    expect(res.governance).toBe("BLOCKED");
  });

  it("also covers creative pauses under stop-loss opt-in", () => {
    const policy: WorkspacePolicy = {
      ...SAFE_DEFAULTS,
      allowAutoStopLossPause: true,
    };
    const res = governAction(
      pauseAdset({ type: "pause_creative", targetType: "ad" }),
      policy,
    );
    expect(res.governance).toBe("AUTO_APPLY_ALLOWED");
  });
});
