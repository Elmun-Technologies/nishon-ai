# Meta Performance Sync API Reference

## Service: MetaPerformanceSyncService

Core service for syncing specialist performance metrics from Meta Ads API into the Performa marketplace.

**Location**: `apps/api/src/agents/integrations/meta-sync.service.ts`

**Module**: `IntegrationsModule`

---

## Main Methods

### `syncSpecialistMetrics()`

Syncs performance metrics for a single specialist.

```typescript
async syncSpecialistMetrics(
  agentProfileId: string,
  workspaceId: string,
  config?: Partial<MetricsPullConfig>
): Promise<PerformanceSyncResult>
```

**Parameters**:
- `agentProfileId` (string, required): UUID of the specialist/agent profile
- `workspaceId` (string, required): Workspace context for isolation
- `config` (object, optional):
  - `dayLookback` (number): Days to pull metrics for (1-365, default: 30)
  - `forceRefresh` (boolean): Overwrite existing metrics (default: false)
  - `dryRun` (boolean): Validate without persisting (default: false)

**Returns**: `PerformanceSyncResult`

**Example**:
```typescript
const result = await metaSyncService.syncSpecialistMetrics(
  "550e8400-e29b-41d4-a716-446655440000",
  "workspace-123",
  {
    dayLookback: 90,
    forceRefresh: true,
    dryRun: false
  }
);

if (result.success) {
  console.log(`Synced ${result.campaignsSynced} campaigns`);
  console.log(`Fraud score: ${result.fraudRiskScore}`);
} else {
  console.error("Sync failed:", result.errors);
}
```

**Throws**:
- `NotFoundException`: If specialist profile not found
- `BadRequestException`: If no Meta account connected or invalid config
- `InternalServerErrorException`: If database transaction fails

---

### `syncAllSpecialists()`

Syncs performance metrics for all verified specialists in a workspace.

```typescript
async syncAllSpecialists(
  workspaceId: string,
  config?: Partial<MetricsPullConfig>
): Promise<PerformanceSyncResult[]>
```

**Parameters**:
- `workspaceId` (string, required): Workspace to sync
- `config` (object, optional): Same as syncSpecialistMetrics

**Returns**: Array of `PerformanceSyncResult` (one per specialist)

**Example**:
```typescript
const results = await metaSyncService.syncAllSpecialists(
  "workspace-123",
  { dayLookback: 30 }
);

const successful = results.filter(r => r.success).length;
console.log(`${successful}/${results.length} specialists synced successfully`);

results.forEach(r => {
  if (!r.success) {
    console.error(`${r.agentDisplayName}: ${r.errors[0]}`);
  }
});
```

**Note**: Individual specialist failures don't stop the batch sync. Use the returned array to identify which specialists failed.

---

## Data Types

### PerformanceSyncResult

Result of a sync operation for one specialist.

```typescript
interface PerformanceSyncResult {
  success: boolean;                    // Did sync complete without errors?
  agentProfileId: string;              // Specialist ID
  agentDisplayName: string;            // Specialist display name
  metricsInserted: number;             // New metric rows added to DB
  metricsUpdated: number;              // Existing metric rows updated
  campaignsSynced: number;             // Total unique campaigns synced
  dateRangeStart: Date;                // Start of period
  dateRangeEnd: Date;                  // End of period
  syncedAt: Date;                      // When sync completed
  fraudRiskScore: number;              // 0-100, higher = more suspicious
  errors: string[];                    // Critical errors
  warnings: string[];                  // Non-fatal warnings
}
```

**Example result**:
```json
{
  "success": true,
  "agentProfileId": "550e8400-e29b-41d4-a716-446655440000",
  "agentDisplayName": "Ali Specialist",
  "metricsInserted": 12,
  "metricsUpdated": 0,
  "campaignsSynced": 45,
  "dateRangeStart": "2024-02-04T00:00:00.000Z",
  "dateRangeEnd": "2024-03-05T00:00:00.000Z",
  "syncedAt": "2024-03-05T12:30:45.123Z",
  "fraudRiskScore": 15,
  "errors": [],
  "warnings": [
    "Campaign 123456789: CTR spike detected (3.2% vs historical 1.8%)"
  ]
}
```

