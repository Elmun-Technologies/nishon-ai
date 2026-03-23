import { Injectable, Logger, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workspace } from "../workspaces/entities/workspace.entity";
import {
  NishonAiClient,
  buildStrategyPrompt,
  STRATEGY_SYSTEM_PROMPT,
} from "@nishon/ai-sdk";

export interface StrategyInput {
  businessName: string;
  industry: string;
  productDescription: string;
  targetAudience: string;
  monthlyBudget: number;
  goal: string;
  location: string;
}

export interface StrategyResult {
  summary: string;
  marketAnalysis: {
    targetMarketSize: string;
    competitionLevel: string;
    seasonality: string;
    keyInsights: string[];
  };
  recommendedPlatforms: string[];
  budgetAllocation: Record<string, number>;
  monthlyForecast: {
    estimatedLeads: number;
    estimatedSales: number;
    estimatedRoas: number;
    estimatedCpa: number;
    estimatedCtr: number;
    confidence: string;
  };
  targetingRecommendations: Array<{
    platform: string;
    ageRange: string;
    genders: string[];
    interests: string[];
    locations: string[];
    customAudiences: string[];
  }>;
  creativeGuidelines: {
    tone: string;
    keyMessages: string[];
    callToActions: string[];
    visualStyle: string;
    formatRecommendations: string[];
  };
  campaignStructure: Array<{
    name: string;
    platform: string;
    objective: string;
    dailyBudget: number;
    adSets: any[];
  }>;
  firstWeekActions: string[];
  warningFlags: string[];
  generatedAt?: Date;
}

/**
 * StrategyEngineService is the brain of Nishon AI.
 *
 * It takes raw business data from onboarding and produces a complete,
 * actionable advertising strategy using GPT-4o. Think of it as having
 * a senior media buyer available 24/7 who instantly analyzes your business
 * and tells you exactly where to spend your budget and how.
 *
 * The strategy is not a generic template — it is dynamically generated
 * based on the specific business, industry, budget, and target market.
 */
@Injectable()
export class StrategyEngineService {
  private readonly logger = new Logger(StrategyEngineService.name);
  private readonly aiClient: NishonAiClient;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {
    const apiKey = this.config.get<string>("AGENT_ROUTER_API_KEY") || "";
    const baseURL =
      (this.config.get<string>("AGENT_ROUTER_BASE_URL") || "https://api.agentrouter.org").replace(/\/$/, "") + "/v1";
    if (apiKey) {
      this.aiClient = new NishonAiClient(apiKey, baseURL);
    } else {
      this.logger.warn("AGENT_ROUTER_API_KEY is not configured - AI features will be unavailable");
    }
  }

  /**
   * Generate a complete advertising strategy for a workspace.
   *
   * This is called at the end of onboarding. The flow is:
   * 1. Load workspace data from DB
   * 2. Build a detailed prompt with all business context
   * 3. Send to GPT-4o and get JSON strategy back
   * 4. Validate and enrich the response
   * 5. Save strategy to workspace and return it
   *
   * The whole process takes 8-15 seconds — fast enough for real-time UI.
   */
  async generateForWorkspace(workspaceId: string): Promise<StrategyResult> {
    this.logger.log(`Generating strategy for workspace: ${workspaceId}`);

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BadRequestException(`Workspace ${workspaceId} not found`);
    }

    const input: StrategyInput = {
      businessName: workspace.name,
      industry: workspace.industry,
      productDescription: workspace.productDescription,
      targetAudience: workspace.targetAudience,
      monthlyBudget: Number(workspace.monthlyBudget),
      goal: workspace.goal,
      location: workspace.targetLocation || "Uzbekistan",
    };

    let strategy: StrategyResult;
    try {
      strategy = await this.generateStrategy(input);
    } catch (err: any) {
      this.logger.error({
        message: "AI strategy generation failed",
        workspaceId,
        error: err?.message,
      });
      throw new InternalServerErrorException(
        err?.message || "AI strategiya yaratishda xatolik yuz berdi. Qayta urinib ko'ring.",
      );
    }

    // Save strategy back to workspace so it persists
    await this.workspaceRepo.update(workspaceId, {
      aiStrategy: strategy as any,
      isOnboardingComplete: true,
    });

    this.logger.log(
      `Strategy generated successfully for workspace: ${workspaceId}`,
    );
    return strategy;
  }

  /**
   * Core method: sends business data to GPT-4o and parses the strategy response.
   * We use completeJson() which handles JSON parsing and retry logic internally.
   */
  async generateStrategy(input: StrategyInput): Promise<StrategyResult> {
    if (!this.aiClient) {
      throw new BadRequestException("AI features are not available: AGENT_ROUTER_API_KEY is not configured");
    }

    const prompt = buildStrategyPrompt(input);

    this.logger.log(
      `Calling GPT-4o for strategy: ${input.businessName} | Budget: $${input.monthlyBudget}`,
    );

    const strategy = await this.aiClient.completeJson<StrategyResult>(
      prompt,
      STRATEGY_SYSTEM_PROMPT,
      {
        temperature: 0.4, // Lower = more consistent, professional output
        maxTokens: 3000,
      },
    );

    // Enrich with metadata
    strategy.generatedAt = new Date();

    // Validate budget allocation sums to 100%
    const totalAllocation = Object.values(strategy.budgetAllocation).reduce(
      (sum, val) => sum + val,
      0,
    );

    if (Math.abs(totalAllocation - 100) > 1) {
      this.logger.warn(
        `Budget allocation doesn't sum to 100% (got ${totalAllocation}%), normalizing...`,
      );
      // Normalize to 100%
      for (const key of Object.keys(strategy.budgetAllocation)) {
        strategy.budgetAllocation[key] = Math.round(
          (strategy.budgetAllocation[key] / totalAllocation) * 100,
        );
      }
    }

    return strategy;
  }

  /**
   * Regenerate strategy — called when user wants a fresh analysis
   * or when significant business changes happen (budget doubled, new product, etc.)
   */
  async regenerateStrategy(workspaceId: string): Promise<StrategyResult> {
    this.logger.log(`Regenerating strategy for workspace: ${workspaceId}`);
    return this.generateForWorkspace(workspaceId);
  }
}
