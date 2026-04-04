# Yandex Direct Integration - API Reference

## Class: YandexPerformanceSyncService

Main service for syncing Yandex Direct campaign performance metrics into the Performa marketplace.

### Constructor

```typescript
constructor(
  private readonly http: HttpService,
  private readonly dataSource: DataSource,
  private readonly config: ConfigService,
  @InjectRepository(AgentProfile)
  private readonly agentProfileRepo: Repository<AgentProfile>,
  @InjectRepository(AgentPlatformMetrics)
  private readonly metricsRepo: Repository<AgentPlatformMetrics>,
  @InjectRepository(ServiceEngagement)
  private readonly serviceEngagementRepo: Repository<ServiceEngagement>,
  @InjectRepository(Workspace)
  private readonly workspaceRepo: Repository<Workspace>,
)
```

**Dependencies**:
- `HttpService` - For making HTTP requests to Yandex API
- `DataSource` - TypeORM data source for transactions
- `ConfigService` - For accessing environment variables
- `AgentProfileRepository` - For updating specialist data
- `AgentPlatformMetricsRepository` - For storing metrics
- `ServiceEngagementRepository` - For retrieving tokens
- `WorkspaceRepository` - For workspace operations

---

## Public Methods

### syncSpecialistMetrics

Syncs performance metrics for a single specialist.

```typescript
async syncSpecialistMetrics(
  agentProfileId: string,
  workspaceId: string,
  config: Partial<MetricsPullConfig> = {},
): Promise<PerformanceSyncResult>
```

**Parameters**:
- `agentProfileId` (string) - UUID of the specialist's AgentProfile
- `workspaceId` (string) - UUID of the workspace (for isolation)
- `config` (Partial<MetricsPullConfig>, optional) - Configuration for the sync

**Returns**: `PerformanceSyncResult` with sync outcome

**Throws**:
- `NotFoundException` - If specialist profile not found
- `BadRequestException` - If no Yandex integration found or invalid config

**Example**:
```typescript
const result = await yandexSync.syncSpecialistMetrics(
  'agent-uuid-123',
  'workspace-uuid-456',
  {
    dayLookback: 30,
    forceRefresh: false,
    dryRun: false,
    targetCurrency: 'USD'
  }
);

console.log(`Successfully synced ${result.campaignsSynced} campaigns`);
console.log(`Fraud risk score: ${result.fraudRiskScore}`);
```

**Execution Flow**:
1. Validates specialist exists
2. Resolves OAuth token from ServiceEngagement
3. Calculates date range based on dayLookback
4. Fetches Yandex accounts and campaigns
5. Fetches campaign reports from API
6. Converts currencies to target currency
7. Validates metrics for fraud
8. Persists to database (in transaction)
9. Updates specialist profile cached stats
10. Returns detailed result

---

### syncAllSpecialists

Syncs performance metrics for all specialists in a workspace.

```typescript
async syncAllSpecialists(
  workspaceId: string,
  config: Partial<MetricsPullConfig> = {},
): Promise<PerformanceSyncResult[]>
```

**Parameters**:
- `workspaceId` (string) - UUID of the workspace
- `config` (Partial<MetricsPullConfig>, optional) - Configuration for all syncs

**Returns**: Array of `PerformanceSyncResult` (one per specialist)

**Example**:
```typescript
const results = await yandexSync.syncAllSpecialists('workspace-uuid-456', {
  dayLookback: 30,
  forceRefresh: false,
});

const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success);

console.log(`Synced ${successful}/${results.length} specialists`);

failed.forEach(result => {
  console.error(`Failed: ${result.agentDisplayName}`);
  console.error(`Errors: ${result.errors.join(', ')}`);
});
```

**Notes**:
- Only syncs specialists with `agentType='human'` and `isVerified=true`
- Errors on individual specialists don't abort the batch
- All results included in return array regardless of success/failure
- Useful for daily scheduled syncs via cron jobs

---

## Interfaces

### MetricsPullConfig

Configuration for controlling sync behavior.

```typescript
interface MetricsPullConfig {
  dayLookback: number;      // Days to look back (1-730, default: 30)
  forceRefresh: boolean;    // Overwrite existing metrics (default: false)
  dryRun: boolean;          // Validate without persisting (default: false)
  targetCurrency: string;   // USD, EUR, GBP, etc. (default: "USD")
}
```

**Fields**:

