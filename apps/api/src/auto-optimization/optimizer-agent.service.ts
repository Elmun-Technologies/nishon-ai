import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdSpectrAiClient } from '@adspectr/ai-sdk';
import {
  CampaignPerformance,
  OptimizationGoal,
  RuleAnalysisResult,
  AiOptimizationSuggestion,
  OptimizationAction,
  LOW_RISK_ACTIONS,
  ActionType,
} from './types/optimization.types';
import {
  OPTIMIZER_SYSTEM_PROMPT,
  buildOptimizerPrompt,
  CREATIVE_REFRESH_SYSTEM_PROMPT,
  buildCreativeRefreshPrompt,
} from './prompts/optimization.prompt';

/**
 * OptimizerAgentService — the AI reasoning layer of the optimization engine.
 *
 * Responsibilities:
 * 1. Receive pre-analyzed performance data + rule findings
 * 2. Call the AI to validate, enrich, and expand on those findings
 * 3. Produce a structured list of concrete actions
 * 4. Optionally generate replacement creative concepts for fatigued ads
 *
 * This service does NOT orchestrate or persist — that is AutoOptimizationService's job.
 * Keeping the AI layer separate makes it easy to test and swap models.
 */
@Injectable()
export class OptimizerAgentService {
  private readonly logger = new Logger(OptimizerAgentService.name);
  private readonly aiClient: AdSpectrAiClient;

  constructor(private readonly config: ConfigService) {
    const provider = config.get<string>('AI_PROVIDER', 'openai').toLowerCase() === 'anthropic'
      ? 'anthropic'
      : 'openai';
    const apiKey = provider === 'anthropic'
      ? config.get<string>('ANTHROPIC_API_KEY', '')
      : config.get<string>('OPENAI_API_KEY', '');
    const baseURL = provider === 'anthropic'
      ? config.get<string>('ANTHROPIC_BASE_URL', '')
      : config.get<string>('OPENAI_BASE_URL', '');
    this.aiClient = new AdSpectrAiClient(apiKey, baseURL || undefined, provider);
  }

  // ─── Main optimization analysis ─────────────────────────────────────────────

  /**
   * Sends campaign data + rule findings to the AI and gets back a structured
   * list of prioritised optimisation actions.
   */
  async analyzeAndSuggest(
    campaign: CampaignPerformance,
    ruleAnalysis: RuleAnalysisResult,
    goal?: OptimizationGoal,
  ): Promise<AiOptimizationSuggestion> {
    this.logger.log(
      `AI analysis started — campaign="${campaign.campaignName}" platform=${campaign.platform}`,
    );

    const prompt = buildOptimizerPrompt(campaign, ruleAnalysis, goal);

    const raw = await this.aiClient.completeJson<{
      summary: string;
      overallHealthScore: number;
      keyInsights: string[];
      actions: Array<{
        type: string;
        targetId: string;
        targetType: 'ad' | 'adset' | 'campaign';
        reason: string;
        expectedImpact: string;
        priority: string;
        risk: string;
        autoApplicable: boolean;
      }>;
    }>(prompt, OPTIMIZER_SYSTEM_PROMPT, {
      taskType: 'optimization',
      agentName: 'OptimizerAgent',
      temperature: 0.25,  // low variance — optimization decisions need consistency
    });

    // Sanitise and enforce type safety on AI output
    const actions: OptimizationAction[] = (raw.actions ?? []).map(a => ({
      type:           this.sanitizeActionType(a.type),
      targetId:       a.targetId ?? '',
      targetType:     a.targetType ?? 'ad',
      reason:         a.reason ?? '',
      expectedImpact: a.expectedImpact ?? '',
      priority:       this.sanitizePriority(a.priority),
      risk:           this.sanitizeRisk(a.risk),
      autoApplicable: LOW_RISK_ACTIONS.includes(a.type as ActionType)
        ? a.autoApplicable ?? false
        : false,  // force false for high-risk action types regardless of AI claim
    }));

    return {
      summary:            raw.summary            ?? 'Analysis complete.',
      overallHealthScore: raw.overallHealthScore ?? 50,
      keyInsights:        raw.keyInsights        ?? [],
      actions,
    };
  }

  // ─── Creative refresh ────────────────────────────────────────────────────────

  /**
   * Generate replacement creative concepts for fatigued or underperforming ads.
   * Called only when the optimization engine detects creative-related problems.
   * Returns null (gracefully) if the call fails — creative regen is optional.
   */
  async generateCreativeRefresh(
    campaign: CampaignPerformance,
    problemDescription: string,
  ): Promise<any | null> {
    const fatiguedAds = campaign.adSets
      .flatMap(s => s.ads)
      .filter(a => a.creative)
      .slice(0, 5)
      .map(a => ({
        headline:    a.creative?.headline,
        primaryText: a.creative?.primaryText,
      }));

    if (fatiguedAds.length === 0 && !problemDescription) {
      return null;
    }

    this.logger.log(`Generating creative refresh concepts for "${campaign.campaignName}"`);

    try {
      return await this.aiClient.completeJson(
        buildCreativeRefreshPrompt(
          campaign.campaignName,
          campaign.platform,
          campaign.objective,
          problemDescription,
          fatiguedAds,
        ),
        CREATIVE_REFRESH_SYSTEM_PROMPT,
        {
          taskType:  'creative',
          agentName: 'CreativeRefresh',
          temperature: 0.75,  // more creative variance for copy generation
        },
      );
    } catch (err: any) {
      this.logger.warn(`Creative refresh generation failed: ${err?.message}`);
      return null;  // non-critical — return null and let orchestrator continue
    }
  }

  // ─── Sanitisers ──────────────────────────────────────────────────────────────
  // The AI occasionally returns slightly wrong values. These clamp to valid enums.

  private sanitizeActionType(value: string): ActionType {
    const valid: ActionType[] = [
      'pause_creative', 'pause_adset', 'increase_budget', 'decrease_budget',
      'shift_budget', 'duplicate_winner', 'refresh_creative', 'test_new_angle',
      'broaden_audience', 'narrow_audience', 'rewrite_headline',
      'rewrite_primary_text', 'generate_video_script', 'rotate_creative', 'flag_fatigue',
    ];
    return valid.includes(value as ActionType) ? (value as ActionType) : 'flag_fatigue';
  }

  private sanitizePriority(value: string): 'critical' | 'high' | 'medium' | 'low' {
    const valid = ['critical', 'high', 'medium', 'low'] as const;
    return valid.includes(value as any) ? (value as any) : 'medium';
  }

  private sanitizeRisk(value: string): 'low' | 'medium' | 'high' {
    const valid = ['low', 'medium', 'high'] as const;
    return valid.includes(value as any) ? (value as any) : 'medium';
  }
}
