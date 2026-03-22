import { Injectable } from "@nestjs/common";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignInsights = {
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
};

export type CampaignHealth = "GOOD" | "AVERAGE" | "BAD";
export type CampaignAction = "SCALE" | "MONITOR" | "STOP";

export type AnalysisResult = {
  campaignId: string;
  health: CampaignHealth;
  action: CampaignAction;
  reason: string;
};

// ─── Rule thresholds (single source of truth) ─────────────────────────────────

const RULES = {
  /** Campaigns spending over this with very few clicks are wasting budget. */
  HIGH_SPEND_THRESHOLD: 50,
  LOW_CLICKS_THRESHOLD: 5,

  /** Campaigns with strong CTR and cheap clicks are ready to scale. */
  GOOD_CTR_THRESHOLD: 2,    // 2%
  GOOD_CPC_THRESHOLD: 0.5,  // $0.50
} as const;

/**
 * Rule-based campaign health analysis engine.
 *
 * This is intentionally kept simple and deterministic — rules are explicit,
 * easy to audit, and require no ML infrastructure. The goal is to surface
 * obvious winners and losers quickly so human operators can act on them.
 *
 * Rule priority (first matching rule wins):
 *  1. BAD  → high spend + very few clicks (wasting money)
 *  2. GOOD → strong CTR + cheap CPC (performing well, ready to scale)
 *  3. AVERAGE → everything else (needs more data or is mediocre)
 *
 * Future: replace or augment these rules with an ML model once enough
 * historical data has been collected in the meta_insights table.
 */
@Injectable()
export class MetaAiEngineService {
  /**
   * Analyse a single campaign's aggregated insights.
   * Returns a health status, recommended action, and human-readable reason.
   */
  analyzeCampaign(insights: CampaignInsights): AnalysisResult {
    const { campaignId, spend, clicks, ctr, cpc } = insights;

    // ── Rule 1: High spend, almost no clicks → stop wasting budget ───────────
    if (spend > RULES.HIGH_SPEND_THRESHOLD && clicks < RULES.LOW_CLICKS_THRESHOLD) {
      return {
        campaignId,
        health: "BAD",
        action: "STOP",
        reason:
          `Campaign spent $${spend.toFixed(2)} but only generated ${clicks} click(s). ` +
          `This is far below the minimum threshold of ${RULES.LOW_CLICKS_THRESHOLD} clicks ` +
          `for a $${RULES.HIGH_SPEND_THRESHOLD}+ spend — likely a creative or targeting mismatch.`,
      };
    }

    // ── Rule 2: Good CTR + cheap CPC → high-performer, increase budget ───────
    if (ctr > RULES.GOOD_CTR_THRESHOLD && cpc < RULES.GOOD_CPC_THRESHOLD) {
      return {
        campaignId,
        health: "GOOD",
        action: "SCALE",
        reason:
          `CTR of ${ctr.toFixed(2)}% exceeds the ${RULES.GOOD_CTR_THRESHOLD}% threshold ` +
          `and CPC of $${cpc.toFixed(2)} is below the $${RULES.GOOD_CPC_THRESHOLD} target. ` +
          "Strong efficiency signals — increase budget to capture more volume.",
      };
    }

    // ── Default: not enough signal or middling performance ───────────────────
    return {
      campaignId,
      health: "AVERAGE",
      action: "MONITOR",
      reason:
        `CTR ${ctr.toFixed(2)}% / CPC $${cpc.toFixed(2)} / spend $${spend.toFixed(2)}. ` +
        "Performance is within acceptable range. Continue monitoring for trend changes " +
        "before making budget adjustments.",
    };
  }

  /**
   * Analyse multiple campaigns at once. Returns one result per campaign.
   * Campaigns with no insight data are skipped (excluded from the result array).
   */
  analyzeCampaigns(insights: CampaignInsights[]): AnalysisResult[] {
    return insights.map((i) => this.analyzeCampaign(i));
  }
}
