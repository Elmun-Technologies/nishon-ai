import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OptimizerAgentService } from './optimizer-agent.service';
import { runRulesEngine } from './rules/rules-engine';
import { scoreAndRankActions } from './action-scorer';
import { governActions, SAFE_DEFAULTS } from './policy/action-policy';
import type { WorkspacePolicy } from './policy/action-policy';
import { OptimizationRun } from './entities/optimization-run.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { RunOptimizationDto } from './dto/run-optimization.dto';
import type {
  OptimizationReport,
  OptimizationAction,
  ActionType,
  RuleAnalysisResult,
  AiOptimizationSuggestion,
  ScoredAction,
  OptimizationMode,
  GovernedAction,
  GovernanceSummary,
} from './types/optimization.types';

/**
 * AutoOptimizationService — top-level orchestrator for the optimization pipeline.
 *
 * Pipeline flow:
 *   1. Normalize & validate input
 *   2. Rule-based analysis  (deterministic, always runs)
 *   3. AI optimization analysis  (adds intelligence to rule findings)
 *   4. Score + rank all actions
 *   5. Apply decision engine  (safety gate — what can auto-apply vs needs approval)
 *   6. Optionally generate creative refresh  (if creative problems detected)
 *   7. Persist run history
 *   8. Return structured OptimizationReport
 *
 * Every step is independently try/caught.  Partial success is always returned.
 */
@Injectable()
export class AutoOptimizationService {
  private readonly logger = new Logger(AutoOptimizationService.name);

