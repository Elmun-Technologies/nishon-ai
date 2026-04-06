import { create } from 'zustand'
import type { AutomationStrategy, AutomationStat } from '@/types/automation'
import { AUTOMATION_TEMPLATES } from '@/types/automation-templates'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_AUTOMATIONS: AutomationStrategy[] = [
  {
    id: 'auto_1',
    name: 'Scale Winning Campaigns - Meta',
    description: 'Automatically increase budgets for Meta campaigns with ROAS > 1.1x',
    strategyType: 'scale_winning_campaigns',
    enabled: true,
    priority: 10,
    platform: 'meta',
    targetLevel: 'campaign',
    conditionGroups: AUTOMATION_TEMPLATES.scale_winning_campaigns.defaultConfig.conditionGroups,
    actions: AUTOMATION_TEMPLATES.scale_winning_campaigns.defaultConfig.actions,
    filters: AUTOMATION_TEMPLATES.scale_winning_campaigns.defaultConfig.filters,
    schedule: AUTOMATION_TEMPLATES.scale_winning_campaigns.defaultConfig.schedule,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    lastExecuted: '2024-01-21T02:15:00Z',
    executionHistory: [
      {
        id: 'exec_1',
        strategyId: 'auto_1',
        executedAt: '2024-01-21T02:15:00Z',
        targetCount: 3,
        actionsPerformed: { increase_budget: 3 },
        success: true,
      },
      {
        id: 'exec_2',
        strategyId: 'auto_1',
        executedAt: '2024-01-21T02:45:00Z',
        targetCount: 2,
        actionsPerformed: { increase_budget: 2 },
        success: true,
      },
    ],
  },
  {
    id: 'auto_2',
    name: 'Stop Loss - No Clicks',
    description: 'Pause ads spending money with zero clicks (re-enable at midnight)',
    strategyType: 'stop_loss_no_clicks',
    enabled: true,
    priority: 5,
    platform: 'meta',
    targetLevel: 'ad',
    conditionGroups: AUTOMATION_TEMPLATES.stop_loss_no_clicks.defaultConfig.conditionGroups,
    actions: AUTOMATION_TEMPLATES.stop_loss_no_clicks.defaultConfig.actions,
    filters: AUTOMATION_TEMPLATES.stop_loss_no_clicks.defaultConfig.filters,
    schedule: AUTOMATION_TEMPLATES.stop_loss_no_clicks.defaultConfig.schedule,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    lastExecuted: '2024-01-21T03:00:00Z',
    executionHistory: [
      {
        id: 'exec_3',
        strategyId: 'auto_2',
        executedAt: '2024-01-21T03:00:00Z',
        targetCount: 1,
        actionsPerformed: { pause_ad: 1 },
        success: true,
      },
    ],
  },
]