- `dayLookback` (number, 1-730)
  - How many days back to fetch metrics
  - Minimum: 1 day
  - Maximum: 730 days (2 years)
  - Default: 30 days
  - Note: Yandex typically provides 2 years of history

- `forceRefresh` (boolean)
  - If true, delete existing metrics for the period then re-insert
  - If false, only insert metrics for dates without existing data
  - Default: false (safer for idempotent syncs)
  - Use case: Monthly reconciliation

- `dryRun` (boolean)
  - If true, validate and log but don't persist to database
  - Useful for testing connectivity and fraud detection
  - Returns same result format as normal sync
  - Default: false

- `targetCurrency` (string)
  - Target currency for all metrics (USD, EUR, GBP, RUB, etc.)
  - Yandex reports in RUB; service converts to target currency
  - Must exist in CURRENCY_RATES_JSON env var
  - Default: "USD"

---

### PerformanceSyncResult

Result of a sync operation.

```typescript
interface PerformanceSyncResult {
  success: boolean;                           // Sync completed without errors
  agentProfileId: string;                     // Specialist UUID
  agentDisplayName: string;                   // Specialist name
  metricsInserted: number;                    // New monthly records created
  metricsUpdated: number;                     // Existing monthly records updated
  campaignsSynced: number;                    // Unique campaigns with metrics
  dateRangeStart: Date;                       // First day synced
  dateRangeEnd: Date;                         // Last day synced
  syncedAt: Date;                             // When sync completed
  fraudRiskScore: number;                     // 0-100 fraud risk assessment
  currencyExchangeRates: Record<string, number>; // Exchange rates used
  errors: string[];                           // Error messages (if any)
  warnings: string[];                         // Warning messages
}
```

**Fields**:

- `success` (boolean)
  - True if sync completed and data persisted
  - False if critical error prevented sync
  - Even with false, some data may have been persisted before error

- `agentProfileId` (string)
  - UUID of the specialist's AgentProfile
  - Useful for identifying which specialist result refers to

- `agentDisplayName` (string)
  - Specialist's display name (e.g., "John Doe")
  - "unknown" if profile load failed

- `metricsInserted` (number)
  - Count of new monthly records created
  - 0 if no new data or dryRun=true

- `metricsUpdated` (number)
  - Count of existing monthly records updated
  - 0 if forceRefresh=true or no changes

- `campaignsSynced` (number)
  - Count of unique campaigns with fetched metrics
  - 0 if no campaigns or no performance data

- `dateRangeStart` / `dateRangeEnd` (Date)
  - Actual date range synced
  - Based on dayLookback and current date

- `syncedAt` (Date)
  - Timestamp when sync completed
  - Useful for tracking freshness

- `fraudRiskScore` (number, 0-100)
  - Overall fraud assessment
  - 0 = no suspicious patterns
  - 50+ = marked as "stale" in UI
  - 30+ = marked as "unverified"
  - 100 = multiple severe violations

- `currencyExchangeRates` (Record<string, number>)
  - Exchange rates used during currency conversion
  - For audit trail and transparency

- `errors` (string[])
  - Non-critical errors (e.g., failed to fetch one campaign)
  - Sync may succeed even with errors

- `warnings` (string[])
  - Fraud detection warnings and other notices
  - Included in errors array for backwards compatibility

---

### FraudValidationResult

Internal result of fraud detection validation.

```typescript
interface FraudValidationResult {
  isValid: boolean;           // Passed all fraud checks
  fraudRiskScore: number;     // 0-100 score
  reasons: string[];          // Human-readable fraud flags
}
```

---

## Data Types

### YandexPerformanceRow

Normalized performance metric for a single day.

```typescript
interface YandexPerformanceRow {
  campaignId: string;         // Yandex campaign ID
  campaignName: string;       // Campaign display name
  date: Date;                 // Day of data
  spend: number;              // Cost (in target currency)
  impressions: number;        // Ad impressions
  clicks: number;             // Click count
  conversions: number;        // Conversion count
  conversionValue: number;    // Revenue (in target currency)
  currency: string;           // Currency code (after conversion)
  ctr: number;                // Click-through rate (clicks/impressions)*100
  cpa: number | null;         // Cost per acquisition (spend/conversions)
  roas: number | null;        // Return on ad spend (revenue/spend)
}
```

---

## REST Endpoints

### POST /sync/yandex/specialist/:agentProfileId

Manually trigger sync for a single specialist.

