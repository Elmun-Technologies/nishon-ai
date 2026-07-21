import {
  allocateFunnelBudget,
  normalizeGoal,
  type FunnelAllocation,
} from "@adspectr/shared";

/**
 * The funnel allocator is the media plan the backend paces the AI agent against.
 * These tests lock the two invariants that matter for correctness: exact
 * integer reconciliation (no dollars lost to rounding) and the goal-specific
 * stage split.
 */
describe("funnel-allocator (shared)", () => {
  const sumChannels = (a: FunnelAllocation) =>
    a.byChannel.reduce((s, c) => s + c.amount, 0);
  const sumStages = (a: FunnelAllocation) =>
    a.stages.reduce((s, st) => s + st.amount, 0);

  it("reconciles stage + channel amounts exactly to the total (sales)", () => {
    const a = allocateFunnelBudget({ goal: "sales", totalBudget: 2000 });
    expect(sumStages(a)).toBe(2000);
    expect(sumChannels(a)).toBe(2000);
  });

  it("reconciles exactly even with rounding-hostile budgets", () => {
    for (const totalBudget of [1, 7, 33, 101, 999, 1234, 9973]) {
      const a = allocateFunnelBudget({ goal: "sales", totalBudget });
      expect(sumStages(a)).toBe(totalBudget);
      expect(sumChannels(a)).toBe(totalBudget);
    }
  });

  it("applies the sales stage split 30/40/30", () => {
    const a = allocateFunnelBudget({ goal: "sales", totalBudget: 1000 });
    const byStage = Object.fromEntries(
      a.stages.map((s) => [s.stage, s.amount]),
    );
    expect(byStage.TOFU).toBe(300);
    expect(byStage.MOFU).toBe(400);
    expect(byStage.BOFU).toBe(300);
  });

  it("applies the brand stage split 60/30/10 with brand channels", () => {
    const a = allocateFunnelBudget({ goal: "brand", totalBudget: 1000 });
    const byStage = Object.fromEntries(
      a.stages.map((s) => [s.stage, s.amount]),
    );
    expect(byStage.TOFU).toBe(600);
    expect(byStage.MOFU).toBe(300);
    expect(byStage.BOFU).toBe(100);
    const channels = a.byChannel.map((c) => c.channel).sort();
    expect(channels).toEqual(
      ["influencers", "meta", "search", "telegram", "youtube"].sort(),
    );
  });

  it("splits a stage evenly across its channels", () => {
    const a = allocateFunnelBudget({ goal: "sales", totalBudget: 1000 });
    const tofu = a.stages.find((s) => s.stage === "TOFU")!;
    // TOFU = $300 across meta + tiktok → 150 / 150
    expect(tofu.channels.map((c) => c.amount)).toEqual([150, 150]);
  });

  it("returns all-zero amounts for a zero budget without throwing", () => {
    const a = allocateFunnelBudget({ goal: "sales", totalBudget: 0 });
    expect(sumStages(a)).toBe(0);
    expect(sumChannels(a)).toBe(0);
  });

  it("normalizes legacy / unknown goals", () => {
    expect(normalizeGoal("awareness")).toBe("brand");
    expect(normalizeGoal("brand")).toBe("brand");
    expect(normalizeGoal("sales")).toBe("sales");
    expect(normalizeGoal(undefined)).toBe("sales");
    expect(normalizeGoal("nonsense")).toBe("sales");
  });
});
