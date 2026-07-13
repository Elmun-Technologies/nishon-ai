import { runRulesEngine } from "./rules-engine";
import { buildStopLossActions, HARD_STOP_LOSS_PROBLEM } from "./stop-loss";
import { governAction, SAFE_DEFAULTS } from "../policy/action-policy";
import type {
  AdPerformance,
  AdSetPerformance,
  CampaignPerformance,
} from "../types/optimization.types";

function ad(overrides: Partial<AdPerformance> = {}): AdPerformance {
  return {
    adId: "ad-1",
    adName: "Cold video 1",
    impressions: 1200,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    cpm: 5,
    spend: 20,
    conversions: 0,
    cpa: null,
    roas: 0,
    frequency: 1.2,
    ageHours: 26,
    ...overrides,
  };
}

function campaignWith(
  adOverrides: Partial<AdPerformance>,
): CampaignPerformance {
  const theAd = ad(adOverrides);
  const adSet: AdSetPerformance = {
    adSetId: "adset-1",
    adSetName: "Cold — UZ 18-34",
    impressions: theAd.impressions,
    clicks: theAd.clicks,
    ctr: theAd.ctr,
    cpc: theAd.cpc,
    spend: theAd.spend,
    conversions: theAd.conversions,
    cpa: theAd.cpa,
    roas: theAd.roas,
    ageHours: 0, // keep adset-level rule quiet; assert on the ad
    ads: [theAd],
  };
  return {
    campaignId: "camp-1",
    campaignName: "Sales — Q3",
    platform: "meta",
    objective: "conversions",
    impressions: adSet.impressions,
    clicks: adSet.clicks,
    ctr: adSet.ctr,
    cpc: adSet.cpc,
    spend: adSet.spend,
    conversions: adSet.conversions,
    cpa: adSet.cpa,
    roas: adSet.roas,
    dailyBudget: 50,
    adSets: [adSet],
  };
}

function stopLossProblems(campaign: CampaignPerformance) {
  return runRulesEngine(campaign).problems.filter(
    (p) => p.type === HARD_STOP_LOSS_PROBLEM,
  );
}

describe("Hard Stop-Loss detection (24h window)", () => {
  it("fires after 24h with spend and zero results", () => {
    const problems = stopLossProblems(
      campaignWith({ ageHours: 26, spend: 20 }),
    );
    expect(problems).toHaveLength(1);
    expect(problems[0].targetId).toBe("ad-1");
    expect(problems[0].severity).toBe("critical");
  });

  it("does NOT fire before the 24h window", () => {
    expect(stopLossProblems(campaignWith({ ageHours: 10 }))).toHaveLength(0);
  });

  it("does NOT fire when ad age is unknown", () => {
    expect(
      stopLossProblems(campaignWith({ ageHours: undefined })),
    ).toHaveLength(0);
  });

  it("does NOT fire when there is at least one click", () => {
    expect(
      stopLossProblems(campaignWith({ clicks: 3, ctr: 0.4 })),
    ).toHaveLength(0);
  });

  it("does NOT fire when there is at least one conversion", () => {
    expect(stopLossProblems(campaignWith({ conversions: 1 }))).toHaveLength(0);
  });

  it("does NOT fire below the minimum spend", () => {
    expect(stopLossProblems(campaignWith({ spend: 5 }))).toHaveLength(0);
  });

  it("respects a custom window/min-spend override", () => {
    const campaign = campaignWith({ ageHours: 13, spend: 8 });
    const problems = runRulesEngine(campaign, undefined, {
      stopLossWindowHours: 12,
      stopLossMinSpendUsd: 5,
    }).problems.filter((p) => p.type === HARD_STOP_LOSS_PROBLEM);
    expect(problems).toHaveLength(1);
  });
});

describe("buildStopLossActions", () => {
  it("maps an ad detection to a pause_creative action", () => {
    const problems = stopLossProblems(campaignWith({}));
    const actions = buildStopLossActions(problems);
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe("pause_creative");
    expect(actions[0].targetId).toBe("ad-1");
    expect(actions[0].risk).toBe("high");
  });

  it("maps an ad-set detection to a pause_adset action", () => {
    const actions = buildStopLossActions([
      {
        type: HARD_STOP_LOSS_PROBLEM,
        targetId: "adset-9",
        targetType: "adset",
        severity: "critical",
        value: 30,
        threshold: 15,
        message: "…",
      },
    ]);
    expect(actions[0].type).toBe("pause_adset");
    expect(actions[0].targetId).toBe("adset-9");
  });

  it("ignores non-stop-loss problems", () => {
    expect(
      buildStopLossActions([
        {
          type: "low_ctr",
          targetId: "ad-x",
          targetType: "ad",
          severity: "warning",
          value: 0.4,
          threshold: 0.8,
          message: "…",
        },
      ]),
    ).toHaveLength(0);
  });
});

describe("Hard Stop-Loss end-to-end governance", () => {
  it("requires approval by default but auto-applies when opted in", () => {
    const [action] = buildStopLossActions(stopLossProblems(campaignWith({})));

    const gated = governAction(action, SAFE_DEFAULTS);
    expect(gated.governance).toBe("APPROVAL_REQUIRED");

    const optedIn = governAction(action, {
      ...SAFE_DEFAULTS,
      allowAutoStopLossPause: true,
    });
    expect(optedIn.governance).toBe("AUTO_APPLY_ALLOWED");
  });
});