**Request**:
```http
POST /sync/yandex/specialist/agent-uuid-123
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "dayLookback": 30,
  "forceRefresh": false,
  "dryRun": false,
  "targetCurrency": "USD"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "agentProfileId": "agent-uuid-123",
  "agentDisplayName": "John Doe",
  "metricsInserted": 5,
  "metricsUpdated": 0,
  "campaignsSynced": 3,
  "dateRangeStart": "2024-02-01T00:00:00Z",
  "dateRangeEnd": "2024-03-04T00:00:00Z",
  "syncedAt": "2024-03-04T12:34:56Z",
  "fraudRiskScore": 15,
  "currencyExchangeRates": {
    "USD": 1,
    "EUR": 0.92,
    "RUB": 0.011
  },
  "errors": [],
  "warnings": []
}
```

**Error Responses**:
- `404 Not Found` - Specialist not found
- `400 Bad Request` - Invalid config or no Yandex integration
- `401 Unauthorized` - Missing or invalid JWT token

---

### POST /sync/yandex/bulk

Manually trigger bulk sync for entire workspace.

**Request**:
```http
POST /sync/yandex/bulk
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "dayLookback": 30,
  "forceRefresh": false,
  "targetCurrency": "USD"
}
```

**Response** (200 OK):
```json
[
  {
    "success": true,
    "agentProfileId": "agent-uuid-123",
    "agentDisplayName": "John Doe",
    "metricsInserted": 5,
    "metricsUpdated": 0,
    "campaignsSynced": 3,
    ...
  },
  {
    "success": false,
    "agentProfileId": "agent-uuid-456",
    "agentDisplayName": "Jane Smith",
    "errors": ["No active Yandex integration found"],
    ...
  }
]
```

---

### POST /sync/yandex/specialist/:agentProfileId/validate

Dry run endpoint: validate without persisting.

**Request**:
```http
POST /sync/yandex/specialist/agent-uuid-123/validate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "dayLookback": 30,
  "targetCurrency": "USD"
}
```

**Response**: Same as normal sync, but metrics not persisted to database.

**Use Case**: Test connectivity and fraud detection before live sync.

---

## Cron Schedule

### Daily Sync

