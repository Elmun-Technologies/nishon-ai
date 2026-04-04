# Fraud Detection Service - API Reference

## FraudDetectionService

Main service for fraud detection and metric validation.

### Methods

#### `verify(agentId: string, platform: string, metrics: MetricsData): Promise<FraudDetectionResult>`

**Purpose**: Verify performance data for an agent and return fraud detection result.

**Parameters**:
- `agentId` (string, required): UUID of the agent profile
- `platform` (string, required): Ad platform ('meta', 'google', 'yandex', 'tiktok', 'telegram')
- `metrics` (MetricsData, required): Performance metrics to verify

**Returns**: `Promise<FraudDetectionResult>`

**Example**:
```typescript
const result = await fraudDetectionService.verify(
  'agent-uuid',
  'meta',
  {
    platform: 'meta',
    totalSpend: 5000,
    campaignsCount: 10,
    avgRoas: 4.5,
    avgCpa: 8.2,
    avgCtr: 2.5,
    conversionCount: 100,
    totalRevenue: 22500,
    clicks: 500,
    impressions: 10000,
    timestamp: new Date(),
  }
);

if (!result.passed) {
  console.log(`Fraud detected: ${result.reason}`);
  // Block metric publication
}
```

**Behavior**:
- Runs all fraud checks (ROAS, spend spike, conversion rate, CPC, data consistency)
- Calculates fraud risk score
- Updates agent.fraudRiskScore in database
- Returns comprehensive result with failed checks

---

#### `getFraudRiskScore(agentId: string): Promise<number>`

**Purpose**: Get current fraud risk score for an agent.

**Parameters**:
- `agentId` (string, required): UUID of the agent profile

**Returns**: `Promise<number>` - Risk score from 0 (safe) to 1 (high risk)

**Example**:
```typescript
const riskScore = await fraudDetectionService.getFraudRiskScore('agent-uuid');
console.log(`Agent fraud risk: ${(riskScore * 100).toFixed(1)}%`);
```

**Behavior**:
- Retrieves cached score from database
- Returns 0 if agent not found
- Fast lookup, no heavy computation

---

#### `getPlatformThresholds(platform: string): PlatformThresholds`

**Purpose**: Get fraud detection thresholds for a specific platform.

**Parameters**:
- `platform` (string, required): Platform name

**Returns**: `PlatformThresholds` object

**Example**:
```typescript
const thresholds = fraudDetectionService.getPlatformThresholds('meta');
console.log(`Max ROAS: ${thresholds.maxRoas}`);
console.log(`Max conversion rate: ${thresholds.maxConversionRate}%`);
```

**Threshold Object**:
```typescript
{
  maxRoas: number;              // Max ROAS before warning
  maxConversionRate: number;    // Max conversion rate %
  maxSpendSpikeMoM: number;     // Max MoM spend increase %
  maxCpcVariance: number;       // Max CPC coefficient of variation %
  minCampaignCount: number;     // Minimum campaigns
  maxDataAge: number;           // Max data age in hours
}
```

---

#### `setPlatformThresholds(platform: string, thresholds: Partial<PlatformThresholds>): void`

**Purpose**: Update fraud detection thresholds for a platform (admin only).

**Parameters**:
- `platform` (string, required): Platform name
- `thresholds` (Partial<PlatformThresholds>, required): New threshold values

**Example**:
```typescript
fraudDetectionService.setPlatformThresholds('meta', {
  maxRoas: 18,
  maxConversionRate: 18,
  maxSpendSpikeMoM: 60,
});
```

**Behavior**:
- Updates runtime thresholds
- Does not persist to database (use FraudDetectionAdminService.adjustThresholds for that)
- Used for fine-tuning per-market or per-segment rules

---

## FraudDetectionAdminService

Administrative service for managing fraud detection and reviews.

### Methods

#### `reviewFraudAudit(auditId: string, action: AdminFraudAction, adminId: string, comment?: string): Promise<FraudDetectionAudit>`

**Purpose**: Review and take action on a fraud detection audit.

**Parameters**:
- `auditId` (string, required): ID of fraud detection audit
- `action` (AdminFraudAction, required): Action to take
  ```typescript
  {
    action: 'approve' | 'reject' | 'mark_false_positive',
    comment?: string,
    rule?: string,  // For mark_false_positive
  }
  ```
- `adminId` (string, required): UUID of admin user
- `comment` (string, optional): Override comment from action object

**Returns**: `Promise<FraudDetectionAudit>`

**Examples**:

Approve:
```typescript
await adminService.reviewFraudAudit(
  'audit-uuid',
  { action: 'approve' },
  'admin-uuid',
  'Verified manually. No fraud detected.'
);
```

