import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Campaign } from "../campaigns/entities/campaign.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import { GoogleConnector } from "../platforms/connectors/google.connector";
import { TiktokConnector } from "../platforms/connectors/tiktok.connector";
import {
  createAdSpectrAiClientFromEnv,
  isAiClientConfigured,
  OPTIMIZATION_SYSTEM_PROMPT,
} from "@adspectr/ai-sdk";
import type { AdSpectrAiClient } from "@adspectr/ai-sdk";
import {
  AiDecisionAction,
  AutopilotMode,
  CampaignStatus,
  Platform,
} from "@adspectr/shared";

interface OptimizationDecision {
  action: string;
  targetId: string;
  targetType: string;
  reason: string;
  estimatedImpact: string;
  urgency: string;
}

/**
 * DecisionLoopService is the autonomous optimization engine.
 *
 * It runs on a schedule (every 2 hours by default) and:
 * 1. Fetches all active campaigns with their latest metrics
 * 2. Sends performance data to GPT-4o for analysis
 * 3. Receives a list of recommended actions (pause, scale, stop, shift)
 * 4. In FULL_AUTO mode: executes actions immediately
 * 5. In ASSISTED mode: saves decisions as pending for user approval
 * 6. In MANUAL mode: saves decisions as suggestions only
 *
 * Every decision is logged to the ai_decisions table so users always
 * know what the AI did and why — full transparency.
 */