Runs every day at 3 AM UTC:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async syncAllWorkspaces() {
  // Syncs all specialists in all workspaces
}
```

**Timing**: 3 AM UTC chosen to:
- Avoid peak traffic hours
- Account for timezone differences
- Provide fresh data for morning reviews

### Weekly Refresh

Runs every Sunday at 2 AM UTC:

```typescript
@Cron('0 2 * * 0')
async weeklyRefresh() {
  // Deep refresh with forceRefresh=true
}
```

**Purpose**: Reconcile data, correct any anomalies, verify consistency.

---

## Database Schema

### agent_platform_metrics

Monthly aggregated metrics stored in database.

```sql
CREATE TABLE agent_platform_metrics (
  id UUID PRIMARY KEY,
  agent_profile_id UUID NOT NULL,
  platform VARCHAR(20) NOT NULL,  -- "yandex"
  aggregation_period DATE NOT NULL, -- First day of month
  total_spend DECIMAL(15, 2) NOT NULL,
  campaigns_count INTEGER NOT NULL,
  avg_roas DECIMAL(8, 2),
  avg_cpa DECIMAL(10, 2),
  avg_ctr DECIMAL(5, 3),
  conversion_count INTEGER NOT NULL,
  total_revenue DECIMAL(15, 2) NOT NULL,
  source_type VARCHAR(20) NOT NULL,  -- "api_pull"
  is_verified BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  synced_at TIMESTAMP NOT NULL,
  UNIQUE(agent_profile_id, platform, aggregation_period),
  INDEX idx_agent_platform (agent_profile_id, platform, aggregation_period)
);
```

**Aggregation Period**: First day of each month.
- Jan 15 metrics stored as 2024-01-01
- Feb 28 metrics stored as 2024-02-01

This enables easy monthly queries and charting.

---

## Error Codes

### Application Errors

| Code | Status | Message | Action |
|------|--------|---------|--------|
| `PROFILE_NOT_FOUND` | 404 | Agent profile not found | Verify profile ID exists |
| `NO_YANDEX_INTEGRATION` | 400 | No active Yandex integration | Specialist must connect account |
| `INVALID_CONFIG` | 400 | Invalid dayLookback (must be 1-730) | Adjust dayLookback parameter |
| `TOKEN_EXPIRED` | 401 | Yandex token expired, refresh failed | Specialist must reconnect |
| `TOKEN_DECRYPT_FAILED` | 500 | Failed to decrypt stored token | Check ENCRYPTION_KEY env var |
| `CURRENCY_RATE_MISSING` | 400 | No exchange rate for target currency | Update CURRENCY_RATES_JSON env var |

### Yandex API Errors

| Status | Error | Handling |
|--------|-------|----------|
| 400 | Invalid request | Logged as warning, campaign skipped |
| 401 | Unauthorized | Attempts token refresh |
| 429 | Rate limit exceeded | Exponential backoff, queued retry |
| 500 | Server error | Logged as error, retry with backoff |

---

## Logging

### Log Levels

**INFO**: Sync start/completion, major milestones
```json
{
  "message": "Performance sync completed successfully (Yandex Direct)",
  "agentProfileId": "uuid-123",
  "displayName": "John Doe",
  "durationMs": 2345,
  "metricsInserted": 12,
  "campaignsSynced": 5,
  "fraudRiskScore": 15
}
```

**WARN**: Token issues, skipped items, currency conversion warnings
```json
{
  "message": "No exchange rate available for target currency",
  "sourceCurrency": "RUB",
  "targetCurrency": "JPY",
  "campaignId": "campaign-123"
}
```

**ERROR**: API failures, decryption errors, database errors
```json
{
  "message": "Failed to fetch metrics for Yandex account",
  "accountId": "account-123",
  "error": "401 Unauthorized",
  "stack": "..."
}
```

**DEBUG**: Detailed flow, skipped records
```json
{
  "message": "No campaigns found for Yandex account",
  "accountId": "account-123"
}
```

---

## Performance Characteristics

### Time Complexity

| Operation | Time | Notes |
|-----------|------|-------|
| Single specialist sync | O(n) | n = number of campaigns |
| Bulk sync (m specialists) | O(m * n) | Can be parallelized per specialist |
| Fraud validation | O(r) | r = total records across all campaigns |
| Currency conversion | O(r) | Linear pass through records |
| Database upsert | O(log m) | Index lookup on (agentId, platform, period) |

### Space Complexity

- Per specialist: O(c * d) where c = campaigns, d = days in range
- Aggregated to months: ~30 records per specialist per year
- Example: 100 specialists, 2 years = 6,000 rows total

### Memory Usage

- Typical sync: 10-50 MB (depends on campaign count)
- In-flight during sync: ~5-10 MB
- Rate limit state: <1 MB (per-account tracking)

### Network

- Requests per specialist: 3-20 (depends on campaigns)
- Yandex API rate limit: 1000 requests/hour total
- Recommended: Stagger syncs to use <500 requests/hour

---

## Testing

### Unit Tests

Test individual methods in isolation:

```typescript
describe('YandexPerformanceSyncService', () => {
  describe('validating metrics', () => {
    it('should detect negative spend', async () => {
      const rows = [{spend: -100, /* ... */}];
      const result = await service['validateMetricsWithFraudDetection'](
        accountsWithMetrics,
        specialist
      );
      expect(result.fraudRiskScore).toBeGreaterThan(0);
    });
  });

  describe('currency conversion', () => {
    it('should convert RUB to USD', () => {
      const rows = [{spend: 1000, currency: 'RUB'}, /* ... */];
      const result = service['convertCurrencies'](accounts, 'USD');
      expect(result[0].performanceRows[0].currency).toBe('USD');
    });
  });
});
```

### Integration Tests

Test with mock Yandex API:

```typescript
it('should sync metrics end-to-end', async () => {
  const mockResponse = {
    result: {
      Campaigns: [{Id: 123, Name: 'Test Campaign', Currency: 'RUB'}],
    },
  };
  
  jest.spyOn(httpService, 'post').mockReturnValue(mockResponse);
  
  const result = await service.syncSpecialistMetrics(agentId, workspaceId);
  
  expect(result.success).toBe(true);
  expect(result.campaignsSynced).toBe(1);
});
```

---

## Related Documentation

- **README.md** - Quick start and feature overview
- **SUMMARY.md** - Executive summary for stakeholders
- **IMPLEMENTATION_EXAMPLES.md** - Code samples and recipes
- **DEPLOYMENT.md** - Production deployment guide
- **CHECKLIST.md** - Implementation tracking

---

## Support

For issues or questions:

1. Check troubleshooting section in README.md
2. Review error codes and handling in this reference
3. Check application logs for detailed error context
4. Review Yandex Direct API docs at https://yandex.com/dev/direct/
