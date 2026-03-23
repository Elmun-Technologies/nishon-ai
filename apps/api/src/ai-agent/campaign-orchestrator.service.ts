import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { StrategyEngineService, StrategyResult } from "./strategy-engine.service";
import { DecisionLoopService } from "./decision-loop.service";
import { AiAgentService } from "./ai-agent.service";

// ─── Pipeline I/O types ───────────────────────────────────────────────────────

export interface CampaignPipelineInput {
  /** Workspace to run the pipeline for */
  workspaceId: string
  /**
   * Ad platforms to generate scripts for (e.g. ['meta', 'tiktok']).
   * Defaults to the platforms from the generated strategy.
   */
  platforms?: string[]
  /**
   * Optional creative asset to score.
   * When provided, the scoring step runs after script generation.
   */
  creative?: {
    imageBase64: string
    mimeType: string
    platform: string
    creativeType: string
    goal: string
  }
  /**
   * Whether to run the optimization (decision) loop as the last step.
   * Defaults to false so the pipeline can be used before any campaigns exist.
   */
  runOptimization?: boolean
}

export interface CampaignPipelineResult {
  workspaceId: string
  /** Steps that completed without error */
  completedSteps: string[]
  /** Per-step error messages for steps that failed */
  errors: Record<string, string>
  strategy: StrategyResult | null
  scripts: any | null
  creativeScore: any | null
  decisions: AiDecision[]
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * CampaignOrchestratorService — multi-agent pipeline runner.
 *
 * Chains the four core AI agents into a single end-to-end flow:
 *
 *   1. StrategyEngine  → advertising strategy for the workspace
 *   2. AdScriptWriter  → platform-specific ad scripts aligned with strategy
 *   3. CreativeScorer  → vision-based quality score for a creative asset (optional)
 *   4. DecisionLoop    → autonomous campaign optimisation decisions (optional)
 *
 * Each step is wrapped in a try/catch.  A failure in one step is recorded in
 * `result.errors` and the pipeline continues — partial results are always
 * returned so the caller can act on what succeeded.
 */
@Injectable()
export class CampaignOrchestratorService {
  private readonly logger = new Logger(CampaignOrchestratorService.name);

  constructor(
    private readonly strategyEngine: StrategyEngineService,
    private readonly aiAgentService: AiAgentService,
    private readonly decisionLoop: DecisionLoopService,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Run the full campaign pipeline for a workspace.
   *
   * Returns a combined result containing outputs from every step that
   * completed successfully, plus an `errors` map for any that failed.
   */
  async runCampaignPipeline(
    input: CampaignPipelineInput,
  ): Promise<CampaignPipelineResult> {
    const { workspaceId } = input;
    const result: CampaignPipelineResult = {
      workspaceId,
      completedSteps: [],
      errors: {},
      strategy: null,
      scripts: null,
      creativeScore: null,
      decisions: [],
    };

    this.logger.log(`Pipeline started for workspace: ${workspaceId}`);
    const pipelineStart = Date.now();

    // ── Step 1: Strategy ─────────────────────────────────────────────────────
    try {
      result.strategy = await this.strategyEngine.generateForWorkspace(workspaceId);
      result.completedSteps.push("strategy");
    } catch (err: any) {
      result.errors["strategy"] = err?.message ?? String(err);
      this.logger.warn(`Pipeline [${workspaceId}] strategy step failed: ${result.errors["strategy"]}`);
    }

    // ── Step 2: Ad Scripts ───────────────────────────────────────────────────
    // Scripts are most valuable when aligned with the strategy, but we still
    // attempt generation even if strategy failed (uses workspace data directly).
    try {
      const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
      if (!workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
      }

      const platforms =
        input.platforms ??
        (result.strategy?.recommendedPlatforms ?? ["meta"]);

      const scriptDto = {
        businessName:       workspace.name,
        industry:           workspace.industry,
        productDescription: workspace.productDescription,
        targetAudience:     workspace.targetAudience,
        goal:               workspace.goal,
        monthlyBudget:      Number(workspace.monthlyBudget),
        targetLocation:     workspace.targetLocation
          ? [workspace.targetLocation]
          : ["Uzbekistan"],
        platforms,
        strategy: result.strategy ?? undefined,
      };

      result.scripts = await this.aiAgentService.generateAdScripts(workspaceId, scriptDto);
      result.completedSteps.push("scripts");
    } catch (err: any) {
      result.errors["scripts"] = err?.message ?? String(err);
      this.logger.warn(`Pipeline [${workspaceId}] scripts step failed: ${result.errors["scripts"]}`);
    }

    // ── Step 3: Creative Scoring (optional) ──────────────────────────────────
    if (input.creative) {
      try {
        const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
        result.creativeScore = await this.aiAgentService.scoreCreative({
          ...input.creative,
          workspaceContext: {
            name:           workspace?.name,
            industry:       workspace?.industry,
            targetAudience: workspace?.targetAudience,
          },
        });
        result.completedSteps.push("creativeScore");
      } catch (err: any) {
        result.errors["creativeScore"] = err?.message ?? String(err);
        this.logger.warn(`Pipeline [${workspaceId}] creative scoring failed: ${result.errors["creativeScore"]}`);
      }
    }

    // ── Step 4: Optimization / Decision Loop (optional) ──────────────────────
    if (input.runOptimization) {
      try {
        result.decisions = await this.decisionLoop.runForWorkspace(workspaceId);
        result.completedSteps.push("optimization");
      } catch (err: any) {
        result.errors["optimization"] = err?.message ?? String(err);
        this.logger.warn(`Pipeline [${workspaceId}] optimization step failed: ${result.errors["optimization"]}`);
      }
    }

    const durationMs = Date.now() - pipelineStart;
    this.logger.log(
      `Pipeline finished for workspace: ${workspaceId} | ` +
      `steps=${result.completedSteps.join(",")} | ` +
      `errors=${Object.keys(result.errors).length} | ` +
      `duration=${durationMs}ms`,
    );

    return result;
  }
}
