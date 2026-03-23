import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "./entities/workspace.entity";
import { Budget } from "../budget/entities/budget.entity";
import { BudgetPeriod } from "../budget/entities/budget.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateAutopilotDto,
} from "@nishon/shared";

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(MetaInsight)
    private readonly metaInsightRepo: Repository<MetaInsight>,
  ) {}

  /**
   * Create a new workspace for a user (called at end of onboarding).
   * Also creates a default Budget record with equal platform split.
   * We default to Meta 60% / Google 40% — statistically best for most SMBs.
   */
  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = this.workspaceRepo.create({
      ...dto,
      userId,
      isOnboardingComplete: false,
    });

    const saved = await this.workspaceRepo.save(workspace);

    // Auto-create default budget allocation when workspace is created
    const budget = this.budgetRepo.create({
      workspaceId: saved.id,
      totalBudget: dto.monthlyBudget,
      period: BudgetPeriod.MONTHLY,
      platformSplit: { meta: 60, google: 40 },
      autoRebalance: true,
    });

    await this.budgetRepo.save(budget);
    return saved;
  }

  /**
   * Get all workspaces belonging to a user.
   * We include campaign count and connected accounts for the dashboard overview.
   */
  async findAllByUser(userId: string): Promise<Workspace[]> {
    return this.workspaceRepo.find({
      where: { userId },
      relations: ["connectedAccounts", "budgets"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get a single workspace by ID.
   * Always verify ownership — a user should never access another user's workspace.
   */
  async findOne(id: string, userId: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id },
      relations: ["connectedAccounts", "budgets", "campaigns"],
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace not found`);
    }

    // Security check — verify the requesting user owns this workspace
    if (workspace.userId !== userId) {
      throw new ForbiddenException(`You do not have access to this workspace`);
    }

    return workspace;
  }

  /**
   * Update workspace settings.
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id, userId);
    Object.assign(workspace, dto);
    return this.workspaceRepo.save(workspace);
  }

  /**
   * Mark onboarding as complete and save the AI-generated strategy.
   * Called after the AI strategy engine returns results.
   */
  async completeOnboarding(
    id: string,
    userId: string,
    aiStrategy: Record<string, any>,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id, userId);
    workspace.isOnboardingComplete = true;
    workspace.aiStrategy = aiStrategy;
    return this.workspaceRepo.save(workspace);
  }

  /**
   * Switch autopilot mode — MANUAL, ASSISTED, or FULL_AUTO.
   * This is a separate endpoint because it is a high-stakes change
   * that should be deliberate, not accidental via a general update.
   */
  async updateAutopilotMode(
    id: string,
    userId: string,
    dto: UpdateAutopilotDto,
  ): Promise<Workspace> {
    const workspace = await this.findOne(id, userId);
    workspace.autopilotMode = dto.mode;
    return this.workspaceRepo.save(workspace);
  }

  /**
   * Get workspace performance summary — used for the dashboard overview card.
   * Aggregates spend, conversions, and ROAS across all campaigns.
   *
   * Data sources:
   * 1. PerformanceMetric — internal campaign data (manually-created campaigns)
   * 2. MetaInsight — real Meta Ads data synced from the Graph API
   *
   * We merge both so that users who connected Meta see real numbers on
   * the dashboard even if they haven't created any internal campaigns.
   */
  async getPerformanceSummary(id: string, userId: string) {
    await this.findOne(id, userId); // verify ownership

    // ── Internal campaign metrics ─────────────────────────────────────────────
    const internalResult = await this.workspaceRepo
      .createQueryBuilder("workspace")
      .leftJoin("workspace.campaigns", "campaign")
      .leftJoin("campaign.adSets", "adSet")
      .leftJoin("adSet.ads", "ad")
      .leftJoin("ad.metrics", "metric")
      .where("workspace.id = :id", { id })
      .select([
        'COALESCE(SUM(metric.spend), 0) AS "totalSpend"',
        'COALESCE(SUM(metric.conversions), 0) AS "totalConversions"',
        'COALESCE(SUM(metric.revenue), 0) AS "totalRevenue"',
        'COALESCE(SUM(metric.clicks), 0) AS "totalClicks"',
        'COALESCE(SUM(metric.impressions), 0) AS "totalImpressions"',
        'COUNT(DISTINCT campaign.id) AS "campaignCount"',
      ])
      .getRawOne();

    // ── Real Meta Ads insights (last 30 days) ─────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metaResult = await this.metaInsightRepo
      .createQueryBuilder("insight")
      .where("insight.workspaceId = :id", { id })
      .andWhere("insight.date >= :since", { since: thirtyDaysAgo })
      .select([
        'COALESCE(SUM(insight.spend), 0) AS "metaSpend"',
        'COALESCE(SUM(insight.clicks), 0) AS "metaClicks"',
        'COALESCE(SUM(insight.impressions), 0) AS "metaImpressions"',
        'COUNT(DISTINCT insight.campaignId) AS "metaCampaignCount"',
      ])
      .getRawOne();

    // ── Merge: Meta data supplements internal data ────────────────────────────
    const internalSpend   = parseFloat(internalResult.totalSpend) || 0;
    const internalRevenue = parseFloat(internalResult.totalRevenue) || 0;
    const metaSpend       = parseFloat(metaResult?.metaSpend ?? "0") || 0;

    // Use the larger spend source to avoid double-counting.
    // If Meta is connected and has data, it becomes the primary spend source.
    const totalSpend      = Math.max(internalSpend, metaSpend);
    const totalRevenue    = internalRevenue;
    const totalClicks     = Math.max(
      parseInt(internalResult.totalClicks) || 0,
      parseInt(metaResult?.metaClicks ?? "0") || 0,
    );
    const totalImpressions = Math.max(
      parseInt(internalResult.totalImpressions) || 0,
      parseInt(metaResult?.metaImpressions ?? "0") || 0,
    );
    const campaignCount = Math.max(
      parseInt(internalResult.campaignCount) || 0,
      parseInt(metaResult?.metaCampaignCount ?? "0") || 0,
    );

    return {
      totalSpend,
      totalRevenue,
      totalConversions: parseInt(internalResult.totalConversions) || 0,
      totalClicks,
      totalImpressions,
      campaignCount,
      overallRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      // Expose raw source breakdown so the UI can show a "Powered by Meta" badge
      metaConnected: metaSpend > 0,
      metaSpend,
    };
  }

  /** Return workspace optimization policy (null → caller should use SAFE_DEFAULTS) */
  async getPolicy(id: string, userId: string) {
    const workspace = await this.findOne(id, userId);
    return workspace.optimizationPolicy ?? null;
  }

  /** Merge partial policy update — unset fields keep current value */
  async updatePolicy(
    id: string,
    userId: string,
    patch: Partial<Workspace['optimizationPolicy']>,
  ) {
    const workspace = await this.findOne(id, userId);
    workspace.optimizationPolicy = {
      allowAutoBudgetChange:    false,
      maxAutoBudgetChangePct:   0,
      allowAutoCreativeRefresh: true,
      allowAutoPauseCreative:   false,
      allowAudienceChanges:     false,
      protectedCampaignIds:     [],
      protectedAdSetIds:        [],
      ...(workspace.optimizationPolicy ?? {}),
      ...patch,
    };
    await this.workspaceRepo.save(workspace);
    return workspace.optimizationPolicy;
  }

  async delete(id: string, userId: string): Promise<void> {
    const workspace = await this.findOne(id, userId);
    await this.workspaceRepo.remove(workspace);
  }
}
