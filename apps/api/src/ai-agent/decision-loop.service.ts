import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { MetaCampaignSync } from "../meta/entities/meta-campaign-sync.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import { decrypt, resolveEncryptionKey } from "../common/crypto.util";
import {
  createAdSpectrAiClientFromEnv,
  isAiClientConfigured,
  OPTIMIZATION_SYSTEM_PROMPT,
} from "@adspectr/ai-sdk";
import type { AdSpectrAiClient } from "@adspectr/ai-sdk";
import { AiDecisionAction, AutopilotMode, Platform } from "@adspectr/shared";

interface OptimizationDecision {
  action: string;
  targetId: string; // the Meta campaign id the action applies to
  targetType: string;
  reason: string;
  estimatedImpact: string;
  urgency: string;
  confidence?: number; // 0-1, if the model provides it
}

type Risk = "low" | "medium" | "high";

/**
 * Risk of each action, mirroring auto-optimization/policy/action-policy.ts
 * (ACTION_RISK). Any platform mutation is high/medium; content-only actions
 * are low. Used to gate auto-execution by autopilot mode.
 */
const ACTION_RISK: Record<string, Risk> = {
  [AiDecisionAction.PAUSE_AD]: "high",
  [AiDecisionAction.STOP_CAMPAIGN]: "high",
  [AiDecisionAction.SCALE_BUDGET]: "high",
  [AiDecisionAction.SHIFT_BUDGET]: "medium",
  [AiDecisionAction.CREATE_AD]: "medium",
  [AiDecisionAction.ADJUST_TARGETING]: "medium",
  [AiDecisionAction.GENERATE_STRATEGY]: "low",
  [AiDecisionAction.ROTATE_CREATIVE]: "low",
};

/**
 * DecisionLoopService is the autonomous optimization engine.
 *
 * Every 2 hours (via the optimization cron/queue) it, per workspace:
 * 1. Reads the REAL synced Meta data (meta_campaign_syncs + meta_insights) —
 *    the local campaigns table is seed-only and empty for real users.
 * 2. Sends a per-campaign performance summary to the LLM.
 * 3. Turns each recommendation into an AiDecision carrying the target Meta
 *    campaign id + a real confidence / $ impact.
 * 4. Gates execution by autopilot mode × action risk:
 *      MANUAL     → propose everything (nothing auto-runs)
 *      ASSISTED   → auto-apply only LOW-risk; queue medium/high for approval
 *      FULL_AUTO  → auto-apply everything
 * 5. Executes approved/auto actions on the real Meta account.
 *
 * Every decision is logged to ai_decisions for full transparency.
 */