  constructor(
    private readonly optimizerAgent: OptimizerAgentService,
    @InjectRepository(OptimizationRun)
    private readonly runRepo: Repository<OptimizationRun>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  // ─── Main entry point ──────────────────────────────────────────────────────

  async runOptimization(
    workspaceId: string,
    dto: RunOptimizationDto,
  ): Promise<OptimizationReport> {
    const startTime = Date.now();
    const { performance: campaign, mode, goal, constraints } = dto;

    // Load workspace policy from DB — fall back to SAFE_DEFAULTS if not configured
    const ws = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    const policy: WorkspacePolicy = (ws?.optimizationPolicy as WorkspacePolicy) ?? SAFE_DEFAULTS;

    this.logger.log(
      `[${workspaceId}] Optimization run started — campaign="${campaign.campaignName}"` +
      ` platform=${campaign.platform} mode=${mode}`,
    );

    const report: OptimizationReport = {
      workspaceId,
      campaignId:          campaign.campaignId,
      platform:            campaign.platform,
      mode,
      completedSteps:      [],
      errors:              {},
      ruleAnalysis:        null,
      aiSuggestion:        null,
      rankedActions:       [],
      governedActions:     [],
      governanceSummary:   null,
      autoAppliedActions:  [],
      generatedCreatives:  null,
      summary:             '',
      metadata: {
        model:       'unknown',
        tokensUsed:  0,
        durationMs:  0,
        runAt:       new Date(),
      },
    };

    // ── Step 1: Rule-based analysis ──────────────────────────────────────────
    try {
      report.ruleAnalysis = runRulesEngine(campaign, goal);
      report.completedSteps.push('rule_analysis');
      this.logger.log(
        `[${workspaceId}] Rules: ${report.ruleAnalysis.problems.length} problems,` +
        ` ${report.ruleAnalysis.opportunities.length} opportunities,` +
        ` quality=${report.ruleAnalysis.dataQuality}`,
      );
    } catch (err: any) {
      report.errors['rule_analysis'] = err?.message ?? String(err);
      this.logger.warn(`[${workspaceId}] Rule analysis failed: ${report.errors['rule_analysis']}`);
    }

    // ── Step 2: AI analysis ──────────────────────────────────────────────────
    // Runs even if rules failed — AI can still derive insights from raw data.
    try {
      report.aiSuggestion = await this.optimizerAgent.analyzeAndSuggest(
        campaign,
        report.ruleAnalysis ?? this.emptyRuleResult(),
        goal,
      );
      report.completedSteps.push('ai_analysis');
      report.metadata.model = 'gpt-4o-mini';
      this.logger.log(
        `[${workspaceId}] AI: ${report.aiSuggestion.actions.length} actions suggested,` +
        ` health=${report.aiSuggestion.overallHealthScore}`,
      );
    } catch (err: any) {
      report.errors['ai_analysis'] = err?.message ?? String(err);
      this.logger.warn(`[${workspaceId}] AI analysis failed: ${report.errors['ai_analysis']}`);
    }

    // ── Step 3: Score + rank all actions ─────────────────────────────────────
    try {
      const allActions = this.mergeAndDeduplicateActions(
        report.aiSuggestion?.actions ?? [],
        report.ruleAnalysis ?? this.emptyRuleResult(),
        constraints?.doNotPause ?? [],
      );

      report.rankedActions = scoreAndRankActions(
        allActions,
        report.ruleAnalysis ?? this.emptyRuleResult(),
      );
      report.completedSteps.push('scoring');
    } catch (err: any) {
      report.errors['scoring'] = err?.message ?? String(err);
      this.logger.warn(`[${workspaceId}] Action scoring failed: ${report.errors['scoring']}`);
    }

    // ── Step 4: Governance classification ───────────────────────────────────
    try {
      const allActions = report.rankedActions.map(sa => sa.action);
      const { governed, summary: govSummary } = governActions(allActions, policy, constraints);
      report.governedActions   = governed;
      report.governanceSummary = govSummary;
      report.completedSteps.push('governance');
      this.logger.log(
        `[${workspaceId}] Governance: auto=${govSummary.autoApply}` +
        ` approval=${govSummary.approvalRequired} blocked=${govSummary.blocked}`,
      );
    } catch (err: any) {
      report.errors['governance'] = err?.message ?? String(err);
      this.logger.warn(`[${workspaceId}] Governance step failed: ${report.errors['governance']}`);
    }

    // ── Step 5: Decision engine + safety gate ────────────────────────────────
    try {
      report.autoAppliedActions = this.applyDecisionEngine(report.governedActions, mode);
      report.completedSteps.push('decision_engine');
    } catch (err: any) {
      report.errors['decision_engine'] = err?.message ?? String(err);
    }

    // ── Step 6: Creative refresh (only when creative problems exist) ──────────
    const hasCreativeProblem = this.hasCreativeProblem(report.ruleAnalysis, report.aiSuggestion);
    if (hasCreativeProblem) {
      try {
        const problemDescription = this.buildCreativeProblemDescription(
          report.ruleAnalysis,
          report.aiSuggestion,
        );
        report.generatedCreatives = await this.optimizerAgent.generateCreativeRefresh(
          campaign,
          problemDescription,
        );
        if (report.generatedCreatives) {
          report.completedSteps.push('creative_refresh');
        }
      } catch (err: any) {
        report.errors['creative_refresh'] = err?.message ?? String(err);
        this.logger.warn(`[${workspaceId}] Creative refresh failed: ${report.errors['creative_refresh']}`);
      }
    }

    // ── Step 7: Build summary ─────────────────────────────────────────────────
    report.summary = this.buildSummary(report);
    report.metadata.durationMs = Date.now() - startTime;

    // ── Step 8: Persist ───────────────────────────────────────────────────────
    try {
      await this.persistRun(workspaceId, dto, report);
      report.completedSteps.push('persisted');
    } catch (err: any) {
      report.errors['persistence'] = err?.message ?? String(err);
      this.logger.warn(`[${workspaceId}] Failed to persist run: ${report.errors['persistence']}`);
    }

    this.logger.log(
      `[${workspaceId}] Optimization run complete — steps=${report.completedSteps.join(',')}` +
      ` actions=${report.rankedActions.length} autoApplied=${report.autoAppliedActions.length}` +
      ` duration=${report.metadata.durationMs}ms`,
    );

    return report;
  }

  // ─── History query ─────────────────────────────────────────────────────────

  /** Return the last N optimization runs for a workspace (for dashboard/audit) */
  async getHistory(workspaceId: string, limit = 10): Promise<OptimizationRun[]> {
    return this.runRepo.find({
      where:  { workspaceId },
      order:  { createdAt: 'DESC' },
      take:   limit,
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Merge AI-suggested actions with any rule-only actions not already covered.
   * Deduplicates by (type + targetId). Also filters out locked IDs.
   */
  private mergeAndDeduplicateActions(
    aiActions: OptimizationAction[],
    ruleAnalysis: RuleAnalysisResult,
    doNotPause: string[],
  ): OptimizationAction[] {
    // Start with AI actions
    const merged = [...aiActions];

    // Add rule-derived pause suggestions for losers not already in AI actions
    const loserIds = new Set(ruleAnalysis.losers);
    for (const loserId of loserIds) {
      const alreadyCovered = merged.some(
        a => a.targetId === loserId && a.type === 'pause_creative',
      );
      if (!alreadyCovered) {
        merged.push({
          type:            'pause_creative',
          targetId:        loserId,
          targetType:      'ad',
          reason:          'Identified as lowest performer by rule engine',
          expectedImpact:  'Reduce wasted spend, shift budget to higher performers',
          priority:        'medium',
          risk:            'medium',
          autoApplicable:  false,
        });
      }
    }

    // Filter locked IDs (doNotPause constraint)
    const locked = new Set(doNotPause);
    return merged.filter(a => {
      const isLockedPause = locked.has(a.targetId) && ['pause_creative', 'pause_adset'].includes(a.type);
      return !isLockedPause;
    });
  }

  /**
   * Safety gate — decides which actions to auto-apply.
   * Now driven by governance decisions from governActions():
   * only AUTO_APPLY_ALLOWED actions are executed in auto_apply mode.
   */
  private applyDecisionEngine(
    governedActions: GovernedAction[],
    mode: OptimizationMode,
  ): ActionType[] {
    if (mode !== 'auto_apply') return [];

    return governedActions
      .filter(ga => ga.governance === 'AUTO_APPLY_ALLOWED')
      .map(ga => ga.action.type);
  }

  /** Returns true if there are creative-related problems worth refreshing */
  private hasCreativeProblem(
    ruleAnalysis: RuleAnalysisResult | null,
    aiSuggestion: AiOptimizationSuggestion | null,
  ): boolean {
    const creativeRuleProblems = ruleAnalysis?.problems.some(p =>
      ['creative_fatigue', 'severe_creative_fatigue', 'weak_video_hook', 'low_video_hook', 'critically_low_ctr'].includes(p.type),
    ) ?? false;

    const creativeAiActions = aiSuggestion?.actions.some(a =>
      ['refresh_creative', 'rewrite_headline', 'rewrite_primary_text', 'generate_video_script', 'test_new_angle', 'flag_fatigue'].includes(a.type),
    ) ?? false;

    return creativeRuleProblems || creativeAiActions;
  }

  private buildCreativeProblemDescription(
    ruleAnalysis: RuleAnalysisResult | null,
    aiSuggestion: AiOptimizationSuggestion | null,
  ): string {
    const parts: string[] = [];

    const creativeProblems = ruleAnalysis?.problems.filter(p =>
      p.type.includes('fatigue') || p.type.includes('hook') || p.type.includes('ctr'),
    ) ?? [];

    if (creativeProblems.length) {
      parts.push(creativeProblems.map(p => p.message).join('. '));
    }

    const aiCreativeNotes = aiSuggestion?.keyInsights.slice(0, 2) ?? [];
    if (aiCreativeNotes.length) {
      parts.push(aiCreativeNotes.join('. '));
    }

    return parts.join(' ') || 'Creative performance is below benchmark.';
  }

  private buildSummary(report: OptimizationReport): string {
    if (report.aiSuggestion?.summary) return report.aiSuggestion.summary;

    const problemCount = report.ruleAnalysis?.problems.length ?? 0;
    const actionCount  = report.rankedActions.length;
    const topAction    = report.rankedActions[0]?.action;

    if (problemCount === 0 && actionCount === 0) {
      return 'Campaign is performing within acceptable thresholds. No urgent actions required.';
    }

    return (
      `Found ${problemCount} issue(s) and ${actionCount} recommended action(s). ` +
      (topAction ? `Top priority: ${topAction.type.replace(/_/g, ' ')} on ${topAction.targetType} ${topAction.targetId}.` : '')
    );
  }

  private async persistRun(
    workspaceId: string,
    dto: RunOptimizationDto,
    report: OptimizationReport,
  ): Promise<void> {
    const { performance: c } = dto;

    await this.runRepo.save(
      this.runRepo.create({
        workspaceId,
        campaignId:         c.campaignId,
        platform:           c.platform,
        mode:               dto.mode,
        inputSnapshot: {
          campaignName: c.campaignName,
          spend:        c.spend,
          roas:         c.roas,
          ctr:          c.ctr,
          conversions:  c.conversions,
          adSetCount:   c.adSets.length,
          adCount:      c.adSets.reduce((n, s) => n + s.ads.length, 0),
        },
        ruleAnalysis:       report.ruleAnalysis,
        aiSuggestion:       report.aiSuggestion,
        rankedActions:      report.rankedActions,
        governedActions:    report.governedActions,
        governanceSummary:  report.governanceSummary,
        autoAppliedActions: report.autoAppliedActions,
        summary:            report.summary,
        model:              report.metadata.model,
        tokensUsed:         report.metadata.tokensUsed,
        durationMs:         report.metadata.durationMs,
        healthScore:        report.aiSuggestion?.overallHealthScore ?? null,
      }),
    );
  }

  private emptyRuleResult(): RuleAnalysisResult {
    return {
      problems:     [],
      opportunities: [],
      winners:      [],
      losers:       [],
      confidence:   0.5,
      dataQuality:  'limited',
    };
  }
}