### MetricsPullConfig

Configuration options for metric pulls.

```typescript
interface MetricsPullConfig {
  dayLookback: number;        // 1-365 days (default: 30)
  forceRefresh: boolean;      // Overwrite existing (default: false)
  dryRun: boolean;            // Don't persist (default: false)
}
```

### MetaPerformanceRow

Normalized daily performance metric from Meta Ads API.

```typescript
interface MetaPerformanceRow {
  campaignId: string;         // Meta campaign ID
  campaignName: string;       // Campaign display name
  date: Date;                 // YYYY-MM-DD
  spend: number;              // $ spent
  impressions: number;        // Ad impressions
  clicks: number;             // Ad clicks
  conversions: number;        // Conversion count
  conversionValue: number;    // Revenue in $
  ctr: number;                // Clicks/impressions * 100 (%)
  cpa: number | null;         // Spend/conversions ($)
  roas: number | null;        // Revenue/spend (x)
}
```

### FraudValidationResult

Result of fraud detection validation.

```typescript
interface FraudValidationResult {
  isValid: boolean;           // Did metrics pass all checks?
  fraudRiskScore: number;     // 0-100
  reasons: string[];          // Why metrics are suspicious
}
```

---

## Database Schema

### agent_platform_metrics

Stores aggregated monthly performance metrics.

```sql
CREATE TABLE agent_platform_metrics (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL,           -- Foreign key
  platform VARCHAR(20) NOT NULL,            -- "meta", "google", etc.
  aggregation_period DATE NOT NULL,         -- First day of month
  
  total_spend DECIMAL(15,2),                -- Sum of all daily spend
  campaigns_count INT,                      -- Unique campaigns count
  avg_roas DECIMAL(8,2),                    -- Average ROAS for period
  avg_cpa DECIMAL(10,2),                    -- Average CPA for period
  avg_ctr DECIMAL(5,3),                     -- Average CTR (%)
  conversion_count INT,                     -- Total conversions
  total_revenue DECIMAL(15,2),              -- Sum of conversion values
  
  source_type ENUM('api_pull', 'manual_upload', 'case_study'),
  is_verified BOOLEAN,
  fraud_risk_score INT DEFAULT 0,           -- 0-100
  
  created_at TIMESTAMP,
  synced_at TIMESTAMP,
  
  UNIQUE(agent_profile_id, platform, aggregation_period),
  FOREIGN KEY (agent_profile_id) REFERENCES agent_profiles(id),
  INDEX (agent_profile_id, platform, aggregation_period),
  INDEX (synced_at)
);
```

### agent_profiles (updated)

Existing agent profile table with new performance-related columns.

```sql
ALTER TABLE agent_profiles ADD COLUMN (
  fraud_risk_score DECIMAL(3,2) DEFAULT 0,           -- Aggregate fraud score
  last_performance_sync TIMESTAMP DEFAULT NULL,      -- Last sync time
  performance_sync_status VARCHAR(20) DEFAULT 'never_synced',
                                                    -- 'never_synced', 'healthy', 'stale', 'failed'
  is_performance_data_verified BOOLEAN DEFAULT FALSE -- Passed fraud check?
);
```

---

## Meta Ads API Calls

### 1. GET /me/adaccounts

Fetch all ad accounts the token owner has access to.

```
GET https://graph.facebook.com/v20.0/me/adaccounts
  ?fields=id,name,account_status,currency,timezone_name
  &access_token=USER_TOKEN
```

**Response**:
```json
{
  "data": [
    {
      "id": "act_123456789",
      "name": "My Business Account",
      "account_status": 1,
      "currency": "USD",
      "timezone_name": "America/New_York"
    }
  ]
}
```

### 2. GET /{ad-account-id}/campaigns

Fetch all campaigns in an ad account.

```
GET https://graph.facebook.com/v20.0/act_123456789/campaigns
  ?fields=id,name,status,objective
  &access_token=USER_TOKEN
```

