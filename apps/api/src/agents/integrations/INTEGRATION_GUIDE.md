# Meta Ads API Integration Guide

## Overview

The **MetaPerformanceSyncService** enables the Performa marketplace to sync real campaign performance data directly from Meta Ads API into specialist (agent) profiles. This enhances the marketplace by providing verified, API-sourced metrics instead of relying solely on self-reported data.

### Key Capabilities

1. **Real-time Data Sync**: Pulls daily/monthly campaign metrics from Meta Ads Insights API
2. **Fraud Detection**: Validates metrics for unrealistic or suspicious patterns
3. **Automated Scheduling**: Syncs via cron job (daily) or manual trigger
4. **Multi-account Support**: Handles specialists with multiple ad accounts
5. **Rate Limit Management**: Exponential backoff and staggered requests
6. **Workspace Isolation**: All operations respect workspace boundaries
7. **Audit Trail**: Comprehensive logging of all sync operations

---

## Connection Flow

### Step 1: Specialist Connects Meta Account

When a specialist connects a Meta ad account via OAuth:

```
Specialist → [Auth Dialog] → Meta OAuth → Callback
                                            ↓
                          Upsert to ConnectedAccount
                          (with accessToken + refreshToken)
```

This is handled by the existing `MetaOAuthService` in `auth/meta-oauth.service.ts`.

**Result**: 
- `ConnectedAccount` record created with:
  - `platform`: "meta"
  - `accessToken`: Encrypted AES-256
  - `refreshToken`: Encrypted AES-256
  - `externalAccountId`: Meta ad account ID
  - `externalAccountName`: Human-readable name
  - `workspaceId`: Workspace context

### Step 2: Link Account to AgentProfile

When a specialist publishes their profile to the marketplace, link their connected Meta accounts:

```typescript
// In agents.service.ts or marketplace controller
const specialist = await agentProfileRepo.findOne({ id: profileId });
specialist.platforms = ["meta", ...]; // Add to platforms array
await agentProfileRepo.save(specialist);
```

---

## Usage

### Single Specialist Sync

Sync performance metrics for one specialist:

```typescript
// In your service/controller
import { MetaPerformanceSyncService } from "./integrations/meta-sync.service";

constructor(
  private readonly metaSyncService: MetaPerformanceSyncService,
) {}

async syncSpecialist(agentProfileId: string, workspaceId: string) {
  const result = await this.metaSyncService.syncSpecialistMetrics(
    agentProfileId,
    workspaceId,
    {
      dayLookback: 30,      // Last 30 days
      forceRefresh: false,  // Don't overwrite existing
      dryRun: false,        // Actually persist
    }
  );

  if (!result.success) {
    console.error("Sync failed:", result.errors);
  } else {
    console.log(`Synced ${result.campaignsSynced} campaigns`);
    console.log(`Fraud risk score: ${result.fraudRiskScore}`);
  }
}
```

### Bulk Workspace Sync

Sync all specialists in a workspace (useful for scheduled jobs):

```typescript
async syncWorkspace(workspaceId: string) {
  const results = await this.metaSyncService.syncAllSpecialists(
    workspaceId,
    { dayLookback: 30 }
  );

  const successful = results.filter(r => r.success).length;
  console.log(`${successful}/${results.length} specialists synced`);
}
```

### Configuration Options

```typescript
export interface MetricsPullConfig {
  /** Days to look back from today (1-365, default: 30) */
  dayLookback: number;
  
  /** If true, overwrite existing metrics for the period */
  forceRefresh: boolean;
  
  /** If true, validate but don't persist (dry run) */
  dryRun: boolean;
}
```

---

## Data Flow

### 1. Fetch Ad Accounts

```
ConnectedAccount.accessToken
        ↓
GET /v20.0/me/adaccounts
        ↓
MetaAdAccount[]
```

**Response fields used:**
- `id`: Account ID (e.g., "act_123456789")
- `name`: Account name
- `account_status`: 1=active, 2=disabled, 3=unsettled, etc.
- `currency`: Account currency (USD, EUR, etc.)
- `timezone_name`: Account timezone

### 2. Fetch Campaigns per Account

```
MetaAdAccount.id
        ↓
GET /v20.0/{account-id}/campaigns
        ↓
MetaCampaign[]
  - id
  - name
  - status
  - objective (e.g., LINK_CLICKS, CONVERSIONS, etc.)
```

### 3. Fetch Daily Insights

```
MetaAdAccount.id
        ↓
GET /v20.0/{account-id}/insights
  params: {
    date_start: YYYY-MM-DD,
    date_end: YYYY-MM-DD,
    time_increment: "1" (daily),
    fields: "campaign_id,campaign_name,date_start,spend,impressions,clicks,
             conversions,conversion_value,ctr,cpc"
  }
        ↓
MetaInsightRow[]
  - date: YYYY-MM-DD
  - spend: $X.XX
  - impressions: N
  - clicks: N
  - conversions: N
  - conversion_value: $Y.YY
```

