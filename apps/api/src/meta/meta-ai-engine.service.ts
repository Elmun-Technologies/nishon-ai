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
export type CampaignAction = "SCALE" | "MONITOR" | "STOP" | "KILL";

export type AnalysisResult = {
  campaignId: string;
  health: CampaignHealth;
  action: CampaignAction;
  reason: string;
};

// ─── Rule thresholds (single source of truth) ─────────────────────────────────

const RULES = {
  /** Low CTR despite spend → stop wasting budget. */
  LOW_CTR_SPEND_THRESHOLD: 20,   // spend > $20
  LOW_CTR_THRESHOLD: 1,          // ctr < 1%

  /** Strong CTR + cheap CPC → ready to scale. */
  GOOD_CTR_THRESHOLD: 2.5,       // ctr > 2.5%
  GOOD_CPC_THRESHOLD: 0.4,       // cpc < $0.40

  /** High spend with near-zero engagement → kill immediately. */
  HIGH_SPEND_KILL_THRESHOLD: 100, // spend > $100
  NO_ENGAGEMENT_CLICKS: 10,      // clicks < 10
} as const;

/**
 * Rule-based campaign health analysis engine.
 *
 * Rule priority (first matching rule wins):
 *  1. BAD/STOP  → spend > $20 AND CTR < 1%  (low engagement with spend)
 *  2. GOOD/SCALE → CTR > 2.5% AND CPC < $0.40  (high performer, scale budget)
 *  3. BAD/KILL  → spend > $100 AND clicks < 10  (high spend, zero engagement)
 *  4. AVERAGE/MONITOR → everything else
 */
@Injectable()
export class MetaAiEngineService {
  /**
   * Analyse a single campaign's aggregated insights.
   * Returns a health status, recommended action, and human-readable reason.
   */
  analyzeCampaign(insights: CampaignInsights): AnalysisResult {
    const { campaignId, spend, clicks, ctr, cpc } = insights;

    // ── Rule 1: Low CTR with spend → stop ────────────────────────────────────
    if (spend > RULES.LOW_CTR_SPEND_THRESHOLD && ctr < RULES.LOW_CTR_THRESHOLD) {
      return {
        campaignId,
        health: "BAD",
        action: "STOP",
        reason: "Low CTR with spend",
      };
    }

    // ── Rule 2: High CTR + low CPC → scale ───────────────────────────────────
    if (ctr > RULES.GOOD_CTR_THRESHOLD && cpc < RULES.GOOD_CPC_THRESHOLD) {
      return {
        campaignId,
        health: "GOOD",
        action: "SCALE",
        reason: "High CTR and low CPC",
      };
    }

    // ── Rule 3: High spend, no engagement → kill ──────────────────────────────
    if (spend > RULES.HIGH_SPEND_KILL_THRESHOLD && clicks < RULES.NO_ENGAGEMENT_CLICKS) {
      return {
        campaignId,
        health: "BAD",
        action: "KILL",
        reason: "High spend, no engagement",
      };
    }

    // ── Default: not enough signal or middling performance ───────────────────
    return {
      campaignId,
      health: "AVERAGE",
      action: "MONITOR",
      reason:
        `CTR ${ctr.toFixed(2)}% / CPC $${cpc.toFixed(2)} / spend $${spend.toFixed(2)}. ` +
        "Performance is within acceptable range. Continue monitoring for trend changes.",
    };
  }

  /**
   * Analyse multiple campaigns at once. Returns one result per campaign.
   */
  analyzeCampaigns(insights: CampaignInsights[]): AnalysisResult[] {
    return insights.map((i) => this.analyzeCampaign(i));
  }
}
