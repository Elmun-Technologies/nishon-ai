import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Campaign } from "../campaigns/entities/campaign.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { NishonAiClient, OPTIMIZATION_SYSTEM_PROMPT } from "@nishon/ai-sdk";
import {
  AiDecisionAction,
  AutopilotMode,
  CampaignStatus,
} from "@nishon/shared";

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
  private readonly aiClient: NishonAiClient;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    this.aiClient = new NishonAiClient(apiKey);
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
    const aiResponse = await this.aiClient.completeJson<{
      decisions: OptimizationDecision[];
      overallAssessment: string;
      nextReviewIn: string;
    }>(
      `Analyze these campaign metrics and decide what actions to take:\n${JSON.stringify(performanceSummary, null, 2)}`,
      OPTIMIZATION_SYSTEM_PROMPT,
      { temperature: 0.2 }, // Very low temp — we want consistent, data-driven decisions
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
   * Execute a previously saved decision.
   * This is called either immediately (FULL_AUTO) or after user approval (ASSISTED).
   *
   * TODO: In Prompt 9, this will actually call the platform APIs
   * (Meta, Google, TikTok) to execute the changes.
   * For now it marks the decision as executed and logs it.
   */
  async executeDecision(decision: AiDecision): Promise<void> {
    this.logger.log(
      `Executing decision: ${decision.actionType} (${decision.id})`,
    );

    // TODO: Route to appropriate platform connector based on campaign platform
    // await this.metaConnector.pauseAd(decision.targetId)
    // await this.googleConnector.scaleBudget(decision.targetId, newBudget)

    await this.decisionRepo.update(decision.id, {
      isExecuted: true,
      isApproved: true,
      afterState: { executedAt: new Date(), status: "completed" } as any,
    });
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