### 4. Compute Derived Metrics

For each insight row:
```
CTR = (clicks / impressions) * 100          // Click-through rate
CPA = spend / conversions                    // Cost per acquisition
ROAS = conversion_value / spend              // Return on ad spend
```

### 5. Aggregate by Month

Group daily metrics by calendar month (aggregation_period = 1st of month):

```
Daily rows:
  - 2024-01-05: spend=100, impressions=5000, conversions=10, revenue=500
  - 2024-01-10: spend=150, impressions=7000, conversions=15, revenue=750
  
Aggregated to:
  - aggregation_period: 2024-01-01
  - totalSpend: 250
  - totalImpressions: 12000
  - avgCtr: (25 / 12000) * 100 = 0.208%
  - conversionCount: 25
  - totalRevenue: 1250
  - avgCpa: 250 / 25 = $10
  - avgRoas: 1250 / 250 = 5.0x
```

### 6. Validate with Fraud Detection

Check for suspicious patterns:

| Check | Threshold | Risk Score |
|-------|-----------|-----------|
| Negative spend | Any | +25 |
| CTR > 100% | Any (impossible) | +20 |
| Negative conversions | Any | +20 |
| ROAS outside [0, 100] | > 100 or < 0 | +15 |
| CPA outside [$0.01, $10k] | Outside range | +10 |
| ROAS spike > 2x historical | > 200% change | +10 |

**Score capped at 100**. If score > 50, sync status = "stale".

### 7. Store in Database

Upsert to `agent_platform_metrics`:

```sql
INSERT INTO agent_platform_metrics (
  agent_profile_id,
  platform,
  aggregation_period,
  total_spend,
  campaigns_count,
  avg_roas,
  avg_cpa,
  avg_ctr,
  conversion_count,
  total_revenue,
  source_type,
  is_verified,
  fraud_risk_score,
  synced_at
) VALUES (...)
ON CONFLICT (agent_profile_id, platform, aggregation_period)
DO UPDATE SET ...
```

**Key fields:**
- `platform`: "meta"
- `source_type`: "api_pull" (vs "manual_upload", "case_study")
- `is_verified`: true (came from API)
- `fraud_risk_score`: Computed by validation

### 8. Update Specialist Profile

Recalculate and store on `AgentProfile`:

```typescript
specialist.cachedStats = {
  avgROAS: avg(all months' avgRoas),
  avgCPA: avg(all months' avgCpa),
  avgCTR: avg(all months' avgCtr),
  totalCampaigns: sum(all months' campaigns),
  activeCampaigns: campaigns with recent activity,
  successRate: % campaigns with ROAS > 1.0,
  totalSpendManaged: sum(total_spend),
  bestROAS: max(avgRoas),
};

specialist.monthlyPerformance = [
  { month: "Jan", roas: 3.2, spend: 5000, campaigns: 15 },
  { month: "Feb", roas: 3.8, spend: 6200, campaigns: 18 },
  ...
];

specialist.lastPerformanceSync = now();
specialist.performanceSyncStatus = fraudScore > 50 ? "stale" : "healthy";
specialist.fraudRiskScore = fraudScore;
specialist.isPerformanceDataVerified = fraudScore <= 30;
```

---

## Error Handling

### Token Errors (Code 190)

**Scenario**: Access token expired during sync.

**Handling**:
1. Check `ConnectedAccount.tokenExpiresAt`
2. If expired and `refreshToken` exists:
   - Call `POST /oauth/access_token?grant_type=refresh_token`
   - Update `ConnectedAccount.accessToken` with new token
   - Update `tokenExpiresAt` (+60 days)
3. If refresh fails or no refresh token:
   - Log error
   - Mark `ConnectedAccount.isActive = false`
   - Skip this account
   - Continue with other accounts

### Rate Limit Errors (Code 17, 613)

**Scenario**: Meta API returns 429 Too Many Requests.

**Handling**:
1. Track per-account request rate
2. Implement exponential backoff: `min_delay = 100ms * backoff_multiplier`
3. Cap backoff at 10x (1 second)
4. Reset multiplier after successful request
5. Log rate limit hit
6. Retry with backoff (automatic)

### Missing Campaign Data

**Scenario**: Insight returned for campaign that doesn't exist.

**Handling**:
1. Maintain campaign ID set from `GET /campaigns`
2. Filter insights to only valid campaigns
3. Log orphaned insights
4. Continue with valid insights

### Disconnected Accounts

**Scenario**: ConnectedAccount exists but not linked to specialist profile.