**Response**:
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "Summer Sale Campaign",
      "status": "ACTIVE",
      "objective": "LINK_CLICKS"
    }
  ]
}
```

### 3. GET /{ad-account-id}/insights

Fetch daily performance metrics for all campaigns in an account.

```
GET https://graph.facebook.com/v20.0/act_123456789/insights
  ?fields=campaign_id,campaign_name,date_start,spend,impressions,clicks,
           conversions,conversion_value,ctr,cpc
  &date_start=2024-02-04
  &date_end=2024-03-05
  &time_increment=1
  &access_token=USER_TOKEN
```

**Response**:
```json
{
  "data": [
    {
      "campaign_id": "123456789",
      "campaign_name": "Summer Sale Campaign",
      "date_start": "2024-02-04",
      "spend": "125.50",
      "impressions": "5000",
      "clicks": "150",
      "conversions": "12",
      "conversion_value": "600",
      "ctr": "3.0",
      "cpc": "0.84"
    }
  ]
}
```

---

## Error Handling

### Common Errors

| Error | Code | Cause | Handling |
|-------|------|-------|----------|
| Token Expired | 190 | Access token expired | Attempt refresh, notify user if fails |
| Rate Limited | 17, 613 | Too many requests | Exponential backoff, retry |
| Invalid Token | 104 | Token invalid/revoked | Mark account inactive, notify user |
| Permission Denied | 10 | Token doesn't have ads_read scope | Ask for re-authorization |
| Resource Not Found | 2500 | Campaign/account deleted | Log and skip |

### Retry Logic

**Retryable errors** (with exponential backoff):
- 17, 613 (rate limit)
- 190 (token expired, if refresh succeeds)

**Non-retryable errors** (fail immediately):
- 100-199 (authentication/authorization)
- 2500 (resource not found)
- 2501 (resource not available)

**Example backoff**:
```
Attempt 1: immediate
Attempt 2: 100ms delay
Attempt 3: 200ms delay
Attempt 4: 400ms delay
Attempt 5: 800ms delay
... (capped at 1000ms)
```

---

## Fraud Detection Rules

### Validation Checks

| Metric | Rule | Risk Points |
|--------|------|------------|
| Spend | Must be ≥ 0 | 25 if negative |
| Impressions | Must be ≥ 0 | 20 if negative |
| CTR | Must be 0-100% | 20 if > 100% |
| Conversions | Must be ≥ 0 | 20 if negative |
| CPA | Must be $0.01-$10,000 | 10 if outside range |
| ROAS | Must be 0-100 | 15 if < 0 or > 100 |
| ROAS Spike | < 2x historical avg | 10 if > 2x |

**Score**: Sum of risk points, capped at 100.

**Thresholds**:
- ≤ 30: Data verified (green)
- 31-50: Caution (yellow)
- > 50: Stale (red) — require manual review

---

## Rate Limiting

### Meta API Limits

- **Calls per hour**: 200 (per app + user)
- **Batch size**: 200 records per page
- **Pagination**: Cursor-based

### Service Rate Limiting

Per-account minimum delay between requests:

```
Base delay: 100ms
Backoff multiplier: Increases on 429 responses
Max multiplier: 10x (1000ms)
Reset: After successful request
```

**Example timeline**:
```
Account A:
  Request 1: t=0ms
  Request 2: t=100ms (100ms delay)
  Request 3: t=300ms (200ms delay)
  [Hit rate limit]
  Request 4: t=700ms (backoff increases)
  ...
```

---

## Configuration

### Environment Variables

```bash
# Meta OAuth (required)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_CALLBACK_URL=https://api.example.com/meta/callback

# Encryption (required)
ENCRYPTION_KEY=your-32-character-hex-key

# Optional
FRAUD_DETECTION_ENABLED=true
MAX_SYNC_DURATION_MS=30000
```

### Database Connection

Requires TypeORM with these entities:
- `AgentProfile`
- `AgentPlatformMetrics`
- `ConnectedAccount`
- `Workspace`

---

## Examples

### Example 1: Manual Sync via REST API

```bash
curl -X POST \
  https://api.example.com/agents/550e8400-e29b-41d4-a716-446655440000/sync-meta-metrics \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dayLookback": 30,
    "forceRefresh": false
  }'

