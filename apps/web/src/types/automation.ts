import type { Platform } from './platform-config'

// ─── Automation Condition Types ────────────────────────────────────────────────

export type MetricType =
  | 'roas'                    // Return on Ad Spend
  | 'cpc'                     // Cost Per Click
  | 'cpa'                     // Cost Per Acquisition
  | 'cpl'                     // Cost Per Lead
  | 'clicks'                  // Number of clicks
  | 'impressions'             // Number of impressions
  | 'spend'                   // Total spend amount
  | 'conversions'             // Number of conversions
  | 'conversion_rate'         // Conversion rate %
  | 'ctr'                     // Click-through rate %

export type TimeFrame = '1d' | '3d' | '7d' | '30d'
export type ComparisonOperator = '>' | '<' | '=' | '>=' | '<='
export type BenchmarkType = 'dynamic' | 'static' | 'account_average'

export interface AutomationCondition {
  id: string
  metric: MetricType
  operator: ComparisonOperator
  value: number
  timeFrame: TimeFrame
  benchmarkType: BenchmarkType
  benchmarkValue?: number
  description: string
}

export interface AutomationConditionGroup {
  id: string
  conditions: AutomationCondition[]
  logicOperator: 'AND' | 'OR'  // How conditions in this group are combined
  description: string
}

// ─── Automation Action Types ──────────────────────────────────────────────────

export type ActionType =
  | 'increase_budget'
  | 'decrease_budget'
  | 'pause_campaign'
  | 'pause_adset'
  | 'pause_ad'
  | 'resume_campaign'
  | 'resume_adset'
  | 'resume_ad'
  | 'change_bid'

export type TargetLevel = 'campaign' | 'ad_set' | 'ad'

export interface AutomationAction {
  id: string
  type: ActionType
  targetLevel: TargetLevel
  value?: number  // For budget changes (percentage), bid changes (amount)
  unit?: 'percentage' | 'amount'
  revertAtMidnight?: boolean  // Auto-revert at midnight (for daily pauses)
  description: string
}

// ─── Automation Schedule ──────────────────────────────────────────────────────

export interface AutomationSchedule {
  enabled: boolean
  frequency: 'hourly' | 'daily' | 'weekly' | 'once'
  intervalMinutes?: number  // For hourly frequency
  daysOfWeek?: (0 | 1 | 2 | 3 | 4 | 5 | 6)[]  // 0 = Sunday
  hoursOfDay?: number[]  // [0-23]
  timezone: string
}

// ─── Automation Filter ────────────────────────────────────────────────────────

export interface AutomationFilter {
  campaignStatus?: 'active' | 'paused' | 'ended'
  adSetStatus?: 'active' | 'paused' | 'ended'
  ageMinimumHours?: number
  minSpend?: number
  platforms?: Platform[]
}

// ─── Main Automation Strategy ─────────────────────────────────────────────────

export interface AutomationStrategy {
  id: string
  name: string
  description: string
  strategyType: AutomationStrategyType
  enabled: boolean
  priority: number  // Lower number = higher priority

  // Core configuration
  platform: Platform
  targetLevel: TargetLevel
  conditionGroups: AutomationConditionGroup[]  // Multiple groups combined with OR
  actions: AutomationAction[]
  filters: AutomationFilter

  // Execution
  schedule: AutomationSchedule
  lastExecuted?: string  // ISO timestamp
  nextExecution?: string  // ISO timestamp
  executionHistory: AutomationExecution[]

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface AutomationExecution {
  id: string
  strategyId: string
  executedAt: string
  targetCount: number  // How many items were affected
  actionsPerformed: Record<string, number>  // Action type -> count
  success: boolean
  error?: string
}

// ─── Automation Strategy Templates ────────────────────────────────────────────

export type AutomationStrategyType =
  | 'scale_winning_campaigns'
  | 'scale_winning_adsets'
  | 'downscale_losing_campaigns'
  | 'downscale_losing_adsets'
  | 'stop_loss_no_clicks'
  | 'pause_losing_ads_daily'
  | 'pause_losing_ads_permanent'
  | 'custom'

export interface AutomationStrategyTemplate {
  id: AutomationStrategyType
  name: string
  description: string
  icon: string
  category: 'scaling' | 'downscaling' | 'safety' | 'custom'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  defaultConfig: Omit<AutomationStrategy, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>
  recommendations: string[]
  supportedPlatforms: Platform[]
}

// ─── Automation Stat ──────────────────────────────────────────────────────────

export interface AutomationStat {
  strategyId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalItemsAffected: number
  budgetImpact: number  // Total budget increased/decreased
  estimatedROASImprovement: number  // Estimated improvement based on conditions
  lastExecutedAt?: string
}
