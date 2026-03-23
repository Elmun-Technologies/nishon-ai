// ─── Primitives ───────────────────────────────────────────────────────────────

export type Platform = 'meta' | 'tiktok' | 'google' | 'youtube';
export type OptimizationMode = 'recommend' | 'auto_apply';
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionRisk = 'low' | 'medium' | 'high';
export type ProblemSeverity = 'critical' | 'warning' | 'info';

export type ActionType =
  | 'pause_creative'
  | 'pause_adset'
  | 'increase_budget'
  | 'decrease_budget'
  | 'shift_budget'
  | 'duplicate_winner'
  | 'refresh_creative'
  | 'test_new_angle'
  | 'broaden_audience'
  | 'narrow_audience'
  | 'rewrite_headline'
  | 'rewrite_primary_text'
  | 'generate_video_script'
  | 'rotate_creative'
  | 'flag_fatigue';

/**
 * Actions that can be auto-applied in 'auto_apply' mode.
 * These only produce content suggestions — they do NOT mutate ad platform state.
 * Budget changes, pauses, and audience changes always require human approval.
 */
export const LOW_RISK_ACTIONS: ActionType[] = [
  'flag_fatigue',
  'rotate_creative',
  'rewrite_headline',
  'rewrite_primary_text',
  'generate_video_script',
  'test_new_angle',
  'refresh_creative',
];

// ─── Input data model ─────────────────────────────────────────────────────────

export interface CreativeMetadata {
  format: 'image' | 'video' | 'carousel';
  headline?: string;
  primaryText?: string;
}

export interface AdPerformance {
  adId: string;
  adName: string;
  impressions: number;
  clicks: number;
  ctr: number;         // %
  cpc: number;         // USD
  cpm: number;         // USD per 1 000 impressions
  spend: number;       // USD total
  conversions: number;
  cpa: number | null;  // USD cost per acquisition, null if no conversions
  roas: number;        // return on ad spend (revenue / spend)
  frequency: number;   // avg times a user saw this ad
  hookRate?: number;   // % who watched past first 3 seconds (video only)
  holdRate?: number;   // % who watched 75%+ (video only)
  creative?: CreativeMetadata;
}

export interface AdSetPerformance {
  adSetId: string;
  adSetName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  cpa: number | null;
  roas: number;
  audienceSize?: number;
  ads: AdPerformance[];
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  platform: Platform;
  objective: string;   // conversions | traffic | awareness | leads
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  cpa: number | null;
  roas: number;
  dailyBudget: number;
  adSets: AdSetPerformance[];
}

export interface OptimizationGoal {
  type: 'conversions' | 'leads' | 'traffic' | 'awareness' | 'sales';
  targetCpa?: number;
  targetRoas?: number;
  targetCtr?: number;
}

export interface OptimizationConstraints {
  minBudget?: number;
  maxBudget?: number;
  doNotPause?: string[];  // ad/adset IDs the user has locked
}

// ─── Rule analysis ────────────────────────────────────────────────────────────

export interface DetectedProblem {
  type: string;
  targetId: string;
  targetType: 'ad' | 'adset' | 'campaign';
  severity: ProblemSeverity;
  value: number;      // actual metric value that triggered the rule
  threshold: number;  // threshold that was violated
  message: string;
}

export interface Opportunity {
  type: string;
  targetId: string;
  targetType: 'ad' | 'adset' | 'campaign';
  message: string;
  potentialImpact: string;
}

export interface RuleAnalysisResult {
  problems: DetectedProblem[];
  opportunities: Opportunity[];
  winners: string[];  // top-performing adIds
  losers: string[];   // bottom-performing adIds
  confidence: number; // 0–1, driven by data volume
  dataQuality: 'sufficient' | 'limited' | 'insufficient';
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export interface OptimizationAction {
  type: ActionType;
  targetId: string;
  targetType: 'ad' | 'adset' | 'campaign';
  reason: string;
  expectedImpact: string;
  priority: ActionPriority;
  risk: ActionRisk;
  autoApplicable: boolean;
  payload?: Record<string, any>;  // extra data (e.g. suggested new headline text)
}

export interface ScoredAction {
  action: OptimizationAction;
  score: number;         // 0–100 composite score
  confidence: number;    // 0–1
  effortLevel: 'low' | 'medium' | 'high';
}

export interface AiOptimizationSuggestion {
  summary: string;
  overallHealthScore: number;  // 0–100
  keyInsights: string[];
  actions: OptimizationAction[];
}

// ─── Governance ───────────────────────────────────────────────────────────────

export type GovernanceDecision = 'AUTO_APPLY_ALLOWED' | 'APPROVAL_REQUIRED' | 'BLOCKED';

export interface GovernedAction {
  action: OptimizationAction;
  governance: GovernanceDecision;
  governanceReason: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface GovernanceSummary {
  total: number;
  autoApply: number;
  approvalRequired: number;
  blocked: number;
}

// ─── Final report ─────────────────────────────────────────────────────────────

export interface OptimizationReport {
  workspaceId: string;
  campaignId: string;
  platform: string;
  mode: OptimizationMode;
  completedSteps: string[];
  errors: Record<string, string>;
  ruleAnalysis: RuleAnalysisResult | null;
  aiSuggestion: AiOptimizationSuggestion | null;
  rankedActions: ScoredAction[];
  governedActions: GovernedAction[];
  governanceSummary: GovernanceSummary | null;
  autoAppliedActions: ActionType[];
  generatedCreatives: any | null;
  summary: string;
  metadata: {
    model: string;
    tokensUsed: number;
    durationMs: number;
    runAt: Date;
  };
}
