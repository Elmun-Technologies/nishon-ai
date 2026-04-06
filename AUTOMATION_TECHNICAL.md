# Automation System - Technical Documentation

## Architecture Overview

The automation system follows a layered architecture:

```
┌─────────────────────────────────────────────────────┐
│ UI Layer (React Components)                          │
│ - AutomationPage, CreateAutomation, ViewAutomation │
└────────────────┬────────────────────────────────────┘
                 │
┌─────────────────┴────────────────────────────────────┐
│ State Management (Zustand)                           │
│ - useAutomationStore()                               │
└────────────────┬────────────────────────────────────┘
                 │
┌─────────────────┴────────────────────────────────────┐
│ Type Definitions                                     │
│ - automation.ts (types)                              │
│ - automation-templates.ts (presets)                  │
│ - platform-config.ts (platform support)             │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── types/
│   ├── automation.ts                    # Core type definitions
│   └── automation-templates.ts          # 7 pre-built templates
│
├── stores/
│   └── automation.store.ts              # Zustand store (mock data)
│
├── utils/
│   └── platform-adapter.ts              # Platform-specific adapters
│
└── app/(dashboard)/
    └── automation/
        ├── page.tsx                     # Main dashboard
        ├── create/
        │   └── page.tsx                 # Create new automation
        ├── [id]/
        │   ├── page.tsx                 # View automation details
        │   └── edit/
        │       └── page.tsx             # Edit automation
        └── components/
            ├── ConditionBuilder.tsx     # Build conditions UI
            ├── ActionBuilder.tsx        # Build actions UI
            ├── ScheduleForm.tsx         # Configure schedule
            └── TemplateSelector.tsx     # Template selection UI
```

## Type Definitions

### Core Types (automation.ts)

```typescript
// Condition for automation trigger
interface AutomationCondition {
  id: string
  metric: MetricType           // 'roas', 'cpc', 'cpa', etc.
  operator: ComparisonOperator // '>', '<', '=', etc.
  value: number
  timeFrame: TimeFrame          // '1d', '3d', '7d', '30d'
  benchmarkType: 'dynamic' | 'static' | 'account_average'
  benchmarkValue?: number
  description: string
}

// Group of conditions combined with AND/OR logic
interface AutomationConditionGroup {
  id: string
  conditions: AutomationCondition[]
  logicOperator: 'AND' | 'OR'
  description: string
}

// Action to perform when conditions are met
interface AutomationAction {
  id: string
  type: ActionType  // 'increase_budget', 'pause_campaign', etc.
  targetLevel: TargetLevel  // 'campaign', 'ad_set', 'ad'
  value?: number    // Budget % or bid amount
  unit?: 'percentage' | 'amount'
  revertAtMidnight?: boolean
  description: string
}

// Complete automation strategy
interface AutomationStrategy {
  id: string
  name: string
  description: string
  strategyType: AutomationStrategyType
  enabled: boolean
  priority: number
  
  platform: Platform
  targetLevel: TargetLevel
  conditionGroups: AutomationConditionGroup[]  // Multiple groups = OR logic
  actions: AutomationAction[]
  filters: AutomationFilter
  
  schedule: AutomationSchedule
  lastExecuted?: string
  executionHistory: AutomationExecution[]
  
  createdAt: string
  updatedAt: string
}

// Execution record
interface AutomationExecution {
  id: string
  strategyId: string
  executedAt: string
  targetCount: number        // Items affected
  actionsPerformed: Record<string, number>
  success: boolean
  error?: string
}

// Statistics tracking
interface AutomationStat {
  strategyId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalItemsAffected: number
  budgetImpact: number
  estimatedROASImprovement: number
  lastExecutedAt?: string
}
```

## Template Structure

### Template Template (automation-templates.ts)

Each template follows this structure:

```typescript
const AUTOMATION_TEMPLATES: Record<string, AutomationStrategyTemplate> = {
  strategy_id: {
    id: 'strategy_id',
    name: 'Human-Readable Name',
    description: 'What this strategy does',
    icon: '📊',
    category: 'scaling' | 'downscaling' | 'safety' | 'custom',
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    supportedPlatforms: ['meta', 'google', 'tiktok', 'yandex'],
    
    recommendations: [
      'Start with 5-6% budget increase',
      'Set frequency to every 30-60 minutes',
      // ... more recommendations
    ],
    
    defaultConfig: {
      // Pre-filled AutomationStrategy (minus id, dates, history)
      name: '...',
      conditionGroups: [
        {
          id: 'primary',
          logicOperator: 'AND',
          description: '...',
          conditions: [
            {
              metric: 'roas',
              operator: '>',
              value: 1.1,
              timeFrame: '7d',
              benchmarkType: 'dynamic',
              description: 'ROAS last 7 days > 1.1x account average',
            },
            // ... more conditions
          ],
        },
      ],
      actions: [
        {
          type: 'increase_budget',
          targetLevel: 'campaign',
          value: 5,
          unit: 'percentage',
        },
      ],
      schedule: {
        enabled: true,
        frequency: 'hourly',
        intervalMinutes: 30,
        hoursOfDay: [0, 1, 2],
        timezone: 'UTC',
      },
    },
  },
}
```

