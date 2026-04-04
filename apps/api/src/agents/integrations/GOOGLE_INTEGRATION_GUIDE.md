# Google Ads API Integration Guide

## Overview

The **GooglePerformanceSyncService** enables the Performa marketplace to sync real campaign performance data directly from Google Ads API v15 into specialist (agent) profiles. This enhances the marketplace by providing verified, API-sourced metrics instead of relying solely on self-reported data.

### Key Capabilities

1. **Real-time Data Sync**: Pulls daily/monthly campaign metrics from Google Ads API v15
2. **Fraud Detection**: Validates metrics for unrealistic or suspicious patterns
3. **Automated Scheduling**: Syncs via cron job (daily) or manual trigger
4. **Multi-account Support**: Handles specialists with multiple Google Ads accounts
5. **Rate Limit Management**: Request throttling for 10 req/10s API limit
6. **Workspace Isolation**: All operations respect workspace boundaries
7. **Audit Trail**: Comprehensive logging of all sync operations

---

## Connection Flow

### Step 1: Specialist Connects Google Ads Account

When a specialist connects a Google Ads account via OAuth:

```
Specialist → [Auth Dialog] → Google OAuth → Callback
                                            ↓
                          Upsert to ServiceEngagement
                          (with accessToken + refreshToken)
```

This is handled by the existing `GoogleOAuthService` in `auth/google-oauth.service.ts`.

**Result**: 
- `ServiceEngagement` record created with:
  - `platformType`: "google_ads"
  - `accessToken`: Encrypted AES-256
  - `refreshToken`: Encrypted AES-256
  - `externalAccountId`: Google customer ID
  - `clientId`: OAuth client ID
  - `clientSecret`: OAuth client secret
  - `workspaceId`: Workspace context
  - `tokenExpiresAt`: Expiration timestamp

### Step 2: Link Account to AgentProfile

When a specialist publishes their profile to the marketplace, link their connected Google Ads accounts:

```typescript
// In agents.service.ts or marketplace controller
const specialist = await agentProfileRepo.findOne({ id: profileId });
specialist.platforms = ["google", ...]; // Add to platforms array
await agentProfileRepo.save(specialist);
```

---

## Usage

### Single Specialist Sync

Sync performance metrics for one specialist:

```typescript
// In your service/controller
import { GooglePerformanceSyncService } from "./integrations/google-sync.service";

constructor(
  private readonly googleSyncService: GooglePerformanceSyncService,
) {}

async syncSpecialist(agentProfileId: string, workspaceId: string) {
  const result = await this.googleSyncService.syncSpecialistMetrics(
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
  const results = await this.googleSyncService.syncAllSpecialists(
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

### 1. Resolve Customer ID

```
ServiceEngagement.externalAccountId
        ↓
Format customer ID (remove hyphens)
        ↓
String (e.g., "1234567890")
```

### 2. Fetch Campaigns

```
Customer ID
        ↓
POST /v15/customers/{customerId}/googleAds:search
  query: "SELECT campaign.id, campaign.name FROM campaign WHERE status != REMOVED"
        ↓
GoogleAdsCampaign[]
  - id
  - name
  - status
```

**API Details**:
- Method: POST (GAQL search)
- Authentication: Bearer token in Authorization header
- Developer token required in custom header
- Response: Array of campaign objects

### 3. Fetch Daily Metrics

```
Customer ID
        ↓
POST /v15/customers/{customerId}/googleAds:search
  query: "SELECT campaign.id, campaign.name, segments.date,
           metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.conversion_value
           FROM campaign
           WHERE status != REMOVED
           AND segments.date >= 'YYYY-MM-DD'
           AND segments.date <= 'YYYY-MM-DD'"
        ↓
GoogleMetricsRow[]
  - date: YYYY-MM-DD
  - cost_micros: N (millionths of currency unit)
  - impressions: N
  - clicks: N
  - conversions: N
  - conversion_value: $Y.YY
