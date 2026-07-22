import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  allocateFunnelBudget,
  normalizeGoal,
  AiDecisionAction,
  type AgentGoal,
  type FunnelAllocation,
} from "@adspectr/shared";
import { AgentConfig } from "./entities/agent-config.entity";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { SaveAgentConfigDto } from "./dto/save-agent-config.dto";

/**
 * AgentConfigService owns the persisted plan the autonomous AI agent runs under.
 *
 * The dashboard "AI Agent Setup" (link + goal + budget + stop-loss) writes here.
 * Two side effects make the plan real for the optimization engine:
 *   1. the funnel allocation is (re)computed from goal + budget and snapshotted;
 *   2. the workspace's optimization policy is synced so the Hard Stop-Loss the
 *      user set is actually enforced, and monthlyBudget reflects the plan.
 */
@Injectable()
export class AgentConfigService {
  private readonly logger = new Logger(AgentConfigService.name);

  constructor(
    @InjectRepository(AgentConfig)
    private readonly configRepo: Repository<AgentConfig>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(AiDecision)
    private readonly decisionRepo: Repository<AiDecision>,
  ) {}

  /** Return the workspace's agent config, or null if the agent was never set up. */
  async getConfig(workspaceId: string): Promise<AgentConfig | null> {
    return this.configRepo.findOne({ where: { workspaceId } });
  }

  /**
   * Create or update the workspace's agent config (upsert by workspaceId).
   * Recomputes the funnel allocation and syncs the workspace optimization
   * policy so the approved stop-loss / budget take effect immediately.
   */
  async saveConfig(
    workspaceId: string,
    dto: SaveAgentConfigDto,
  ): Promise<AgentConfig> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const goal = normalizeGoal(dto.goal);
    const budget = Math.max(0, Math.round(dto.budget || 0));
    const stopLossUsd =
      dto.stopLossUsd != null ? Math.max(0, Math.round(dto.stopLossUsd)) : 30;
    const allocation = allocateFunnelBudget({ goal, totalBudget: budget });

    const existing = await this.configRepo.findOne({ where: { workspaceId } });
    // Record a real AI decision only on first activation or a material change,
    // so the AI Decisions feed shows genuine activity (not just the demo) and
    // isn't spammed by no-op re-saves.
    const planChanged =
      !existing ||
      existing.goal !== goal ||
      Number(existing.budget) !== budget ||
      Number(existing.stopLossUsd) !== stopLossUsd;

    const config = this.configRepo.create({
      ...(existing ?? {}),
      workspaceId,
      link: dto.link?.trim() || null,
      goal,
      budget,
      stopLossUsd,
      allocation,
      activatedAt: existing?.activatedAt ?? new Date(),
    });
    const saved = await this.configRepo.save(config);

    await this.syncWorkspacePolicy(workspace, budget, stopLossUsd);

    if (planChanged) {
      await this.recordPlanDecision(workspaceId, {
        firstActivation: !existing,
        goal,
        budget,
        stopLossUsd,
        allocation,
      });
    }

    this.logger.log(
      `Agent config saved for workspace ${workspaceId}: goal=${goal} budget=$${budget} stopLoss=$${stopLossUsd}`,
    );
    return saved;
  }

  /**
   * Log the plan activation/change as an AiDecision so the transparency feed
   * reflects real agent state from the moment of activation. Best-effort: a
   * failure here must not fail the save.
   */
  private async recordPlanDecision(
    workspaceId: string,
    plan: {
      firstActivation: boolean;
      goal: AgentGoal;
      budget: number;
      stopLossUsd: number;
      allocation: FunnelAllocation;
    },
  ): Promise<void> {
    try {
      const goalLabel = plan.goal === "brand" ? "Brend tanitish" : "Sotuv";
      const channels = plan.allocation.byChannel
        .slice()
        .sort((a, b) => b.amount - a.amount)
        .map((c) => `${c.label} ${c.pct}%`)
        .join(", ");
      const verb = plan.firstActivation
        ? "faollashtirildi"
        : "rejasi yangilandi";
      const reason =
        `AI Agent ${verb} — maqsad: ${goalLabel}, oylik byudjet $${plan.budget}, ` +
        `Hard Stop-Loss $${plan.stopLossUsd}. Byudjet taqsimoti: ${channels}.`;

      const decision = this.decisionRepo.create({
        workspaceId,
        actionType: AiDecisionAction.GENERATE_STRATEGY,
        reason,
        afterState: {
          goal: plan.goal,
          budget: plan.budget,
          stopLossUsd: plan.stopLossUsd,
          allocation: plan.allocation,
        },
        estimatedImpact: null,
        isApproved: true,
        isExecuted: true,
      });
      await this.decisionRepo.save(decision);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to record plan decision for workspace ${workspaceId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Push the plan's budget + stop-loss into the workspace so the optimization
   * engine enforces them. Merges into any existing policy — other fields are
   * preserved. Activating the agent opts the workspace into autonomous Hard
   * Stop-Loss (each auto-pause is still logged to AI Decisions).
   */
  private async syncWorkspacePolicy(
    workspace: Workspace,
    budget: number,
    stopLossUsd: number,
  ): Promise<void> {
    workspace.monthlyBudget = budget;
    workspace.optimizationPolicy = {
      allowAutoBudgetChange: false,
      maxAutoBudgetChangePct: 0,
      allowAutoCreativeRefresh: true,
      allowAudienceChanges: false,
      protectedCampaignIds: [],
      protectedAdSetIds: [],
      ...(workspace.optimizationPolicy ?? {}),
      // Activating the agent with a stop-loss enables autonomous enforcement.
      allowAutoStopLossPause: true,
      allowAutoPauseCreative: true,
      stopLossMinSpendUsd: stopLossUsd,
    };
    await this.workspaceRepo.save(workspace);
  }
}
