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
   */
  async getPerformanceSummary(id: string, userId: string) {
    await this.findOne(id, userId); // verify ownership

    const result = await this.workspaceRepo
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

    const totalSpend = parseFloat(result.totalSpend) || 0;
    const totalRevenue = parseFloat(result.totalRevenue) || 0;

    return {
      totalSpend,
      totalRevenue,
      totalConversions: parseInt(result.totalConversions) || 0,
      totalClicks: parseInt(result.totalClicks) || 0,
      totalImpressions: parseInt(result.totalImpressions) || 0,
      campaignCount: parseInt(result.campaignCount) || 0,
      overallRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const workspace = await this.findOne(id, userId);
    await this.workspaceRepo.remove(workspace);
  }
}