```

**Key Points**:
- Google Ads API returns cost in **micros** (divide by 1,000,000)
- Metrics are aggregated daily
- No time-level granularity available
- Segments define the aggregation level

### 4. Compute Derived Metrics

For each metric row:
```
CTR = (clicks / impressions) * 100          // Click-through rate %
CPA = spend / conversions                    // Cost per acquisition
ROAS = conversion_value / spend              // Return on ad spend
```

Special handling:
- If impressions = 0: CTR = 0 (not null)
- If conversions = 0: CPA = null (not 0)
- If spend = 0: ROAS = null (not 0)

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

**Key fields**:
- `platform`: "google"
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

### Token Errors (Code 401, 403)

**Scenario**: Access token expired during sync.

**Handling**:
1. Check `ServiceEngagement.tokenExpiresAt`
2. If expired and `refreshToken` exists:
   - Call `POST https://oauth2.googleapis.com/token`
   - Update `ServiceEngagement.accessToken` with new token
   - Update `tokenExpiresAt` (+1 hour)
3. If refresh fails or no refresh token:
   - Log error
   - Mark `ServiceEngagement.isActive = false`
   - Skip this account
   - Continue with other accounts

### Rate Limit Errors (Code 429)

**Scenario**: Google Ads API returns 429 Too Many Requests.

**Handling**:
1. Track request timestamps in last 10 seconds
2. If 10 requests in window, calculate wait time
3. Wait until oldest request expires from window
4. Retry request automatically
5. Log rate limit hit
6. Continue with next request

Google Ads API allows: **10 requests per 10 seconds**.

### Missing Campaign Data

**Scenario**: Metric returned for campaign that doesn't exist.

**Handling**:
1. Maintain campaign ID set from `GET /campaigns`
2. Filter metrics to only valid campaigns
3. Log orphaned metrics
4. Continue with valid metrics

### Disconnected Accounts

**Scenario**: ServiceEngagement exists but not linked to specialist profile.

**Handling**:
1. Sync only accounts where specialist is in workspace
2. Check `specialist.platforms.includes("google")`
3. Skip if not included
4. Log warning

---

## Scheduling

### Manual Trigger

Sync on-demand via REST endpoint:

```typescript
// agents.controller.ts
@Post("/:agentId/sync-google-metrics")
async syncMetrics(
  @Param("agentId") agentId: string,
  @Body() body?: { dayLookback?: number; forceRefresh?: boolean }
) {
  return this.googleSyncService.syncSpecialistMetrics(
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

@Cron("0 2 * * *") // Daily at 2 AM UTC (after Meta sync at midnight)
async syncAllGoogleMetricsDaily() {
  const workspaces = await this.workspaceRepo.find();
  
  for (const workspace of workspaces) {
    try {
      await this.googleSyncService.syncAllSpecialists(workspace.id, {
        dayLookback: 30,
      });
    } catch (err) {
      this.logger.error(`Daily sync failed for workspace ${workspace.id}`, err);
    }
  }
}
```

### Stagger Requests

To avoid rate limits, stagger syncs across workspaces:

```typescript
// Offset each workspace by N minutes
const offsetMinutes = (workspace.id.charCodeAt(0) % 60);
const cronPattern = `0 ${offsetMinutes} 2 * * *`; // Spread across hour
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

New columns (same as Meta integration):
```sql
ALTER TABLE agent_profiles ADD COLUMN fraud_risk_score DECIMAL(3,2);
ALTER TABLE agent_profiles ADD COLUMN last_performance_sync TIMESTAMP;
ALTER TABLE agent_profiles ADD COLUMN performance_sync_status 
  ENUM('never_synced', 'healthy', 'stale', 'failed');
