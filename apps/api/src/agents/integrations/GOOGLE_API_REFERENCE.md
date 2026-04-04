# Google Ads Performance Sync API Reference

## Service: GooglePerformanceSyncService

Core service for syncing specialist performance metrics from Google Ads API v15 into the Performa marketplace.

**Location**: `apps/api/src/agents/integrations/google-sync.service.ts`

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
const result = await googleSyncService.syncSpecialistMetrics(
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
- `BadRequestException`: If no Google Ads account connected or invalid config
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
const results = await googleSyncService.syncAllSpecialists(
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

### GooglePerformanceRow

Normalized daily performance metric from Google Ads API.

```typescript
interface GooglePerformanceRow {
  campaignId: string;         // Google Ads campaign ID
  campaignName: string;       // Campaign display name
  date: Date;                 // YYYY-MM-DD
  spend: number;              // $ spent (from cost_micros)
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

Stores aggregated monthly performance metrics for all platforms.

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

### service_engagements (for Google Ads)

Stores OAuth tokens and customer configuration.

```sql
CREATE TABLE service_engagements (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  platform_type VARCHAR(20),         -- "google_ads"
  external_account_id VARCHAR(255),  -- Customer ID (numeric string)
  external_account_name VARCHAR(255),-- Display name
  access_token VARCHAR(255) NOT NULL,   -- Encrypted AES-256
  refresh_token VARCHAR(255),            -- Encrypted AES-256
  client_id VARCHAR(255),
  client_secret VARCHAR(255),            -- Encrypted AES-256
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  INDEX (workspace_id, platform_type, is_active),
  UNIQUE (workspace_id, platform_type, external_account_id)
);
```

---

## Google Ads API Calls

### 1. Get Campaigns (GAQL Search)

Fetch all campaigns in a customer account.

```
POST https://googleads.googleapis.com/v15/customers/{customerId}/googleAds:search
Headers:
  Authorization: Bearer ACCESS_TOKEN
  Content-Type: application/json
  developer-token: DEVELOPER_TOKEN

Body:
{
  "query": "SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE status != REMOVED ORDER BY campaign.id"
}
```

**Response**:
```json
{
  "results": [
    {
      "campaign": {
        "id": "123456789",
        "name": "Summer Sale Campaign",
        "status": 2  // ENABLED
      }
    }
  ]
}
```

### 2. Get Campaign Metrics (GAQL Search)

Fetch daily performance metrics for all campaigns.

```
POST https://googleads.googleapis.com/v15/customers/{customerId}/googleAds:search
Headers:
  Authorization: Bearer ACCESS_TOKEN
  Content-Type: application/json
  developer-token: DEVELOPER_TOKEN

Body:
{
  "query": "SELECT campaign.id, campaign.name, segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversion_value FROM campaign WHERE status != REMOVED AND segments.date >= '2024-02-04' AND segments.date <= '2024-03-05' ORDER BY segments.date DESC"
}
```

**Response**:
```json
{
  "results": [
    {
      "campaign": {
        "id": "123456789",
        "name": "Summer Sale Campaign"
      },
      "segments": {
        "date": "2024-03-05"
      },
      "metrics": {
        "impressions": "5000",
        "clicks": "150",
        "cost_micros": "125500000",  // $125.50
        "conversions": "12.0",
        "conversion_value": "600.00"
      }
    }
  ]
}
```

---

## Error Handling

### Common Errors

| Error | Code | Cause | Handling |
|-------|------|-------|----------|
| Token Expired | 401 | Access token expired | Attempt refresh, notify user if fails |
| Rate Limited | 429 | Too many requests | Throttle, wait for window to clear |
| Invalid Credentials | 401 | Token invalid/revoked | Mark account inactive, notify user |
| Permission Denied | 403 | Token doesn't have correct scopes | Ask for re-authorization |
| Resource Not Found | 404 | Campaign/account deleted | Log and skip |

### Retry Logic

**Retryable errors** (with throttling/backoff):
- 429 (rate limit) — automatic throttling
- 401 (token expired, if refresh succeeds)

**Non-retryable errors** (fail immediately):
- 400-499 (authentication/authorization)
- 404 (resource not found)

**Example throttling**:
```
Google Ads API limit: 10 requests per 10 seconds

If approaching limit:
  - Calculate wait time until oldest request expires
  - Wait for that duration
  - Proceed with new request
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

### Google Ads API Limits

- **Calls per 10 seconds**: 10
- **Daily operations**: 50,000 (operations ≈ requests)
- **Pagination**: N/A (GAQL handles it)

### Service Rate Limiting

Per-customer tracking of requests in 10-second window:

```typescript
// Track timestamps of last 10 requests
const requestTimestamps = [];

// Before each request:
if (requestTimestamps.length >= 10) {
  const oldestTime = requestTimestamps[0];
  const waitMs = 10000 - (now - oldestTime) + 100;
  if (waitMs > 0) await sleep(waitMs);
}

requestTimestamps.push(Date.now());
```

**Example timeline**:
```
Customer A:
  Request 1: t=0ms
  Request 2: t=100ms (window not full yet)
  Request 3: t=200ms
  ...
  Request 10: t=900ms (window still has capacity)
  Request 11: t=1000ms (oldest = t=0, window full)
    -> must wait until t=10,100ms before proceeding
```

---

## Configuration

### Environment Variables

```bash
# Google Cloud OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=https://api.example.com/auth/google/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token

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
- `ServiceEngagement`
- `Workspace`

---

## Examples

### Example 1: Manual Sync via REST API

```bash
curl -X POST \
  https://api.example.com/agents/550e8400-e29b-41d4-a716-446655440000/sync-google-metrics \
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
const validation = await googleSyncService.syncSpecialistMetrics(
  specialistId,
  workspaceId,
  { dryRun: true }  // Don't persist
);

if (validation.fraudRiskScore > 50) {
  throw new Error("Metrics suspicious, cannot publish");
}

// If validation passes, sync for real
const result = await googleSyncService.syncSpecialistMetrics(
  specialistId,
  workspaceId,
  { dryRun: false }
);
```

### Example 3: Force Full Refresh

```typescript
// Re-sync with full history and overwrite existing
const result = await googleSyncService.syncSpecialistMetrics(
  specialistId,
  workspaceId,
  {
    dayLookback: 365,      // Full year
    forceRefresh: true     // Overwrite existing
  }
);
```

### Example 4: Bulk Sync All Specialists

```typescript
const results = await googleSyncService.syncAllSpecialists(
  workspaceId,
  { dayLookback: 30 }
);

// Log results
const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success);

console.log(`Success: ${successful}/${results.length}`);
failed.forEach(r => {
  console.error(`${r.agentDisplayName}: ${r.errors[0]}`);
});
```

### Example 5: Query Synced Metrics

```sql
-- Get latest metrics for all specialists on Google
SELECT 
  ap.display_name,
  apm.aggregation_period,
  apm.total_spend,
  apm.avg_roas,
  apm.avg_cpa,
  apm.fraud_risk_score
FROM agent_platform_metrics apm
JOIN agent_profiles ap ON ap.id = apm.agent_profile_id
WHERE apm.platform = 'google'
ORDER BY apm.aggregation_period DESC, ap.display_name;

-- Get specialists with high fraud scores
SELECT 
  ap.display_name,
  ap.fraud_risk_score,
  COUNT(apm.id) as metrics_count
FROM agent_profiles ap
LEFT JOIN agent_platform_metrics apm 
  ON ap.id = apm.agent_profile_id AND apm.platform = 'google'
WHERE ap.fraud_risk_score > 50
GROUP BY ap.id, ap.display_name
ORDER BY ap.fraud_risk_score DESC;
```

---

## Integration with MetaPerformanceSyncService

Both services share:
- Same database schema (`agent_platform_metrics`)
- Same fraud detection logic
- Same specialist profile update logic
- Same token encryption/decryption
- Same caching strategy

Differences:
- Different API clients (Google Ads SDK vs HTTP)
- Different API versions (v15 vs v20)
- Different rate limits (10/10s vs 200/hour)
- Different metric units (micros vs currency)

---

## Monitoring Queries

### Check Sync Health

```sql
-- Most recent syncs per platform
SELECT 
  ap.display_name,
  apm.platform,
  MAX(apm.synced_at) as last_sync,
  AVG(apm.fraud_risk_score) as avg_fraud_score
FROM agent_platform_metrics apm
JOIN agent_profiles ap ON ap.id = apm.agent_profile_id
GROUP BY ap.id, ap.display_name, apm.platform
ORDER BY ap.display_name, apm.platform;
```

### Find Stale Syncs

```sql
-- Specialists not synced in 7 days
SELECT 
  display_name,
  last_performance_sync,
  performance_sync_status,
  fraud_risk_score
FROM agent_profiles
WHERE last_performance_sync < NOW() - INTERVAL '7 days'
  OR last_performance_sync IS NULL
ORDER BY last_performance_sync;
```

### Verify Data Integrity

```sql
-- Check for duplicate months (should be 1 per specialist/platform)
SELECT 
  agent_profile_id,
  platform,
  aggregation_period,
  COUNT(*) as count
FROM agent_platform_metrics
GROUP BY agent_profile_id, platform, aggregation_period
HAVING COUNT(*) > 1;
```