## Store Implementation (automation.store.ts)

### Usage Example

```typescript
// Get automations
const { automations, stats } = useAutomationStore()

// Create new automation from template
const addAutomation = useAutomationStore((s) => s.addAutomation)
addAutomation({
  name: 'My Scale Strategy',
  description: '...',
  strategyType: 'scale_winning_campaigns',
  enabled: true,
  priority: 10,
  platform: 'meta',
  targetLevel: 'campaign',
  // ... rest of config
})

// Toggle enable/disable
const toggleAutomation = useAutomationStore((s) => s.toggleAutomation)
toggleAutomation('auto_1')

// Execute automation
const executeAutomation = useAutomationStore((s) => s.executeAutomation)
executeAutomation('auto_1')

// Simulate execution (preview impact)
const simulateExecution = useAutomationStore((s) => s.simulateExecution)
const { wouldAffect, preview } = simulateExecution('auto_1')
```

### Mock Data Strategy

Currently uses mock data for development:
- 2 pre-populated automations (scale + stop loss)
- Execution history tracking
- Simulated execution with random results

**Migration to Real Data:**
1. Replace MOCK_AUTOMATIONS with API call
2. Replace store actions with API mutations
3. Implement WebSocket for execution updates
4. Track actual metrics from ad platforms

## Condition Logic

### How Conditions Work

Multiple `AutomationConditionGroup`s are combined with **OR** logic:

```
(Group1_Condition1 AND Group1_Condition2 AND Group1_Condition3)
OR
(Group2_Condition1 AND Group2_Condition2)
OR
(Group3_Condition1)
```

**Example: Pause Losing Ads Permanent**

Group 1 (No clicks):
- Amount spent last 7d > 3x CPA
- **AND** Zero clicks last 7d
- **AND** Age > 7 days

**OR**

Group 2 (High CPC + Low ROAS):
- CPC last 7d > $6
- **AND** CPC last 3d > $6
- **AND** ROAS < 0.28
- **AND** Age > 7 days

**OR**

Group 3 (Consistently poor):
- CPC last 7d > $6
- **AND** ROAS < 0.5

## Metrics and Benchmarking

### Supported Metrics

```typescript
type MetricType =
  | 'roas'              // Return on Ad Spend
  | 'cpc'               // Cost Per Click
  | 'cpa'               // Cost Per Acquisition
  | 'cpl'               // Cost Per Lead
  | 'clicks'            // Raw click count
  | 'impressions'       // Raw impression count
  | 'spend'             // Total spend
  | 'conversions'       // Total conversions
  | 'conversion_rate'   // Conversion rate %
  | 'ctr'               // Click-through rate %
```

### Benchmarking Types

```typescript
type BenchmarkType = 'dynamic' | 'static' | 'account_average'
```

- **Dynamic**: Compares to real-time account average
- **Static**: Fixed threshold (e.g., ROAS > 2.0)
- **Account Average**: Uses stored account average

## Platform Support Matrix

| Strategy | Meta | Google | TikTok | Yandex |
|----------|------|--------|--------|--------|
| Scale Winning | ✅ | ✅ | ✅ | ❌ |
| Scale Ad Sets | ✅ | ❌ | ✅ | ❌ |
| Downscale Campaigns | ✅ | ✅ | ✅ | ❌ |
| Downscale Ad Sets | ✅ | ❌ | ✅ | ❌ |
| Stop Loss | ✅ | ✅ | ✅ | ✅ |
| Pause Daily | ✅ | ✅ | ✅ | ❌ |
| Pause Permanent | ✅ | ✅ | ✅ | ❌ |

## Execution Flow

```
┌─────────────────────────────┐
│ Scheduled Execution Trigger  │
│ (Time, Event, Manual)        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 1. Load Strategy             │
│    (Get from store)          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 2. Fetch Data                │
│    (Metrics from API)        │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 3. Evaluate Conditions       │
│    (Check if criteria met)   │
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
    ✅ Met           ❌ Not Met
      │                 │
      ▼                 ▼
┌──────────────┐   └─► End
│ 4. Execute   │
│    Actions   │
└──────────────┘
      │
      ▼
┌──────────────────────┐
│ 5. Log Execution     │
│    - Success/Failure │
│    - Items Affected  │
│    - Update Stats    │
└──────────────────────┘
```