**Handling**:
1. Sync only accounts where specialist is in workspace
2. Check `specialist.platforms.includes("meta")`
3. Skip if not included
4. Log warning

---

## Scheduling

### Manual Trigger

Sync on-demand via REST endpoint:

```typescript
// agents.controller.ts
@Post("/:agentId/sync-meta-metrics")
async syncMetrics(
  @Param("agentId") agentId: string,
  @Body() body?: { dayLookback?: number; forceRefresh?: boolean }
) {
  return this.metaSyncService.syncSpecialistMetrics(
    agentId,
    req.workspace.id,
    body || {}
  );
}
```

### Scheduled Daily Sync

Add to cron service:

```typescript
// agents-cron.service.ts
import { Cron } from "@nestjs/schedule";

@Cron("0 0 * * *") // Daily at midnight UTC
async syncAllMetricsDaily() {
  const workspaces = await this.workspaceRepo.find();
  
  for (const workspace of workspaces) {
    try {
      await this.metaSyncService.syncAllSpecialists(workspace.id, {
        dayLookback: 30,
      });
    } catch (err) {
      this.logger.error(`Daily sync failed for workspace ${workspace.id}`, err);
    }
  }
}
```

### Stagger Requests

To avoid rate limits:

```typescript
// Offset each workspace by N minutes
const offsetMinutes = (workspace.id.charCodeAt(0) % 60);
const cronPattern = `0 ${offsetMinutes} 0 * * *`; // Spread across hour
```

---

## Database Schema

### agent_platform_metrics table

```sql
CREATE TABLE agent_platform_metrics (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL,
  platform VARCHAR(20),              -- "meta", "google", "yandex", "tiktok"
  aggregation_period DATE,           -- First day of month for aggregation
  total_spend DECIMAL(15,2),
  campaigns_count INT,
  avg_roas DECIMAL(8,2),
  avg_cpa DECIMAL(10,2),
  avg_ctr DECIMAL(5,3),              -- Percentage (0-100)
  conversion_count INT,
  total_revenue DECIMAL(15,2),
  source_type ENUM('api_pull', 'manual_upload', 'case_study'),
  is_verified BOOLEAN,
  fraud_risk_score INT DEFAULT 0,    -- 0-100
  created_at TIMESTAMP,
  synced_at TIMESTAMP,
  
  UNIQUE (agent_profile_id, platform, aggregation_period),
  FOREIGN KEY (agent_profile_id) REFERENCES agent_profiles(id),
  INDEX (agent_profile_id, platform, aggregation_period),
  INDEX (synced_at)
);
```

### agent_profiles updates

New columns:
```sql
ALTER TABLE agent_profiles ADD COLUMN fraud_risk_score DECIMAL(3,2);
ALTER TABLE agent_profiles ADD COLUMN last_performance_sync TIMESTAMP;
ALTER TABLE agent_profiles ADD COLUMN performance_sync_status 
  ENUM('never_synced', 'healthy', 'stale', 'failed');
ALTER TABLE agent_profiles ADD COLUMN is_performance_data_verified BOOLEAN;
```

---

## Rate Limit Management

### Meta Ads API Limits

- **Read limit**: 200 requests per hour (per app + user)
- **Page size**: 200 results per page
- **Pagination**: Cursor-based

### Backoff Strategy

```
Request 1: immediate (0ms)
Request 2: 100ms delay
Request 3: 200ms delay
Request 4: 400ms delay
...
Request N: min(100ms * 2^(N-1), 1000ms)
```

### Per-Workspace Staggering

```typescript
// Spread syncs across the hour
const hash = agentProfileId.charCodeAt(0) % 60;
@Cron(`0 ${hash} 0 * * *`)
async syncMetrics() { ... }
```

---

## Validation Rules

### Metric Checks

| Metric | Valid Range | Fraud Check |
|--------|-------------|------------|
| Spend | ≥ 0 | < 0 = +25 risk |
| Impressions | ≥ 0 | Any negative = error |
| Clicks | ≥ 0 | Any negative = error |
| CTR | 0-100% | > 100% = +20 risk |
| CPA | $0.01-$10k | Outside = +10 risk |
| ROAS | 0-100 | < 0 or > 100 = +15 risk |
| Spike | < 2x historical | > 2x = +10 risk |

### Special Cases

1. **Zero conversions**: CPA and ROAS = null (not 0)
2. **Zero impressions**: CTR = 0 (not null)
3. **First sync**: Use averages, no spike check
4. **New specialist**: No historical comparison

---

## Monitoring & Alerting

### Log Levels

**INFO**:
- Sync started/completed
- Token refreshed
- Metrics persisted
- Profile updated

**WARN**:
- Sync skipped (no campaigns)
- Rate limit hit
- Token decryption issue
- Fraud warning raised