@Injectable()
export class DecisionLoopService {
  private readonly logger = new Logger(DecisionLoopService.name);
  private readonly aiClient?: AdSpectrAiClient;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepo: Repository<ConnectedAccount>,
    private readonly metaConnector: MetaConnector,
    private readonly googleConnector: GoogleConnector,
    private readonly tiktokConnector: TiktokConnector,
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
      this.logger.warn("AI provider API key is not configured — AI decision loop will be unavailable");
    }
  }

  /**
   * Run the optimization loop for a single workspace.
   * This is the main entry point — called by the queue processor every 2 hours.
   *
   * The logic is like a human media buyer sitting down to review campaigns:
   * "What's performing well? What's wasting money? What should I change?"
   * Except it does this automatically, at scale, every 2 hours.
   */
  async runForWorkspace(workspaceId: string): Promise<AiDecision[]> {
    this.logger.log(`Running decision loop for workspace: ${workspaceId}`);

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) return [];

    // Fetch active campaigns with their recent performance metrics
    const campaigns = await this.campaignRepo
      .createQueryBuilder("campaign")
      .leftJoinAndSelect("campaign.adSets", "adSet")
      .leftJoinAndSelect("adSet.ads", "ad")
      .leftJoinAndSelect("ad.metrics", "metric")
      .where("campaign.workspaceId = :workspaceId", { workspaceId })
      .andWhere("campaign.status = :status", { status: CampaignStatus.ACTIVE })
      .orderBy("metric.recordedAt", "DESC")
      .getMany();

    if (campaigns.length === 0) {
      this.logger.log(`No active campaigns for workspace: ${workspaceId}`);
      return [];
    }

    // Build performance summary for the AI to analyze
    const performanceSummary = this.buildPerformanceSummary(campaigns);

    // Ask GPT-4o what actions to take
    if (!this.aiClient) {
      this.logger.warn("AI client not configured, skipping decision loop");
      return [];
    }
    const aiResponse = await this.aiClient.completeJson<{
      decisions: OptimizationDecision[];
      overallAssessment: string;
      nextReviewIn: string;
    }>(
      `Analyze these campaign metrics and decide what actions to take:\n${JSON.stringify(performanceSummary, null, 2)}`,
      OPTIMIZATION_SYSTEM_PROMPT,
      {
        taskType: 'optimization',
        agentName: 'DecisionLoop',
        temperature: 0.2, // Very low temp — we want consistent, data-driven decisions
      },
    );

    // Convert AI decisions to database records
    const savedDecisions: AiDecision[] = [];

    for (const decision of aiResponse.decisions) {
      if (decision.action === "no_action") continue;

      const aiDecision = this.decisionRepo.create({
        workspaceId,
        actionType: decision.action as AiDecisionAction,
        reason: decision.reason,
        estimatedImpact: decision.estimatedImpact,
        beforeState: performanceSummary,
        afterState: null, // Will be filled after execution
        // In FULL_AUTO: auto-approve. In ASSISTED/MANUAL: wait for human.
        isApproved:
          workspace.autopilotMode === AutopilotMode.FULL_AUTO ? true : null,
        isExecuted: false,
      });

      const saved = await this.decisionRepo.save(aiDecision);
      savedDecisions.push(saved);

      // In FULL_AUTO mode, execute the decision immediately
      if (workspace.autopilotMode === AutopilotMode.FULL_AUTO) {
        await this.executeDecision(saved);
      }
    }

    this.logger.log(
      `Decision loop complete for ${workspaceId}: ${savedDecisions.length} decisions created`,
    );

    return savedDecisions;
  }

  /**
   * Execute a previously saved decision by routing to the correct platform connector.
   * Called immediately in FULL_AUTO mode or after user approval in ASSISTED mode.
   *
   * Routing logic:
   *   1. Load the campaign associated with this decision
   *   2. Look up the workspace's connected account for that platform
   *   3. Decrypt the token and call the platform API
   *   4. Mark decision as executed
   */
  async executeDecision(decision: AiDecision): Promise<void> {
    this.logger.log(`Executing decision: ${decision.actionType} (${decision.id})`);

    try {
      if (decision.campaignId) {
        const campaign = await this.campaignRepo.findOne({
          where: { id: decision.campaignId },
        });

        if (campaign?.platform && campaign.externalId && campaign.workspaceId) {
          await this.dispatchToConnector(decision, campaign);
        }
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

  /**
   * Route a decision to the appropriate platform connector.
   * Maps AiDecisionAction enum values to specific API calls.
   */
  private async dispatchToConnector(
    decision: AiDecision,
    campaign: Campaign,
  ): Promise<void> {
    const platform = campaign.platform!;
    const externalId = campaign.externalId!;
    const workspaceId = campaign.workspaceId!;

    const account = await this.accountRepo.findOne({
      where: { workspaceId, platform, isActive: true },
    });

    if (!account) {
      this.logger.warn(
        `No active ${platform} account for workspace ${workspaceId} — skipping execution`,
      );
      return;
    }

    const encryptionKey = this.config.get<string>("ENCRYPTION_KEY");
    if (!encryptionKey || encryptionKey.length !== 32) {
      this.logger.error("ENCRYPTION_KEY is not set or is not 32 characters — cannot decrypt tokens");
      return;
    }
    const accessToken = this.decryptToken(account.accessToken, encryptionKey);
    const advertiserId = account.externalAccountId;

    const newBudget = (campaign.dailyBudget ?? 0) * 1.3; // 30% scale-up

    switch (decision.actionType) {
      case AiDecisionAction.PAUSE_AD:
      case AiDecisionAction.STOP_CAMPAIGN:
        await this.pauseOnPlatform(platform, externalId, advertiserId, accessToken);
        break;

      case AiDecisionAction.SCALE_BUDGET:
        await this.scaleBudgetOnPlatform(platform, externalId, advertiserId, accessToken, newBudget, account);
        break;

      case AiDecisionAction.SHIFT_BUDGET:
        // Reduce budget by 20% — handled like a budget adjustment
        const reducedBudget = (campaign.dailyBudget ?? 0) * 0.8;
        await this.scaleBudgetOnPlatform(platform, externalId, advertiserId, accessToken, reducedBudget, account);
        break;

      default:
        // Actions like GENERATE_STRATEGY, ADJUST_TARGETING, ROTATE_CREATIVE
        // are informational — log them but don't call platform APIs
        this.logger.log(`Decision type ${decision.actionType} noted (no direct API call)`);
        break;
    }
  }

  private async pauseOnPlatform(
    platform: Platform,
    externalId: string,
    advertiserId: string,
    accessToken: string,
  ): Promise<void> {
    if (platform === Platform.META) {
      await this.metaConnector.pauseCampaign(externalId, accessToken);
    } else if (platform === Platform.GOOGLE) {
      const [customerId, campaignId] = externalId.includes(":") ? externalId.split(":") : [advertiserId, externalId];
      await this.googleConnector.updateCampaignStatus(customerId, accessToken, campaignId, "PAUSED");
    } else if (platform === Platform.TIKTOK) {
      await this.tiktokConnector.pauseCampaign(advertiserId, accessToken, externalId);
    }
    this.logger.log(`Paused campaign ${externalId} on ${platform}`);
  }

  private async scaleBudgetOnPlatform(
    platform: Platform,
    externalId: string,
    advertiserId: string,
    accessToken: string,
    newBudgetUsd: number,
    account: ConnectedAccount,
  ): Promise<void> {
    if (platform === Platform.META) {
      await this.metaConnector.updateCampaignBudget(externalId, accessToken, newBudgetUsd);
    } else if (platform === Platform.GOOGLE) {
      const [customerId, budgetId] = externalId.includes(":") ? externalId.split(":") : [advertiserId, externalId];
      await this.googleConnector.updateCampaignBudget(customerId, accessToken, budgetId, newBudgetUsd);
    } else if (platform === Platform.TIKTOK) {
      await this.tiktokConnector.updateCampaignBudget(advertiserId, accessToken, externalId, newBudgetUsd);
    }
    this.logger.log(`Updated budget for campaign ${externalId} on ${platform} → $${newBudgetUsd}`);
  }

  private decryptToken(encryptedText: string, encryptionKey: string): string {
    const [ivHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !encrypted) throw new Error("Invalid encrypted token format");
    const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Build a clean performance summary from raw campaign data.
   * We extract only the relevant metrics so the AI prompt stays focused
   * and doesn't waste tokens on irrelevant data.
   */
  private buildPerformanceSummary(campaigns: Campaign[]) {
    return campaigns.map((campaign) => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform,
      dailyBudget: campaign.dailyBudget,
      adSets: campaign.adSets?.map((adSet) => ({
        adSetId: adSet.id,
        name: adSet.name,
        ads: adSet.ads?.map((ad) => {
          // Get the most recent 7 days of metrics
          const recentMetrics = ad.metrics?.slice(0, 7) || [];
          const totals = recentMetrics.reduce(
            (acc, m) => ({
              spend: acc.spend + Number(m.spend),
              clicks: acc.clicks + m.clicks,
              impressions: acc.impressions + Number(m.impressions),
              conversions: acc.conversions + m.conversions,
              revenue: acc.revenue + Number(m.revenue),
            }),
            { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 },
          );

          return {
            adId: ad.id,
            name: ad.name,
            aiScore: ad.aiScore,
            last7Days: {
              ...totals,
              ctr:
                totals.impressions > 0
                  ? ((totals.clicks / totals.impressions) * 100).toFixed(3)
                  : "0",
              cpa:
                totals.conversions > 0
                  ? (totals.spend / totals.conversions).toFixed(2)
                  : null,
              roas:
                totals.spend > 0
                  ? (totals.revenue / totals.spend).toFixed(2)
                  : "0",
            },
          };
        }),
      })),
    }));
  }
}