# Response:
{
  "success": true,
  "message": "Synced 45 campaigns",
  "data": {
    "agentDisplayName": "Ali Specialist",
    "campaignsSynced": 45,
    "metricsInserted": 12,
    "metricsUpdated": 0,
    "fraudRiskScore": 15,
    "dateRange": {
      "start": "2024-02-04T00:00:00.000Z",
      "end": "2024-03-05T00:00:00.000Z"
    },
    "warnings": [],
    "errors": []
  }
}
```

### Example 2: Validate Before Publishing

```typescript
// Check metrics before making specialist public
const validation = await metaSyncService.syncSpecialistMetrics(
  specialistId,
  workspaceId,
  { dryRun: true }  // Don't persist
);

if (validation.fraudRiskScore > 50) {
  throw new Error("Metrics suspicious, cannot publish");
}

// If validation passes, sync for real
const result = await metaSyncService.syncSpecialistMetrics(
  specialistId,
  workspaceId,
  { dryRun: false }
);
```

### Example 3: Scheduled Daily Sync

```typescript
@Cron("0 0 * * *")  // Daily at midnight UTC
async dailyMetricsSync() {
  const workspace = await workspaceRepo.findOne(id);
  
  const results = await metaSyncService.syncAllSpecialists(
    workspace.id,
    { dayLookback: 30 }
  );

  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    await notifyAdmins({
      event: "sync_failures",
      count: failures.length,
      specialists: failures.map(r => r.agentDisplayName)
    });
  }
}
```

### Example 4: Handle Token Refresh

```typescript
try {
  const result = await metaSyncService.syncSpecialistMetrics(...);
} catch (err) {
  if (err instanceof TokenExpiredError) {
    // Token auto-refreshed, retry
    const result = await metaSyncService.syncSpecialistMetrics(...);
  } else if (err instanceof RateLimitError) {
    // Queue for retry after recommended delay
    queue.scheduleRetry(specialist, {
      delayMs: err.retryAfterSeconds * 1000
    });
  }
}
```

---

## Performance Characteristics

### Typical Sync Time

For a specialist with 50 campaigns across 3 accounts:

```
- Fetch accounts: 200ms
- Fetch campaigns: 300ms per account = 900ms
- Fetch insights: 800ms per account = 2400ms
- Fraud validation: 100ms
- Database upsert: 500ms
─────────────────────
Total: ~4.8 seconds
```

### Optimization Tips

1. **Batch multiple specialists**: Use `syncAllSpecialists()` for better efficiency
2. **Reduce lookback**: Use `dayLookback: 7` for frequent syncs
3. **Skip validation on retry**: Cache fraud scores if re-syncing same period
4. **Stagger by workspace**: Offset cron jobs to avoid thundering herd

---

## Monitoring Metrics

Track these for service health:

```
sync_duration_ms          // How long sync takes
campaigns_synced_count    // Campaigns per sync
metrics_inserted_count    // New rows added
metrics_updated_count     // Rows updated
fraud_risk_score_avg      // Average fraud score
sync_success_rate         // % of successful syncs
token_refresh_count       // Refreshes per day
rate_limit_hits           // 429 responses
```

---

## Troubleshooting

**Q: Sync fails with "No active Meta integration"**
- A: Specialist hasn't connected Meta account via OAuth
- Fix: Have specialist complete OAuth flow in settings

**Q: Fraud risk score very high**
- A: Metrics failed validation (unrealistic ROAS, CTR spike, etc.)
- Fix: Review metrics in Meta Ads Manager, ensure conversion tracking works

**Q: Sync times out (> 30s)**
- A: Too many campaigns or Meta API is slow
- Fix: Reduce `dayLookback`, check Meta API status, increase timeout

**Q: Token refresh keeps failing**
- A: Refresh token expired (> 60 days)
- Fix: Specialist must re-authorize via OAuth

---

## Related Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) — Detailed data flow and concepts
- [Implementation Examples](./IMPLEMENTATION_EXAMPLES.md) — Code samples
- Meta Graph API Docs: https://developers.facebook.com/docs/marketing-api
