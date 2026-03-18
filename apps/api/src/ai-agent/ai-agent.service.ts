import { Injectable, Logger } from "@nestjs/common";
import {
  StrategyEngineService,
  StrategyResult,
} from "./strategy-engine.service";
import { DecisionLoopService } from "./decision-loop.service";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";

/**
 * AiAgentService is the public facade for all AI capabilities.
 *
 * Instead of controllers calling StrategyEngineService or DecisionLoopService
 * directly, they go through this single service. This keeps things clean:
 * the controller doesn't need to know which internal AI service handles what.
 *
 * Think of this as the "front desk" — it receives requests and routes them
 * to the right specialist (strategy, optimization, etc.).
 */
@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly strategyEngine: StrategyEngineService,
    private readonly decisionLoop: DecisionLoopService,
  ) {}

  async generateStrategy(workspaceId: string): Promise<StrategyResult> {
    return this.strategyEngine.generateForWorkspace(workspaceId);
  }

  async regenerateStrategy(workspaceId: string): Promise<StrategyResult> {
    return this.strategyEngine.regenerateStrategy(workspaceId);
  }

  async runOptimizationLoop(workspaceId: string): Promise<AiDecision[]> {
    return this.decisionLoop.runForWorkspace(workspaceId);
  }

  async approveDecision(decisionId: string): Promise<void> {
    // TODO: load decision, set isApproved = true, then executeDecision
    this.logger.log(`Decision approved: ${decisionId}`);
  }

  async rejectDecision(decisionId: string): Promise<void> {
    this.logger.log(`Decision rejected: ${decisionId}`);
  }
}
