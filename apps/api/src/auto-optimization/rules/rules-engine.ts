import type {
  CampaignPerformance,
  AdSetPerformance,
  AdPerformance,
  OptimizationGoal,
  DetectedProblem,
  Opportunity,
  RuleAnalysisResult,
} from '../types/optimization.types';

// ─── Thresholds ───────────────────────────────────────────────────────────────
// These are sensible defaults for CIS markets (Meta/TikTok). Caller can
// override via goal.targetCpa / goal.targetRoas / goal.targetCtr.

const THRESHOLDS = {
  ctr: {
    critical: 0.3,   // below 0.3% — critically low
    warning:  0.8,   // below 0.8% — worth investigating
  },
  frequency: {
    critical: 4.5,   // showing same ad 4.5+ times → severe fatigue
    warning:  3.0,   // 3x is an early warning for most formats
  },
  roas: {
    critical: 1.0,   // below 1 → spending more than earning
    warning:  1.8,   // below 1.8 → margin is thin
  },
  hookRate: {
    critical: 15,    // below 15% → almost no one stops to watch
    warning:  25,    // below 25% → hook needs work
  },
  wastedSpend: {
    minSpend: 30,    // flag ad with $30+ spend and 0 conversions
  },
  budgetConcentration: {
    threshold: 0.80, // one adset eating >80% of budget
  },
  scaleOpportunity: {
    minRoas:    4.0, // ROAS above 4x → strong scale candidate
    maxSpendPct: 0.2, // but spending <20% of campaign budget
  },
  minimumImpressions: {
    insufficient: 500,
    limited: 2000,
  },
} as const;

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Runs all deterministic rule checks against the campaign data.
 * Returns a structured analysis result. No AI calls, no side effects.
 */
export function runRulesEngine(
  campaign: CampaignPerformance,
  goal?: OptimizationGoal,
): RuleAnalysisResult {
  const problems: DetectedProblem[]  = [];
  const opportunities: Opportunity[] = [];

  const allAds     = campaign.adSets.flatMap(s => s.ads);
  const totalAds   = allAds.length;

  // ── Campaign-level rules ──────────────────────────────────────────────────

  checkRoas(campaign.roas, campaign.campaignId, 'campaign', problems, goal?.targetRoas);
  checkCtr(campaign.ctr, campaign.campaignId, 'campaign', problems, goal?.targetCtr);

  // ── AdSet-level rules ─────────────────────────────────────────────────────

  for (const adSet of campaign.adSets) {
    checkBudgetConcentration(adSet, campaign, opportunities);
    checkAdSetRoas(adSet, problems, goal?.targetRoas);
  }

  // ── Ad-level rules ────────────────────────────────────────────────────────

  const adRoasValues = allAds.map(a => a.roas).filter(r => r > 0);
  const avgRoas      = adRoasValues.length
    ? adRoasValues.reduce((s, r) => s + r, 0) / adRoasValues.length
    : 0;

  for (const ad of allAds) {
    checkFrequency(ad, problems);
    checkHookRate(ad, problems);
    checkWastedSpend(ad, problems, goal?.targetCpa);
    checkAdCtr(ad, problems, goal?.targetCtr);
    checkScaleOpportunity(ad, campaign, avgRoas, opportunities);
  }

  // ── Winners & losers ──────────────────────────────────────────────────────

  const sortedByRoas = [...allAds].sort((a, b) => b.roas - a.roas);
  const winners = sortedByRoas
    .filter(a => a.roas >= (goal?.targetRoas ?? THRESHOLDS.roas.warning) && a.impressions > 200)
    .slice(0, 3)
    .map(a => a.adId);

  const losers = sortedByRoas
    .filter(a => a.impressions > THRESHOLDS.minimumImpressions.insufficient)
    .filter(a => a.roas < THRESHOLDS.roas.critical || a.ctr < THRESHOLDS.ctr.critical)
    .slice(-3)
    .map(a => a.adId);

  return {
    problems,
    opportunities,
    winners,
    losers,
    confidence: computeConfidence(campaign),
    dataQuality: computeDataQuality(campaign),
  };
}

// ─── Individual rule checks ───────────────────────────────────────────────────