Mark false positive:
```typescript
await adminService.reviewFraudAudit(
  'audit-uuid',
  {
    action: 'mark_false_positive',
    rule: 'roas_anomaly',
  },
  'admin-uuid',
  'Agent legitimately achieved high ROAS during holiday season.'
);
```

---

#### `approveMetrics(metricId: string, adminId: string, comment?: string): Promise<void>`

**Purpose**: Approve metrics for publication after fraud review.

**Parameters**:
- `metricId` (string, required): ID of agent platform metrics
- `adminId` (string, required): UUID of admin user
- `comment` (string, optional): Approval comment

**Example**:
```typescript
await adminService.approveMetrics(
  'metric-uuid',
  'admin-uuid',
  'Approved after manual verification'
);
```

**Behavior**:
- Sets metrics.isVerified = true
- Logs audit trail
- Unblocks metric publication

---

#### `rejectMetrics(metricId: string, adminId: string, reason: string): Promise<void>`

**Purpose**: Reject suspicious metrics and block publication.

**Parameters**:
- `metricId` (string, required): ID of agent platform metrics
- `adminId` (string, required): UUID of admin user
- `reason` (string, required): Reason for rejection

**Example**:
```typescript
await adminService.rejectMetrics(
  'metric-uuid',
  'admin-uuid',
  'Data does not match platform reporting. Conversion numbers are inconsistent.'
);
```

**Behavior**:
- Sets metrics.isVerified = false
- Logs audit trail with reason
- Prevents metric publication

---

#### `analyzeFraudRisk(agentId: string): Promise<FraudRiskAnalysis>`

**Purpose**: Get comprehensive fraud risk analysis for an agent.

**Parameters**:
- `agentId` (string, required): UUID of agent profile

**Returns**: `Promise<FraudRiskAnalysis>`

**Response Structure**:
```typescript
{
  agentId: string,
  displayName: string,
  currentRiskScore: number,  // 0-1
  trends: {
    riskTrend: 'improving' | 'stable' | 'declining',
    recentIssueCount: number,
    criticalCount: number,
  },
  recentAudits: FraudDetectionAudit[],
  topFailedRules: [
    {
      rule: string,
      count: number,
      lastOccurred: Date,
      severity: string,
    }
  ],
  recommendations: string[],
}
```

**Example**:
```typescript
const analysis = await adminService.analyzeFraudRisk('agent-uuid');
console.log(`Risk score: ${analysis.currentRiskScore}`);
console.log(`Trend: ${analysis.trends.riskTrend}`);
console.log(`Top issues: ${analysis.topFailedRules.map(r => r.rule).join(', ')}`);
```

---

#### `getAuditHistory(agentId: string, days?: number, limit?: number): Promise<FraudDetectionAudit[]>`

**Purpose**: Get fraud detection audit history for an agent.

**Parameters**:
- `agentId` (string, required): UUID of agent profile
- `days` (number, optional): Number of days to look back (default: 30)
- `limit` (number, optional): Max records to return (default: 50)

**Returns**: `Promise<FraudDetectionAudit[]>`

**Example**:
```typescript
const audits = await adminService.getAuditHistory('agent-uuid', 90, 100);
const criticalCount = audits.filter(a => !a.passed).length;
console.log(`${criticalCount} critical issues in 90 days`);
```

---

#### `getHighRiskAgents(riskThreshold?: number, limit?: number): Promise<AgentProfile[]>`

**Purpose**: Get agents with fraud risk above threshold.

**Parameters**:
- `riskThreshold` (number, optional): Minimum risk score (default: 0.5)
- `limit` (number, optional): Max agents to return (default: 20)

**Returns**: `Promise<AgentProfile[]>`

**Example**:
```typescript
const highRiskAgents = await adminService.getHighRiskAgents(0.7, 10);
highRiskAgents.forEach(agent => {
  console.log(`${agent.displayName}: ${(agent.fraudRiskScore * 100).toFixed(1)}%`);
});
```

---

#### `adjustThresholds(platform: string, thresholds: Record<string, number>, adminId: string): Promise<void>`

**Purpose**: Adjust fraud detection thresholds for a platform (admin only).

**Parameters**:
- `platform` (string, required): Platform name
- `thresholds` (Record<string, number>, required): New threshold values
  ```typescript
  {
    maxRoas?: number,
    maxConversionRate?: number,
    maxSpendSpikeMoM?: number,
    maxCpcVariance?: number,
    maxDataAge?: number,
  }
  ```
- `adminId` (string, required): UUID of admin user

**Example**:
```typescript
await adminService.adjustThresholds(
  'meta',
  {
    maxRoas: 20,
    maxConversionRate: 18,
    maxSpendSpikeMoM: 60,
  },
  'admin-uuid'
);
```

**Validation**:
- Thresholds must be positive numbers
- maxRoas >= 2
- maxConversionRate >= 1%
- Invalid values throw BadRequestException