ALTER TABLE agent_profiles ADD COLUMN is_performance_data_verified BOOLEAN;
```

### service_engagements table (replaces connected_accounts)

```sql
CREATE TABLE service_engagements (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  platform_type VARCHAR(20),         -- "meta", "google_ads", "tiktok"
  external_account_id VARCHAR(255),  -- Customer ID, ad account ID, etc.
  external_account_name VARCHAR(255),
  access_token VARCHAR(255) NOT NULL,   -- Encrypted
  refresh_token VARCHAR(255),            -- Encrypted
  client_id VARCHAR(255),
  client_secret VARCHAR(255),            -- Encrypted
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

## Rate Limit Management

### Google Ads API Limits

- **Requests per 10 seconds**: 10
- **Page size**: N/A (no pagination in GAQL)
- **Daily limit**: 50,000 operations (operations ≈ requests)

### Rate Limiting Implementation

Per-customer tracking of request timestamps:

```typescript
// Track last 10 requests (in 10 second window)
const requestTimestamps = [t1, t2, ..., t10];

// If window is full, wait until oldest expires
if (requestTimestamps.length >= 10) {
  const oldestTimestamp = requestTimestamps[0];
  const waitTime = 10000 - (now - oldestTimestamp) + 100; // +100ms buffer
  if (waitTime > 0) await sleep(waitTime);
}

// Add new timestamp and proceed
requestTimestamps.push(Date.now());
```

### Per-Workspace Staggering

```typescript
// Spread syncs across the hour
const hash = workspaceId.charCodeAt(0) % 60;
@Cron(`0 ${hash} 2 * * *`)
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
- Rate limit approached
- Fraud score > 50
- Token expiring soon

**ERROR**:
- Sync failed completely
- Token refresh failed
- Database error
- API authentication error

### Metrics to Track

```typescript
{
  "sync_duration_ms": 3600,
  "campaigns_synced": 45,
  "metrics_inserted": 12,
  "metrics_updated": 3,
  "fraud_risk_score": 15,
  "rate_limit_hits": 0,
  "token_refreshes": 0,
  "errors": [],
  "warnings": []
}
```

### Alerts to Set Up

| Metric | Threshold | Action |
|--------|-----------|--------|
| Sync duration | > 30s | Page on-call |
| Fraud score avg | > 40 | Slack alert to admins |
| Sync failures | > 5% daily | Page on-call |
| Token refresh failures | > 10/day | Slack alert |
| Rate limit hits | > 50/day | Investigate API usage |
| Database errors | > 0 | Critical alert |

---

## Security Considerations

### Token Encryption

All tokens encrypted AES-256-CBC:

```typescript
// Stored as: "iv:ciphertext"
const token = decrypt(encryptedToken, encryptionKey);
```

### Workspace Isolation

- All queries filtered by `workspace_id`
- No cross-workspace data leakage
- Service engagements scoped to workspace

### Audit Logging

- All syncs logged with timestamp
- Sync results stored in database
- Error logs include error details but not tokens

### API Security

- Never log plaintext tokens
- Use HTTPS for all API calls
- Validate API responses
- Check response status codes

---

## Comparison with Meta Integration

Google Ads integration mirrors Meta pattern with these differences:

| Aspect | Meta | Google |
|--------|------|--------|
| API Client | Custom MetaAdsService | Direct HTTP via NestJS HttpModule |
| Authentication | User token | OAuth with refresh token |
| Rate Limit | 200 req/hour | 10 req/10 seconds |
| API Base | Graph API v20 | googleads.googleapis.com v15 |
| Query Format | REST endpoints | GAQL (SQL-like) |
| Cost Unit | Currency units | Micros (divide by 1,000,000) |
| Pagination | Cursor-based | N/A (GAQL handles limits) |
| Account Identifier | ad_account_id | customer_id (numeric) |

---

## Next Steps

1. **Read**: GOOGLE_API_REFERENCE.md for API details
2. **Review**: GOOGLE_IMPLEMENTATION_EXAMPLES.md for code samples
3. **Plan**: Use GOOGLE_CHECKLIST.md to track implementation
4. **Deploy**: Follow GOOGLE_DEPLOYMENT.md for production rollout