function checkRoas(
  roas: number,
  targetId: string,
  targetType: 'ad' | 'adset' | 'campaign',
  problems: DetectedProblem[],
  targetRoas?: number,
): void {
  const roasWarning  = targetRoas ?? THRESHOLDS.roas.warning;
  const roasCritical = THRESHOLDS.roas.critical;

  if (roas < roasCritical) {
    problems.push({
      type: 'negative_roas',
      targetId, targetType,
      severity: 'critical',
      value: roas, threshold: roasCritical,
      message: `ROAS is ${roas}x — spending more than earning. Immediate review needed.`,
    });
  } else if (roas < roasWarning) {
    problems.push({
      type: 'low_roas',
      targetId, targetType,
      severity: 'warning',
      value: roas, threshold: roasWarning,
      message: `ROAS is ${roas}x (target: ${roasWarning}x). Campaign is not profitable at scale.`,
    });
  }
}

function checkAdSetRoas(
  adSet: AdSetPerformance,
  problems: DetectedProblem[],
  targetRoas?: number,
): void {
  if (adSet.impressions < THRESHOLDS.minimumImpressions.insufficient) return;
  checkRoas(adSet.roas, adSet.adSetId, 'adset', problems, targetRoas);
}

function checkCtr(
  ctr: number,
  targetId: string,
  targetType: 'ad' | 'adset' | 'campaign',
  problems: DetectedProblem[],
  targetCtr?: number,
): void {
  const warning  = targetCtr ?? THRESHOLDS.ctr.warning;
  const critical = THRESHOLDS.ctr.critical;

  if (ctr < critical) {
    problems.push({
      type: 'critically_low_ctr',
      targetId, targetType,
      severity: 'critical',
      value: ctr, threshold: critical,
      message: `CTR is ${ctr}% — almost no one is clicking. Creative may be completely off-target.`,
    });
  } else if (ctr < warning) {
    problems.push({
      type: 'low_ctr',
      targetId, targetType,
      severity: 'warning',
      value: ctr, threshold: warning,
      message: `CTR is ${ctr}% — below the ${warning}% benchmark. Hook or offer may need rework.`,
    });
  }
}

function checkAdCtr(
  ad: AdPerformance,
  problems: DetectedProblem[],
  targetCtr?: number,
): void {
  if (ad.impressions < 500) return;  // not enough data
  checkCtr(ad.ctr, ad.adId, 'ad', problems, targetCtr);
}

function checkFrequency(ad: AdPerformance, problems: DetectedProblem[]): void {
  if (ad.impressions < 1000) return;  // frequency is unreliable at low volume

  if (ad.frequency >= THRESHOLDS.frequency.critical) {
    problems.push({
      type: 'severe_creative_fatigue',
      targetId: ad.adId, targetType: 'ad',
      severity: 'critical',
      value: ad.frequency, threshold: THRESHOLDS.frequency.critical,
      message: `Frequency is ${ad.frequency}x — audience is severely fatigued. Rotate or pause immediately.`,
    });
  } else if (ad.frequency >= THRESHOLDS.frequency.warning) {
    problems.push({
      type: 'creative_fatigue',
      targetId: ad.adId, targetType: 'ad',
      severity: 'warning',
      value: ad.frequency, threshold: THRESHOLDS.frequency.warning,
      message: `Frequency is ${ad.frequency}x — early fatigue detected. Plan creative refresh soon.`,
    });
  }
}

function checkHookRate(ad: AdPerformance, problems: DetectedProblem[]): void {
  if (ad.hookRate == null) return;
  if (ad.impressions < 500) return;

  if (ad.hookRate < THRESHOLDS.hookRate.critical) {
    problems.push({
      type: 'weak_video_hook',
      targetId: ad.adId, targetType: 'ad',
      severity: 'critical',
      value: ad.hookRate, threshold: THRESHOLDS.hookRate.critical,
      message: `Hook rate is ${ad.hookRate}% — only 1 in ${Math.round(100 / ad.hookRate)} viewers watches past 3 seconds. Rewrite the opening.`,
    });
  } else if (ad.hookRate < THRESHOLDS.hookRate.warning) {
    problems.push({
      type: 'low_video_hook',
      targetId: ad.adId, targetType: 'ad',
      severity: 'warning',
      value: ad.hookRate, threshold: THRESHOLDS.hookRate.warning,
      message: `Hook rate is ${ad.hookRate}% — below 25% benchmark for video ads. Test a stronger opening.`,
    });
  }
}