---

#### `getFraudStatistics(): Promise<FraudStatistics>`

**Purpose**: Get overall fraud detection statistics for dashboard.

**Returns**: `Promise<FraudStatistics>`

**Response Structure**:
```typescript
{
  totalAgents: number,
  highRiskAgents: number,
  averageRiskScore: number,      // 0-1
  recentCriticalIssues: number,  // Last 7 days
  totalAudits: number,
}
```

**Example**:
```typescript
const stats = await adminService.getFraudStatistics();
console.log(`Total agents: ${stats.totalAgents}`);
console.log(`High-risk agents: ${stats.highRiskAgents}`);
console.log(`Critical issues (7d): ${stats.recentCriticalIssues}`);
```

---

## Data Types

### MetricsData

```typescript
interface MetricsData {
  platform: 'meta' | 'google' | 'yandex' | 'tiktok' | 'telegram';
  totalSpend: number;
  campaignsCount: number;
  avgRoas: number;
  avgCpa: number;
  avgCtr: number;
  conversionCount: number;
  totalRevenue: number;
  clicks?: number;
  impressions?: number;
  timestamp?: Date;
}
```

### FraudDetectionResult

```typescript
interface FraudDetectionResult {
  passed: boolean;
  riskScore: number;        // 0-1
  reason: string;
  failedChecks: FailedCheck[];
  timestamp: Date;
}
```

### FailedCheck

```typescript
interface FailedCheck {
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  value?: number | string;
  threshold?: number | string;
}
```

### FraudDetectionAudit (Entity)

```typescript
interface FraudDetectionAudit {
  id: string;
  agentProfileId: string;
  action: 'fraud_check' | 'admin_approved' | 'admin_rejected' | 'marked_false_positive' | 'threshold_adjusted';
  platform: string;
  riskScore: number;
  passed: boolean;
  failedChecks?: Array<{
    rule: string;
    severity: string;
    message: string;
    value?: number | string;
    threshold?: number | string;
  }>;
  adminComment?: string;
  adminId?: string;
  falsePosRule?: string;
  sourceType?: 'api_pull' | 'manual_upload' | 'case_study';
  createdAt: Date;
}
```

### PlatformThresholds

```typescript
interface PlatformThresholds {
  maxRoas: number;
  maxConversionRate: number;
  maxSpendSpikeMoM: number;
  maxCpcVariance: number;
  minCampaignCount: number;
  maxDataAge: number;  // hours
}
```

---

## Injection

Both services are provided by `AgentsModule` and can be injected:

```typescript
import { FraudDetectionService } from './services/fraud-detection.service';
import { FraudDetectionAdminService } from './services/fraud-detection-admin.service';

@Injectable()
export class MyService {
  constructor(
    private fraudDetection: FraudDetectionService,
    private fraudAdmin: FraudDetectionAdminService,
  ) {}
}
```

---

## Error Handling

Both services follow NestJS conventions:

- Throw `BadRequestException` for validation errors
- Throw `NotFoundException` for missing resources
- Return graceful defaults on database errors
- Log errors for debugging

Example:

```typescript
try {
  const result = await fraudDetectionService.verify(agentId, platform, metrics);
} catch (error) {
  if (error instanceof NotFoundException) {
    // Agent not found
  } else if (error instanceof BadRequestException) {
    // Invalid input
  } else {
    // Unexpected error - logged automatically
  }
}
```

---

## Performance Notes

- **verify()**: ~100-200ms (includes database updates)
- **getFraudRiskScore()**: ~5-10ms (cached lookup)
- **analyzeFraudRisk()**: ~50-100ms (queries last 30 days)
- **getHighRiskAgents()**: ~50-100ms (indexed query)

All queries use database indexes for optimal performance.

---

## Related Entities

- `AgentProfile` - Updated with fraudRiskScore and fraudAudits
- `AgentPlatformMetrics` - Has isVerified flag
- `AgentPerformanceSyncLog` - Tracks data sources
- `FraudDetectionAudit` - New entity (created by migration)

---

## Migration

To deploy fraud detection:

1. Run migration: `1712350000000-AddFraudDetectionAudit.ts`
2. Update `AgentsModule` (already done)
3. Deploy service code
4. Configure platform thresholds if needed
5. Monitor logs for issues

---

## Testing

Unit tests in `fraud-detection.service.spec.ts`:

```bash
npm test -- fraud-detection.service.spec.ts
npm test -- fraud-detection.service.spec.ts --coverage
```

Example test:

```typescript
it('should flag high ROAS as warning', async () => {
  const result = await service.verify(agentId, 'meta', {
    ...validMetrics,
    avgRoas: 18,
  });

  expect(result.failedChecks).toContainEqual(
    expect.objectContaining({ rule: 'roas_anomaly' })
  );
});
```