## Implementation Checklist

### Phase 1: Core (✅ Complete)
- [x] Type definitions
- [x] Template presets
- [x] Zustand store
- [x] Dashboard UI
- [x] Sidebar integration

### Phase 2: UI Components (Next)
- [ ] ConditionBuilder component
- [ ] ActionBuilder component
- [ ] ScheduleForm component
- [ ] TemplateSelector component
- [ ] CreateAutomation page
- [ ] EditAutomation page
- [ ] ViewAutomation page

### Phase 3: Backend Integration (Future)
- [ ] API endpoints for CRUD
- [ ] Real execution engine
- [ ] Webhook handling
- [ ] Analytics tracking
- [ ] Email notifications

### Phase 4: Advanced Features (Future)
- [ ] A/B testing automations
- [ ] Multi-automation orchestration
- [ ] Performance analytics
- [ ] Custom metric definitions
- [ ] Condition templates library

## Best Practices

### 1. Always Use Dynamic Benchmarking
```typescript
// ✅ Good
condition.benchmarkType = 'dynamic'
condition.operator = '>'
condition.value = 1.1  // 1.1x of account average

// ❌ Avoid
condition.benchmarkType = 'static'
condition.benchmarkValue = 2.5  // Fixed value
```

### 2. Layer Multiple Timeframes
```typescript
// ✅ Good - Three layers
conditions: [
  { metric: 'roas', timeFrame: '7d', operator: '>', value: 1.1 },
  { metric: 'roas', timeFrame: '3d', operator: '>', value: 1.1 },
  { metric: 'roas', timeFrame: '1d', operator: '>', value: 1.1 },
]

// ❌ Bad - Single signal
conditions: [
  { metric: 'roas', timeFrame: '7d', operator: '>', value: 1.1 },
]
```

### 3. Include Safety Conditions
```typescript
// ✅ Good - Protects new campaigns
conditions: [
  { metric: 'spend', operator: '>', value: 120, description: 'Age > 120 hours' },
]

// ❌ Bad - Could affect new campaigns
// No age/spend check
```

### 4. Start Conservative
```typescript
// ✅ Good
action.value = 5  // 5% increase

// ❌ Bad
action.value = 20  // 20% increase on first run
```

## Testing Strategies

### Unit Testing
```typescript
// Test condition evaluation
describe('Condition Evaluation', () => {
  it('should evaluate ROAS condition correctly', () => {
    const condition = {
      metric: 'roas',
      operator: '>',
      value: 1.1,
      benchmarkType: 'static',
    }
    expect(evaluateCondition(2.5, condition)).toBe(true)
    expect(evaluateCondition(0.8, condition)).toBe(false)
  })
})
```

### Integration Testing
```typescript
// Test full automation execution
describe('Automation Execution', () => {
  it('should execute strategy when conditions met', async () => {
    const automation = AUTOMATION_TEMPLATES.scale_winning_campaigns.defaultConfig
    const result = await executeAutomation(automation)
    expect(result.success).toBe(true)
    expect(result.targetCount).toBeGreaterThan(0)
  })
})
```

## API Integration (Future)

Expected API contracts:

```typescript
// GET /api/automations
// Returns: AutomationStrategy[]

// POST /api/automations
// Body: Omit<AutomationStrategy, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>
// Returns: AutomationStrategy

// PUT /api/automations/:id
// Body: Partial<AutomationStrategy>
// Returns: AutomationStrategy

// DELETE /api/automations/:id
// Returns: { success: boolean }

// POST /api/automations/:id/execute
// Returns: AutomationExecution

// POST /api/automations/:id/simulate
// Returns: { wouldAffect: number, preview: string[] }

// GET /api/automations/:id/stats
// Returns: AutomationStat

// GET /api/automations/:id/executions
// Returns: AutomationExecution[]
```

## Monitoring and Debugging

### Logging
```typescript
// Log automation execution
console.log('Executing automation:', automation.id)
console.log('Conditions met:', conditionResults)
console.log('Actions performed:', actionResults)
console.log('Execution time:', executionTime)
```

### Metrics to Track
- Execution frequency vs. scheduled frequency
- Success/failure rates
- Average items affected per execution
- Budget impact over time
- ROAS improvement correlation

## Performance Considerations

- **Condition Evaluation**: O(n) where n = number of conditions
- **Action Execution**: Depends on platform API limits
- **Data Fetching**: Cache metrics to reduce API calls
- **History Storage**: Keep last 50 executions, archive rest

---

**Last Updated:** 2024-01-21