const MOCK_STATS: AutomationStat[] = [
  {
    strategyId: 'auto_1',
    totalExecutions: 45,
    successfulExecutions: 44,
    failedExecutions: 1,
    totalItemsAffected: 112,
    budgetImpact: 8500,
    estimatedROASImprovement: 1.23,
    lastExecutedAt: '2024-01-21T02:45:00Z',
  },
  {
    strategyId: 'auto_2',
    totalExecutions: 156,
    successfulExecutions: 155,
    failedExecutions: 1,
    totalItemsAffected: 47,
    budgetImpact: -2300,
    estimatedROASImprovement: 1.05,
    lastExecutedAt: '2024-01-21T03:00:00Z',
  },
]

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AutomationStore {
  automations: AutomationStrategy[]
  stats: AutomationStat[]
  isLoading: boolean

  // Automation actions
  addAutomation: (automation: Omit<AutomationStrategy, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>) => void
  updateAutomation: (id: string, updates: Partial<AutomationStrategy>) => void
  deleteAutomation: (id: string) => void
  toggleAutomation: (id: string) => void
  getAutomationsByPlatform: (platform: string) => AutomationStrategy[]
  getAutomationsByType: (type: string) => AutomationStrategy[]

  // Statistics actions
  getStat: (strategyId: string) => AutomationStat | undefined
  getStats: (strategyIds: string[]) => AutomationStat[]

  // Execution
  executeAutomation: (id: string) => void
  simulateExecution: (id: string) => { wouldAffect: number; preview: string[] }
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useAutomationStore = create<AutomationStore>((set, get) => ({
  automations: MOCK_AUTOMATIONS,
  stats: MOCK_STATS,
  isLoading: false,

  addAutomation: (data) => {
    const newAutomation: AutomationStrategy = {
      ...data,
      id: `auto_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      executionHistory: [],
    }
    set((s) => ({ automations: [newAutomation, ...s.automations] }))

    // Initialize stats
    set((s) => ({
      stats: [
        ...s.stats,
        {
          strategyId: newAutomation.id,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalItemsAffected: 0,
          budgetImpact: 0,
          estimatedROASImprovement: 1.0,
        },
      ],
    }))
  },

  updateAutomation: (id, updates) =>
    set((s) => ({
      automations: s.automations.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : a
      ),
    })),

  deleteAutomation: (id) =>
    set((s) => ({
      automations: s.automations.filter((a) => a.id !== id),
      stats: s.stats.filter((st) => st.strategyId !== id),
    })),

  toggleAutomation: (id) =>
    set((s) => ({
      automations: s.automations.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      ),
    })),

  getAutomationsByPlatform: (platform) =>
    get().automations.filter((a) => a.platform === platform),

  getAutomationsByType: (type) =>
    get().automations.filter((a) => a.strategyType === type),

  getStat: (strategyId) =>
    get().stats.find((s) => s.strategyId === strategyId),

  getStats: (strategyIds) =>
    get().stats.filter((s) => strategyIds.includes(s.strategyId)),

  executeAutomation: (id) => {
    const { automations, stats } = get()
    const automation = automations.find((a) => a.id === id)
    if (!automation) return

    // Simulate execution
    const execution = {
      id: `exec_${Date.now()}`,
      strategyId: id,
      executedAt: new Date().toISOString(),
      targetCount: Math.floor(Math.random() * 10) + 1,
      actionsPerformed: automation.actions.reduce(
        (acc, action) => ({ ...acc, [action.type]: Math.floor(Math.random() * 5) + 1 }),
        {} as Record<string, number>
      ),
      success: Math.random() > 0.05, // 95% success rate
    }

    // Update automation with execution
    set((s) => ({
      automations: s.automations.map((a) =>
        a.id === id
          ? {
              ...a,
              lastExecuted: execution.executedAt,
              executionHistory: [execution, ...a.executionHistory].slice(0, 50),
            }
          : a
      ),
    }))

    // Update stats
    set((s) => ({
      stats: s.stats.map((st) =>
        st.strategyId === id
          ? {
              ...st,
              totalExecutions: st.totalExecutions + 1,
              successfulExecutions: execution.success ? st.successfulExecutions + 1 : st.successfulExecutions,
              failedExecutions: !execution.success ? st.failedExecutions + 1 : st.failedExecutions,
              totalItemsAffected: st.totalItemsAffected + execution.targetCount,
              lastExecutedAt: execution.executedAt,
            }
          : st
      ),
    }))
  },

  simulateExecution: (id) => {
    const automation = get().automations.find((a) => a.id === id)
    if (!automation) return { wouldAffect: 0, preview: [] }

    // Simulate what would happen
    const affectedCount = Math.floor(Math.random() * 15) + 1
    const preview = []

    for (let i = 0; i < Math.min(affectedCount, 5); i++) {
      const action = automation.actions[0]
      preview.push(
        `${action.type === 'increase_budget' ? '📈' : action.type === 'decrease_budget' ? '📉' : '⏸️'} ` +
          `Campaign ${Math.floor(Math.random() * 100)}: ${action.description}`
      )
    }

    if (affectedCount > 5) {
      preview.push(`... and ${affectedCount - 5} more items`)
    }

    return { wouldAffect: affectedCount, preview }
  },
}))