**ERROR**:
- Token expired (can't refresh)
- Account sync failed
- Metrics validation failed
- Profile update failed

### Key Metrics to Monitor

```typescript
{
  "sync_duration_ms": 5230,
  "accounts_synced": 3,
  "campaigns_synced": 47,
  "metrics_inserted": 45,
  "metrics_updated": 2,
  "fraud_risk_score": 15,
  "errors": [],
  "warnings": ["CTR spike detected"]
}
```

### Alert Conditions

- Fraud risk score > 50
- Sync duration > 30s
- Failed syncs in last 3 days
- Token refresh failures

---

## Testing

### Unit Tests

```typescript
// meta-sync.service.spec.ts
describe("MetaPerformanceSyncService", () => {
  it("should fetch and aggregate daily metrics by month", async () => {
    const result = await service.syncSpecialistMetrics(
      specialistId,
      workspaceId,
      { dryRun: true }
    );

    expect(result.success).toBe(true);
    expect(result.campaignsSynced).toBe(15);
  });

  it("should detect fraud in metrics", async () => {
    // Test unrealistic ROAS spike
    const result = await service.syncSpecialistMetrics(
      specialistId,
      workspaceId,
      { dryRun: true }
    );

    expect(result.fraudRiskScore).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should handle token refresh", async () => {
    // Mock expired token, verify refresh happens
  });

  it("should respect rate limits", async () => {
    // Verify delays between requests
  });
});
```

### Integration Tests

```typescript
// Test with real Meta sandbox API or mocked responses
describe("Integration: Meta API", () => {
  it("should sync real specialist metrics end-to-end", async () => {
    const specialist = await createTestSpecialist();
    const result = await service.syncSpecialistMetrics(
      specialist.id,
      workspace.id
    );

    expect(result.success).toBe(true);
    
    const metrics = await metricsRepo.find({
      where: { agentProfileId: specialist.id }
    });
    expect(metrics.length).toBeGreaterThan(0);
  });
});
```

---

## Security Considerations

### Token Storage

- All tokens encrypted AES-256-CBC
- Encryption key in environment (never committed)
- Decrypt on-demand, never log plaintext
- Tokens masked in logs: `token_start...token_end`

### Data Privacy

- Metrics isolated by workspace
- No cross-workspace data leakage
- Audit log all sync operations
- PII never stored (only campaign names)

### Rate Limit Abuse

- Per-account exponential backoff
- Max 10x backoff (1s minimum delay)
- Stagger workspace syncs
- Monitor for unusual patterns

---

## Troubleshooting

### Sync Fails with "No active Meta integration"

**Cause**: No ConnectedAccount found for workspace.

**Solution**:
1. Check OAuth completed successfully
2. Verify ConnectedAccount.isActive = true
3. Check workspace.id matches

### Metrics Show Unrealistic ROAS

**Cause**: Fraud detection flagged suspicious pattern.

**Solution**:
1. Check fraud_risk_score in result
2. Review warnings array
3. Verify campaign data in Meta Ads Manager
4. Check conversion tracking setup

### Sync Timeout After 30s

**Cause**: Too many campaigns or API is slow.

**Solution**:
1. Reduce dayLookback to 7 days
2. Check Meta API status page
3. Increase request timeout in config
4. Contact Meta support

### Token Refresh Fails

**Cause**: Refresh token expired (> 60 days) or revoked.

**Solution**:
1. Specialist must re-connect account via OAuth
2. Delete old ConnectedAccount record
3. Have specialist re-authorize

---

## API Reference

### syncSpecialistMetrics

```typescript
async syncSpecialistMetrics(
  agentProfileId: string,
  workspaceId: string,
  config?: Partial<MetricsPullConfig>
): Promise<PerformanceSyncResult>
```

**Returns**:
```typescript
{
  success: boolean;
  agentProfileId: string;
  agentDisplayName: string;
  metricsInserted: number;
  metricsUpdated: number;
  campaignsSynced: number;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  syncedAt: Date;
  fraudRiskScore: number;
  errors: string[];
  warnings: string[];
}
```

### syncAllSpecialists

```typescript
async syncAllSpecialists(
  workspaceId: string,
  config?: Partial<MetricsPullConfig>
): Promise<PerformanceSyncResult[]>
```

Syncs all verified specialists in a workspace.

---

## Next Steps

1. **Add REST endpoint** for manual trigger in agents.controller.ts
2. **Add cron job** in agents-cron.service.ts for daily scheduling
3. **Add to module** by importing IntegrationsModule in AgentsModule
4. **Write tests** for sync logic and fraud detection
5. **Monitor** sync results and fraud scores
6. **Iterate** on fraud detection rules based on real data