function checkWastedSpend(
  ad: AdPerformance,
  problems: DetectedProblem[],
  targetCpa?: number,
): void {
  // No conversions despite meaningful spend
  if (ad.spend >= THRESHOLDS.wastedSpend.minSpend && ad.conversions === 0) {
    problems.push({
      type: 'zero_conversions_with_spend',
      targetId: ad.adId, targetType: 'ad',
      severity: 'warning',
      value: ad.spend, threshold: THRESHOLDS.wastedSpend.minSpend,
      message: `$${ad.spend} spent with 0 conversions. Audience–creative mismatch or tracking issue.`,
    });
  }

  // CPA way above target
  if (targetCpa != null && ad.cpa != null && ad.conversions > 0) {
    const ratio = ad.cpa / targetCpa;
    if (ratio > 2.0) {
      problems.push({
        type: 'critical_cpa_overrun',
        targetId: ad.adId, targetType: 'ad',
        severity: 'critical',
        value: ad.cpa, threshold: targetCpa * 2,
        message: `CPA is $${ad.cpa} — ${ratio.toFixed(1)}x over target ($${targetCpa}). Pause or restructure urgently.`,
      });
    } else if (ratio > 1.5) {
      problems.push({
        type: 'high_cpa',
        targetId: ad.adId, targetType: 'ad',
        severity: 'warning',
        value: ad.cpa, threshold: targetCpa * 1.5,
        message: `CPA is $${ad.cpa} — 1.5x over target ($${targetCpa}). Optimise audience or creative.`,
      });
    }
  }
}

function checkBudgetConcentration(
  adSet: AdSetPerformance,
  campaign: CampaignPerformance,
  opportunities: Opportunity[],
): void {
  if (campaign.spend === 0) return;
  const share = adSet.spend / campaign.spend;

  if (share >= THRESHOLDS.budgetConcentration.threshold && campaign.adSets.length > 1) {
    opportunities.push({
      type: 'budget_rebalance',
      targetId: adSet.adSetId, targetType: 'adset',
      message: `This adset is consuming ${Math.round(share * 100)}% of the campaign budget, leaving other adsets under-tested.`,
      potentialImpact: 'More even budget split could reveal higher-performing audiences',
    });
  }
}

function checkScaleOpportunity(
  ad: AdPerformance,
  campaign: CampaignPerformance,
  avgRoas: number,
  opportunities: Opportunity[],
): void {
  if (ad.impressions < THRESHOLDS.minimumImpressions.limited) return;
  if (campaign.spend === 0) return;

  const spendShare = ad.spend / campaign.spend;
  const isWinner   = ad.roas >= THRESHOLDS.scaleOpportunity.minRoas && ad.roas > avgRoas * 1.5;
  const isUnderSpent = spendShare < THRESHOLDS.scaleOpportunity.maxSpendPct;

  if (isWinner && isUnderSpent) {
    opportunities.push({
      type: 'scale_winner',
      targetId: ad.adId, targetType: 'ad',
      message: `"${ad.adName}" has ${ad.roas}x ROAS but only ${Math.round(spendShare * 100)}% of budget. Strong scale candidate.`,
      potentialImpact: `Increasing budget allocation could drive proportional conversion growth`,
    });
  }
}

// ─── Data quality helpers ─────────────────────────────────────────────────────

function computeConfidence(campaign: CampaignPerformance): number {
  const { impressions } = campaign;
  if (impressions >= THRESHOLDS.minimumImpressions.limited)      return 0.90;
  if (impressions >= THRESHOLDS.minimumImpressions.insufficient) return 0.60;
  return 0.30;
}

function computeDataQuality(
  campaign: CampaignPerformance,
): 'sufficient' | 'limited' | 'insufficient' {
  const { impressions } = campaign;
  if (impressions >= THRESHOLDS.minimumImpressions.limited)      return 'sufficient';
  if (impressions >= THRESHOLDS.minimumImpressions.insufficient) return 'limited';
  return 'insufficient';
}