@Injectable()
export class DecisionLoopService {
  private readonly logger = new Logger(DecisionLoopService.name);
  private readonly aiClient?: AdSpectrAiClient;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepo: Repository<ConnectedAccount>,
    @InjectRepository(MetaCampaignSync)
    private readonly metaCampaignRepo: Repository<MetaCampaignSync>,
    @InjectRepository(MetaInsight)
    private readonly metaInsightRepo: Repository<MetaInsight>,
    private readonly metaConnector: MetaConnector,
  ) {
    const get = (k: string) => this.config.get<string>(k);
    if (isAiClientConfigured(get)) {
      try {
        this.aiClient = createAdSpectrAiClientFromEnv(get);
      } catch (e: any) {
        this.logger.warn(
          `AI client init failed — decision loop unavailable: ${e?.message ?? e}`,
        );
      }
    } else {
      this.logger.warn(
        "AI provider API key is not configured — AI decision loop will be unavailable",
      );
    }
  }

  /**
   * Run the optimization loop for a single workspace.
   * Called by the queue processor every 2 hours.
   */
  async runForWorkspace(workspaceId: string): Promise<AiDecision[]> {
    this.logger.log(`Running decision loop for workspace: ${workspaceId}`);

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) return [];

    // MANUAL/off workspaces still get suggestions logged; the cron already
    // filters to connected + non-manual, but keep this defensive.
    const mode = workspace.autopilotMode ?? AutopilotMode.MANUAL;

    // Build the performance summary from the REAL synced Meta data.
    const performanceSummary =
      await this.buildMetaPerformanceSummary(workspaceId);
    if (performanceSummary.length === 0) {
      this.logger.log(
        `No active synced Meta campaigns for workspace: ${workspaceId}`,
      );
      return [];
    }

    if (!this.aiClient) {
      this.logger.warn("AI client not configured, skipping decision loop");
      return [];
    }

    const aiResponse = await this.aiClient.completeJson<{
      decisions: OptimizationDecision[];
      overallAssessment: string;
      nextReviewIn: string;
    }>(
      `Analyze these campaign metrics and decide what actions to take. Each decision's targetId MUST be one of the campaignId values below.\n${JSON.stringify(performanceSummary, null, 2)}`,
      OPTIMIZATION_SYSTEM_PROMPT,
      { taskType: "optimization", agentName: "DecisionLoop", temperature: 0.2 },
    );

    const byCampaign = new Map(
      performanceSummary.map((c) => [String(c.campaignId), c]),
    );

    const savedDecisions: AiDecision[] = [];

    for (const decision of aiResponse.decisions ?? []) {
      if (!decision.action || decision.action === "no_action") continue;

      const target = byCampaign.get(String(decision.targetId));
      const risk = ACTION_RISK[decision.action] ?? "high";
      const autoApply = this.shouldAutoApply(mode, risk);

      const aiDecision = this.decisionRepo.create({
        workspaceId,
        actionType: decision.action as AiDecisionAction,
        reason: decision.reason,
        estimatedImpact: decision.estimatedImpact,
        beforeState: target ?? { note: "target not in summary" },
        afterState: null,
        targetExternalId: decision.targetId ?? null,
        targetPlatform: Platform.META,
        confidence: this.deriveConfidence(decision),
        impactUsd: this.deriveImpactUsd(decision, target),
        // Auto-applied actions are pre-approved; everything else waits.
        isApproved: autoApply ? true : null,
        isExecuted: false,
      });

      const saved = await this.decisionRepo.save(aiDecision);
      savedDecisions.push(saved);

      if (autoApply) {
        // Non-fatal: one failed execution shouldn't abort the whole loop.
        await this.executeDecision(saved).catch((e) =>
          this.logger.error(`Auto-execute failed [${saved.id}]: ${e?.message}`),
        );
      }
    }

    this.logger.log(
      `Decision loop complete for ${workspaceId}: ${savedDecisions.length} decisions (mode=${mode})`,
    );
    return savedDecisions;
  }

  /** MANUAL → never; ASSISTED → low-risk only; FULL_AUTO → any. */
  private shouldAutoApply(mode: AutopilotMode, risk: Risk): boolean {
    if (mode === AutopilotMode.FULL_AUTO) return true;
    if (mode === AutopilotMode.ASSISTED) return risk === "low";
    return false; // MANUAL
  }

  private deriveConfidence(d: OptimizationDecision): number {
    if (typeof d.confidence === "number") {
      return Math.min(1, Math.max(0, d.confidence));
    }
    // Fall back to the model's own urgency signal, not a per-action constant.
    switch ((d.urgency ?? "").toLowerCase()) {
      case "high":
        return 0.9;
      case "medium":
        return 0.75;
      case "low":
        return 0.6;
      default:
        return 0.7;
    }
  }

  /**
   * Projected $ impact. For a pause/stop, the real impact is the wasted daily
   * spend saved (derived from the campaign's own last-7d data). Otherwise, pull
   * the first dollar figure the model quoted in estimatedImpact.
   */
  private deriveImpactUsd(
    d: OptimizationDecision,
    target: CampaignSummary | undefined,
  ): number | null {
    if (
      target &&
      (d.action === AiDecisionAction.PAUSE_AD ||
        d.action === AiDecisionAction.STOP_CAMPAIGN)
    ) {
      const perDay = target.metrics.spend / 7;
      return Math.round(perDay * 100) / 100;
    }
    const m = (d.estimatedImpact ?? "")
      .replace(/,/g, "")
      .match(/\$?\s*(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  }

  /**
   * Execute a decision on the real ad platform. Called immediately for
   * auto-applied actions, or from the approve endpoint after human approval.
   */
  async executeDecision(decision: AiDecision): Promise<void> {
    this.logger.log(
      `Executing decision: ${decision.actionType} (${decision.id})`,
    );

    try {
      const targetId = decision.targetExternalId;
      const platform = (decision.targetPlatform as Platform) ?? Platform.META;

      if (targetId && decision.workspaceId && platform === Platform.META) {
        await this.dispatchMeta(decision, decision.workspaceId, targetId);
      }

      await this.decisionRepo.update(decision.id, {
        isExecuted: true,
        isApproved: true,
        afterState: {
          executedAt: new Date(),
          status: "completed",
          actionType: decision.actionType,
        } as any,
      });
    } catch (error: any) {
      this.logger.error(
        `Decision execution failed [${decision.id}]: ${error.message}`,
      );
      await this.decisionRepo.update(decision.id, {
        afterState: {
          executedAt: new Date(),
          status: "failed",
          error: error.message,
        } as any,
      });
      throw error;
    }
  }

  /** Route a Meta decision to the real Graph API using the workspace token. */
  private async dispatchMeta(
    decision: AiDecision,
    workspaceId: string,
    metaCampaignId: string,
  ): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { workspaceId, platform: Platform.META, isActive: true },
    });
    if (!account) {
      this.logger.warn(
        `No active Meta account for workspace ${workspaceId} — skipping execution`,
      );
      return;
    }

    const key = resolveEncryptionKey(this.config.get<string>("ENCRYPTION_KEY"));
    const accessToken = decrypt(account.accessToken, key);

    switch (decision.actionType) {
      case AiDecisionAction.PAUSE_AD:
      case AiDecisionAction.STOP_CAMPAIGN:
        await this.metaConnector.pauseCampaign(metaCampaignId, accessToken);
        this.logger.log(`Paused Meta campaign ${metaCampaignId}`);
        break;

      case AiDecisionAction.SCALE_BUDGET:
      case AiDecisionAction.SHIFT_BUDGET: {
        const current = await this.metaConnector.getCampaign(
          metaCampaignId,
          accessToken,
        );
        if (current.dailyBudget == null || current.dailyBudget <= 0) {
          this.logger.warn(
            `Campaign ${metaCampaignId} has no campaign-level daily budget (CBO/ABO) — skipping budget change`,
          );
          return;
        }
        const factor =
          decision.actionType === AiDecisionAction.SCALE_BUDGET ? 1.3 : 0.8;
        const next = Math.max(1, current.dailyBudget * factor);
        await this.metaConnector.updateCampaignBudget(
          metaCampaignId,
          accessToken,
          next,
        );
        this.logger.log(
          `Meta campaign ${metaCampaignId} budget ${current.dailyBudget} → ${next.toFixed(2)}`,
        );
        break;
      }

      default:
        // GENERATE_STRATEGY / ADJUST_TARGETING / ROTATE_CREATIVE / CREATE_AD are
        // content/suggestion-only for now — logged, no platform mutation.
        this.logger.log(
          `Decision type ${decision.actionType} noted (no direct API call)`,
        );
        break;
    }
  }

  /**
   * Build a per-campaign performance summary from the REAL synced Meta data:
   * active meta_campaign_syncs joined with a 7-day grouped aggregation of
   * meta_insights. This replaces the old read of the seed-only local
   * `campaigns` table (which is empty for real users).
   */
  private async buildMetaPerformanceSummary(
    workspaceId: string,
  ): Promise<CampaignSummary[]> {
    const active = await this.metaCampaignRepo.find({
      where: { workspaceId, status: "ACTIVE" },
    });
    if (active.length === 0) return [];

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const rows = await this.metaInsightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :wid", { wid: workspaceId })
      .andWhere("insight.date >= :since", { since })
      .select([
        "insight.campaignId AS campaignId",
        'COALESCE(SUM(insight.spend), 0) AS "spend"',
        'COALESCE(SUM(insight.clicks), 0) AS "clicks"',
        'COALESCE(SUM(insight.impressions), 0) AS "impressions"',
        'COALESCE(SUM(insight.conversions), 0) AS "conversions"',
        'COALESCE(SUM(insight.conversionValue), 0) AS "revenue"',
      ])
      .groupBy("insight.campaignId")
      .getRawMany<{
        campaignid: string;
        spend: string;
        clicks: string;
        impressions: string;
        conversions: string;
        revenue: string;
      }>();

    const metricsById = new Map(
      rows.map((r) => [
        String(r.campaignid),
        {
          spend: parseFloat(r.spend) || 0,
          clicks: parseInt(r.clicks, 10) || 0,
          impressions: parseInt(r.impressions, 10) || 0,
          conversions: parseInt(r.conversions, 10) || 0,
          revenue: parseFloat(r.revenue) || 0,
        },
      ]),
    );

    return (
      active
        .map((c) => {
          const m = metricsById.get(String(c.id)) ?? {
            spend: 0,
            clicks: 0,
            impressions: 0,
            conversions: 0,
            revenue: 0,
          };
          return {
            campaignId: c.id,
            campaignName: c.name,
            platform: "meta" as const,
            metrics: {
              ...m,
              ctr:
                m.impressions > 0
                  ? Number(((m.clicks / m.impressions) * 100).toFixed(3))
                  : 0,
              cpa:
                m.conversions > 0
                  ? Number((m.spend / m.conversions).toFixed(2))
                  : null,
              roas: m.spend > 0 ? Number((m.revenue / m.spend).toFixed(2)) : 0,
            },
          };
        })
        // Only surface campaigns that actually have spend to reason about.
        .filter((c) => c.metrics.spend > 0)
    );
  }
}

interface CampaignSummary {
  campaignId: string;
  campaignName: string;
  platform: "meta";
  metrics: {
    spend: number;
    clicks: number;
    impressions: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpa: number | null;
    roas: number;
  };
}
