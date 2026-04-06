import type { AutomationStrategyTemplate } from './automation'

// ─── Template Presets ─────────────────────────────────────────────────────────

export const AUTOMATION_TEMPLATES: Record<string, AutomationStrategyTemplate> = {
  scale_winning_campaigns: {
    id: 'scale_winning_campaigns',
    name: 'Scale Winning Campaigns',
    description:
      'Automatically increase budgets for CBO campaigns performing above your benchmarks. Ideal for scaling proven winners.',
    icon: '📈',
    category: 'scaling',
    difficulty: 'beginner',
    supportedPlatforms: ['meta', 'google', 'tiktok'],
    recommendations: [
      'Start with 5-6% budget increase instead of default 16%',
      'Set frequency to run every 30-60 minutes',
      'Schedule automations for 12am-2am to give campaigns 24 hours to spend updated budget',
      'Always use dynamic benchmarking instead of static values',
      'Include safety condition: Hours since creation > 120 hours (5 days)',
    ],
    defaultConfig: {
      name: 'Scale Winning Campaigns',
      description: 'Automatically scale CBO campaigns performing above account average',
      strategyType: 'scale_winning_campaigns',
      enabled: false,
      priority: 10,
      platform: 'meta',
      targetLevel: 'campaign',

      // Conditions: ROAS-based scaling
      conditionGroups: [
        {
          id: 'primary',
          logicOperator: 'AND',
          description: 'Campaign performing well in multiple timeframes',
          conditions: [
            {
              id: 'roas_7d',
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'ROAS in last 7 days > 1.1x account average',
            },
            {
              id: 'roas_3d',
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '3d',
              benchmarkType: 'dynamic',
              description: 'ROAS in last 3 days > 1.1x account average',
            },
            {
              id: 'roas_1d',
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '1d',
              benchmarkType: 'dynamic',
              description: 'ROAS yesterday > 1.1x account average',
            },
            {
              id: 'age_safety',
              metric: 'spend',
              operator: '>',
              value: 120,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'Hours since creation > 120 hours (5 days)',
            },
          ],
        },
      ],

      // Action: Increase budget by percentage
      actions: [
        {
          id: 'increase_budget',
          type: 'increase_budget',
          targetLevel: 'campaign',
          value: 5,
          unit: 'percentage',
          revertAtMidnight: false,
          description: 'Increase campaign budget by 5%',
        },
      ],

      // Filters
      filters: {
        campaignStatus: 'active',
        ageMinimumHours: 120,
      },

      // Schedule: Every 30-60 minutes, 12am-2am
      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 30,
        hoursOfDay: [0, 1, 2],
        timezone: 'UTC',
      },
    },
  },

  scale_winning_adsets: {
    id: 'scale_winning_adsets',
    name: 'Scale Winning Ad Sets',
    description:
      'Automatically increase budgets for ABO ad sets performing above your benchmarks. Perfect for testing different audiences and creatives.',
    icon: '📊',
    category: 'scaling',
    difficulty: 'beginner',
    supportedPlatforms: ['meta', 'tiktok'],
    recommendations: [
      'Start with 5-6% budget increase for conservative scaling',
      'Set frequency to run every 30-60 minutes',
      'Schedule for specific days and hours (not continuously)',
      'Use dynamic benchmarking for ROAS thresholds',
      'Ensure ad sets have been active for at least 5 days before scaling',
    ],
    defaultConfig: {
      name: 'Scale Winning Ad Sets',
      description: 'Automatically scale ABO ad sets performing above account average',
      strategyType: 'scale_winning_adsets',
      enabled: false,
      priority: 20,
      platform: 'meta',
      targetLevel: 'ad_set',

      conditionGroups: [
        {
          id: 'performance',
          logicOperator: 'AND',
          description: 'Ad set performing well across multiple timeframes',
          conditions: [
            {
              id: 'roas_7d',
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'ROAS last 7 days > 1.1x account average',
            },
            {
              id: 'roas_3d',
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '3d',
              benchmarkType: 'dynamic',
              description: 'ROAS last 3 days > 1.1x account average',
            },
            {
              id: 'roas_1d',
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '1d',
              benchmarkType: 'dynamic',
              description: 'ROAS yesterday > 1.1x account average',
            },
            {
              id: 'age_check',
              metric: 'spend',
              operator: '>',
              value: 120,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'Age > 120 hours',
            },
          ],
        },
      ],

      actions: [
        {
          id: 'increase_budget',
          type: 'increase_budget',
          targetLevel: 'ad_set',
          value: 5,
          unit: 'percentage',
          description: 'Increase ad set budget by 5%',
        },
      ],

      filters: {
        adSetStatus: 'active',
        ageMinimumHours: 120,
      },

      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 30,
        hoursOfDay: [0, 1, 2],
        timezone: 'UTC',
      },
    },
  },

  downscale_losing_campaigns: {
    id: 'downscale_losing_campaigns',
    name: 'Downscale Losing Campaigns',
    description:
      'Automatically decrease budgets for CBO campaigns underperforming your benchmarks. Protects budget from poor performers.',
    icon: '📉',
    category: 'downscaling',
    difficulty: 'beginner',
    supportedPlatforms: ['meta', 'google', 'tiktok'],
    recommendations: [
      'Be more aggressive with cuts (15-25%) than with scaling',
      'Use inverse conditions from scaling (less than instead of greater than)',
      'Add spending threshold: Amount spent > 3x cost per purchase',
      'Schedule for same time as scaling automations (12am-2am)',
      'Monitor closely to ensure you\'re not cutting new campaigns prematurely',
    ],
    defaultConfig: {
      name: 'Downscale Losing Campaigns',
      description: 'Automatically reduce budgets for underperforming CBO campaigns',
      strategyType: 'downscale_losing_campaigns',
      enabled: false,
      priority: 30,
      platform: 'meta',
      targetLevel: 'campaign',

      conditionGroups: [
        {
          id: 'poor_performance',
          logicOperator: 'AND',
          description: 'Campaign underperforming across multiple timeframes',
          conditions: [
            {
              id: 'roas_7d_low',
              metric: 'roas',
              operator: '<',
              value: 0.9,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'ROAS last 7 days < 0.9x account average',
            },
            {
              id: 'roas_3d_low',
              metric: 'roas',
              operator: '<',
              value: 0.9,
              timeFrame: '3d',
              benchmarkType: 'dynamic',
              description: 'ROAS last 3 days < 0.9x account average',
            },
            {
              id: 'min_spend',
              metric: 'spend',
              operator: '>',
              value: 3,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'Spent > 3x cost per purchase (minimum data)',
            },
          ],
        },
      ],

      actions: [
        {
          id: 'decrease_budget',
          type: 'decrease_budget',
          targetLevel: 'campaign',
          value: 20,
          unit: 'percentage',
          description: 'Decrease campaign budget by 20%',
        },
      ],

      filters: {
        campaignStatus: 'active',
        ageMinimumHours: 120,
      },

      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 30,
        hoursOfDay: [0, 1, 2],
        timezone: 'UTC',
      },
    },
  },

  downscale_losing_adsets: {
    id: 'downscale_losing_adsets',
    name: 'Downscale Losing Ad Sets',
    description:
      'Automatically decrease budgets for ABO ad sets underperforming your benchmarks. Prevents wasting budget on poor-performing audience/creative combinations.',
    icon: '📊',
    category: 'downscaling',
    difficulty: 'beginner',
    supportedPlatforms: ['meta', 'tiktok'],
    recommendations: [
      'Be aggressive with budget cuts (15-25%)',
      'Combine with scaling automation for balanced optimization',
      'Add minimum spend threshold to avoid cutting new ad sets',
      'Review paused/cut ad sets weekly to identify issues',
    ],
    defaultConfig: {
      name: 'Downscale Losing Ad Sets',
      description: 'Automatically reduce budgets for underperforming ABO ad sets',
      strategyType: 'downscale_losing_adsets',
      enabled: false,
      priority: 40,
      platform: 'meta',
      targetLevel: 'ad_set',

      conditionGroups: [
        {
          id: 'underperformance',
          logicOperator: 'AND',
          description: 'Ad set with poor performance metrics',
          conditions: [
            {
              id: 'roas_7d_low',
              metric: 'roas',
              operator: '<',
              value: 0.9,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'ROAS last 7 days < 0.9x account average',
            },
            {
              id: 'min_spend_check',
              metric: 'spend',
              operator: '>',
              value: 3,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'Minimum spend threshold met',
            },
          ],
        },
      ],

      actions: [
        {
          id: 'decrease_budget',
          type: 'decrease_budget',
          targetLevel: 'ad_set',
          value: 20,
          unit: 'percentage',
          description: 'Decrease ad set budget by 20%',
        },
      ],

      filters: {
        adSetStatus: 'active',
        ageMinimumHours: 120,
      },

      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 30,
        hoursOfDay: [0, 1, 2],
        timezone: 'UTC',
      },
    },
  },

  stop_loss_no_clicks: {
    id: 'stop_loss_no_clicks',
    name: 'Stop Loss - No Clicks',
    description:
      'Automatically pauses ads spending money but receiving zero clicks. Re-enables at midnight. Good safety measure for unusual scenarios.',
    icon: '🛑',
    category: 'safety',
    difficulty: 'beginner',
    supportedPlatforms: ['meta', 'google', 'tiktok', 'yandex'],
    recommendations: [
      'Good safety measure even if scenario is uncommon',
      'Requires at least 2 active ads in ad set to avoid making entire ad set inactive',
      'Uses dynamic account averages by default',
      'Ads re-enable automatically at midnight',
    ],
    defaultConfig: {
      name: 'Stop Loss - No Clicks',
      description: 'Pause ads spending money with zero clicks (re-enables at midnight)',
      strategyType: 'stop_loss_no_clicks',
      enabled: false,
      priority: 5,
      platform: 'meta',
      targetLevel: 'ad',

      conditionGroups: [
        {
          id: 'no_engagement',
          logicOperator: 'AND',
          description: 'Ad spending money without any clicks',
          conditions: [
            {
              id: 'zero_clicks',
              metric: 'clicks',
              operator: '=',
              value: 0,
              timeFrame: '1d',
              benchmarkType: 'static',
              description: 'Zero clicks today',
            },
            {
              id: 'has_spend',
              metric: 'spend',
              operator: '>',
              value: 5,
              timeFrame: '1d',
              benchmarkType: 'static',
              description: 'Has spent more than $5 today',
            },
          ],
        },
      ],

      actions: [
        {
          id: 'pause_ad',
          type: 'pause_ad',
          targetLevel: 'ad',
          revertAtMidnight: true,
          description: 'Pause ad for the day',
        },
      ],

      filters: {
        minSpend: 5,
      },

      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 60,
        timezone: 'UTC',
      },
    },
  },

  pause_losing_ads_daily: {
    id: 'pause_losing_ads_daily',
    name: 'Pause Losing Ads - Daily',
    description:
      'Automatically pauses underperforming ads for today based on poor performance metrics. Re-enables at midnight.',
    icon: '⏸️',
    category: 'safety',
    difficulty: 'intermediate',
    supportedPlatforms: ['meta', 'google', 'tiktok'],
    recommendations: [
      'Switch default values to dynamic benchmarking',
      'Base thresholds on your account\'s average cost per purchase/lead',
      'Monitor what gets paused and adjust conditions accordingly',
      'Ads automatically re-enable at midnight',
      'Good for daily budget protection without permanent changes',
    ],
    defaultConfig: {
      name: 'Pause Losing Ads - Daily',
      description: 'Daily protection: pause underperforming ads (re-enable at midnight)',
      strategyType: 'pause_losing_ads_daily',
      enabled: false,
      priority: 15,
      platform: 'meta',
      targetLevel: 'ad',

      conditionGroups: [
        {
          id: 'no_purchases',
          logicOperator: 'OR',
          description: 'High spend with zero purchases OR low ROAS',
          conditions: [
            {
              id: 'high_spend_no_conversion',
              metric: 'spend',
              operator: '>',
              value: 20,
              timeFrame: '1d',
              benchmarkType: 'static',
              description: 'Spent $20+ today with zero purchases',
            },
            {
              id: 'poor_roas',
              metric: 'roas',
              operator: '<',
              value: 0.5,
              timeFrame: '1d',
              benchmarkType: 'dynamic',
              description: 'ROAS < 0.5x account average',
            },
          ],
        },
      ],

      actions: [
        {
          id: 'pause_daily',
          type: 'pause_ad',
          targetLevel: 'ad',
          revertAtMidnight: true,
          description: 'Pause ad for rest of today',
        },
      ],

      filters: {
        minSpend: 5,
      },

      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 30,
        timezone: 'UTC',
      },
    },
  },

  pause_losing_ads_permanent: {
    id: 'pause_losing_ads_permanent',
    name: 'Pause Losing Ads - Permanent',
    description:
      'Most complex strategy: permanently pause ads based on multiple performance criteria. For experienced media buyers only.',
    icon: '💀',
    category: 'safety',
    difficulty: 'advanced',
    supportedPlatforms: ['meta', 'google', 'tiktok'],
    recommendations: [
      'ADVANCED: Only for experienced media buyers',
      'Better to create custom automation from scratch if possible',
      'Monitor closely and adjust thresholds based on account performance',
      'Test conditions with small subset first',
      'Review paused ads weekly to validate decisions',
      'Use multiple condition groups for layered decision-making',
    ],
    defaultConfig: {
      name: 'Pause Losing Ads - Permanent',
      description: 'Permanent pause: Remove ads with persistent poor performance',
      strategyType: 'pause_losing_ads_permanent',
      enabled: false,
      priority: 50,
      platform: 'meta',
      targetLevel: 'ad',

      conditionGroups: [
        {
          id: 'no_clicks_group',
          logicOperator: 'AND',
          description: 'Ad has spent money but generated no engagement',
          conditions: [
            {
              id: 'high_spend_7d',
              metric: 'spend',
              operator: '>',
              value: 3,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'Spent > 3x cost per purchase in 7 days',
            },
            {
              id: 'zero_clicks_7d',
              metric: 'clicks',
              operator: '=',
              value: 0,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'Zero clicks in 7 days',
            },
            {
              id: 'age_7days',
              metric: 'spend',
              operator: '>',
              value: 168,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'Ad age > 7 days',
            },
          ],
        },
        {
          id: 'high_cpc_low_roas',
          logicOperator: 'AND',
          description: 'High cost per click with poor ROAS',
          conditions: [
            {
              id: 'cpc_7d_high',
              metric: 'cpc',
              operator: '>',
              value: 6,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'CPC last 7 days > $6',
            },
            {
              id: 'cpc_3d_high',
              metric: 'cpc',
              operator: '>',
              value: 6,
              timeFrame: '3d',
              benchmarkType: 'static',
              description: 'CPC last 3 days > $6',
            },
            {
              id: 'roas_poor',
              metric: 'roas',
              operator: '<',
              value: 0.28,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'ROAS < 0.28',
            },
            {
              id: 'age_7d',
              metric: 'spend',
              operator: '>',
              value: 168,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'Ad age > 7 days',
            },
          ],
        },
        {
          id: 'consistently_poor',
          logicOperator: 'AND',
          description: 'Consistently poor performance over time',
          conditions: [
            {
              id: 'high_cpc_7d',
              metric: 'cpc',
              operator: '>',
              value: 6,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'CPC last 7 days > $6',
            },
            {
              id: 'low_roas',
              metric: 'roas',
              operator: '<',
              value: 0.5,
              timeFrame: '7d',
              benchmarkType: 'static',
              description: 'ROAS < 0.5',
            },
          ],
        },
      ],

      actions: [
        {
          id: 'pause_permanent',
          type: 'pause_ad',
          targetLevel: 'ad',
          revertAtMidnight: false,
          description: 'Permanently pause ad',
        },
      ],

      filters: {
        minSpend: 50,
        ageMinimumHours: 168,
      },

      schedule: {
        enabled: true,
        frequency: 'daily',
        hoursOfDay: [0],
        timezone: 'UTC',
      },
    },
  },
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getTemplate(templateId: string): AutomationStrategyTemplate | undefined {
  return AUTOMATION_TEMPLATES[templateId]
}

export function getTemplatesByCategory(
  category: AutomationStrategyTemplate['category']
): AutomationStrategyTemplate[] {
  return Object.values(AUTOMATION_TEMPLATES).filter((t) => t.category === category)
}

export function getTemplatesByDifficulty(
  difficulty: AutomationStrategyTemplate['difficulty']
): AutomationStrategyTemplate[] {
  return Object.values(AUTOMATION_TEMPLATES).filter((t) => t.difficulty === difficulty)
}

export function getTemplatesByPlatform(platform: string): AutomationStrategyTemplate[] {
  return Object.values(AUTOMATION_TEMPLATES).filter((t) =>
    t.supportedPlatforms.includes(platform as any)
  )
}
