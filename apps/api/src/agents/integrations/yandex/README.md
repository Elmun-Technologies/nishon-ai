# Yandex Direct Integration for Performa Marketplace

## Overview

The Yandex Direct performance sync service enables the Performa marketplace to automatically collect and verify real advertising performance data from specialist accounts using Yandex Direct API. This creates a transparent, trustworthy ecosystem where agency specialists can showcase their proven results to prospective clients.

## Quick Start

### Installation

The Yandex Direct integration is pre-built in the codebase. Add it to your module imports:

```typescript
import { YandexPerformanceSyncService } from './yandex-sync.service';

@Module({
  providers: [YandexPerformanceSyncService],
  exports: [YandexPerformanceSyncService],
})
export class IntegrationsModule {}
```

### Basic Usage

Sync performance metrics for a single specialist:

```typescript
const result = await yandexSyncService.syncSpecialistMetrics(
  agentProfileId,
  workspaceId,
  {
    dayLookback: 30,
    forceRefresh: false,
    dryRun: false,
    targetCurrency: 'USD'
  }
);

console.log(`Synced ${result.campaignsSynced} campaigns`);
console.log(`Fraud risk score: ${result.fraudRiskScore}`);
```

Bulk sync all specialists in a workspace:

```typescript
const results = await yandexSyncService.syncAllSpecialists(workspaceId, {
  dayLookback: 30,
  forceRefresh: false,
});

const successful = results.filter(r => r.success).length;
console.log(`Successfully synced ${successful}/${results.length} specialists`);
```

## Key Features

### 1. Real-Time Data Collection
- Pulls daily campaign performance from Yandex Direct API
- Supports impressions, clicks, cost, conversions, and revenue
- Monthly aggregation for efficient storage and querying

### 2. Multi-Currency Support
- Automatically converts RUB metrics to target currency (USD, EUR, GBP)
- Maintains exchange rate cache for consistent conversions
- Logs currency conversion details for audit trails

### 3. Fraud Detection
- Validates metrics against 8+ fraud detection rules
- Checks for impossible values (negative spend, CTR > 100%)
- Detects sudden performance spikes
- Generates fraud risk score (0-100) for each specialist

### 4. Rate Limiting
- Respects Yandex API's 1000 requests/hour limit
- Automatic exponential backoff on 429 responses
- Per-account rate limit tracking with state management

### 5. Token Management
- Automatic OAuth token refresh when expired
- AES-256-CBC encryption for tokens at rest
- Secure token storage with per-request decryption

### 6. Error Resilience
- Partial success handling per account
- Detailed error logging without exposing secrets
- Dry-run mode for validation without persistence
- Transaction-safe database operations

### 7. Workspace Isolation
- All operations scoped to specific workspace
- No data leakage across workspace boundaries
- Secure query filters on all database operations

## Architecture

### Data Flow

```
Yandex Direct API
      ↓
[Fetch Accounts & Campaigns]
      ↓
[Fetch Campaign Reports]
      ↓
[Convert Currencies]
      ↓
[Validate & Fraud Check]
      ↓
[Aggregate by Month]
      ↓
agent_platform_metrics (DB)
      ↓
[Update Specialist Profile]
      ↓
Marketplace (UI Shows Real Performance)
```

### Component Interactions

| Component | Role |
|-----------|------|
| `yandex-sync.service.ts` | Main service orchestrating sync flow |
| `ServiceEngagement` | Stores platform credentials and access tokens |
| `AgentProfile` | Specialist profile with cached stats and fraud score |
| `AgentPlatformMetrics` | Storage for monthly aggregated metrics |
| `Workspace` | Isolation boundary for multi-tenant operations |

## Configuration

### Environment Variables

```bash
# OAuth credentials for Yandex Direct API
YANDEX_CLIENT_ID=your_client_id
YANDEX_CLIENT_SECRET=your_client_secret

# Encryption key for storing tokens at rest (32 ASCII chars)
ENCRYPTION_KEY=your_32_character_key_here

# Currency exchange rates (JSON format)
CURRENCY_RATES_JSON='{"USD": 1, "EUR": 0.92, "GBP": 0.79, "RUB": 0.011}'
```

### MetricsPullConfig

```typescript
interface MetricsPullConfig {
  dayLookback: number;        // Days to look back (1-730, default: 30)
  forceRefresh: boolean;      // Overwrite existing metrics (default: false)
  dryRun: boolean;            // Validate without persisting (default: false)
  targetCurrency: string;     // USD, EUR, GBP, etc. (default: "USD")
}
```

## Performance Metrics

### Stored Metrics

For each month and specialist, the following metrics are aggregated:

| Field | Type | Description |
|-------|------|-------------|
| `totalSpend` | decimal | Total spend in target currency |
| `campaignsCount` | integer | Number of unique campaigns |
| `avgRoas` | decimal | Return on ad spend (revenue/spend) |
| `avgCpa` | decimal | Cost per acquisition (spend/conversions) |
| `avgCtr` | decimal | Click-through rate (clicks/impressions * 100) |
| `conversionCount` | integer | Total conversions |
| `totalRevenue` | decimal | Total revenue in target currency |
| `sourceType` | enum | Always "api_pull" for Yandex syncs |
| `isVerified` | boolean | Passed fraud detection checks |

### Fraud Detection Rules

The service checks for:

1. **Negative values** - Spend, conversions, or impressions < 0 (score +25)
2. **Impossible CTR** - Click-through rate > 100% (score +20)
3. **Clicks > Impressions** - Impossible metric (score +25)
4. **Unrealistic ROAS** - Outside 0-100 range (score +15)
5. **Unrealistic CPA** - Outside $0.01-$100,000 range (score +10)
6. **Zero spend with conversions** - No cost but has results (score +30)
7. **Performance spike** - 3x average ROAS increase (score +12)

Score > 50 marks specialist as "stale" in UI.
Score > 30 sets `isPerformanceDataVerified = false`.

## Error Handling

### Token Issues

| Error | Handling |
|-------|----------|
| Token expired (401) | Attempts refresh with refresh token |
| Refresh token missing | Logs warning, returns error |
| Decryption failed | Logs warning, returns error |

### API Rate Limits

| Status | Handling |
|--------|----------|
| 429 (rate limit) | Exponential backoff (100ms → 1s → 2s → ... → 10s) |
| 400 (bad request) | Logs error, continues with other campaigns |
| 500 (server error) | Retries with backoff, logs error |

### Database Errors

All database operations use transactions. If a metric insertion fails:
1. All changes in transaction rolled back
2. Error logged with context
3. Service continues with next month/campaign
4. Result.errors includes the failure message

## Monitoring & Logging

### Log Levels

| Level | When | Example |
|-------|------|---------|
| info | Sync start/end, profile updates | "Performance sync completed successfully (Yandex Direct)" |
| warn | Token issues, skipped accounts | "No exchange rate available for target currency" |
| error | API failures, decryption errors | "Failed to fetch metrics for Yandex account" |
| debug | Detailed flow, skipped records | "No campaigns found for Yandex account" |

### Structured Logging

All logs include context fields for debugging:

```json
{
  "message": "Performance sync completed successfully (Yandex Direct)",
  "agentProfileId": "uuid-123",
  "displayName": "John Doe",
  "durationMs": 2345,
  "metricsInserted": 12,
  "metricsUpdated": 3,
  "campaignsSynced": 5,
  "fraudRiskScore": 15
}
```

## Troubleshooting

### No campaigns synced

**Symptoms**: Result shows `campaignsSynced: 0`, no errors

**Causes**:
- No campaigns in Yandex Direct account
- Token has insufficient permissions
- Date range has no data

**Solution**: Check Yandex Direct UI to verify campaigns exist and have performance data.

### High fraud risk score

**Symptoms**: `fraudRiskScore > 50`, specialist marked as "stale"

**Causes**:
- Unusual spike in ROAS
- Data entry errors in Yandex
- Click fraud or invalid traffic

**Solution**: Review specialist's campaigns in Yandex Direct; may need manual verification.

### Token refresh fails

**Symptoms**: `"Token refresh failed"` in logs

**Causes**:
- Refresh token expired
- Yandex API unavailable
- Network timeout

**Solution**: Requires specialist to re-connect their Yandex account. No automatic recovery.

### Currency conversion warnings

**Symptoms**: `"No exchange rate available for target currency"`

**Causes**:
- CURRENCY_RATES_JSON env var missing or invalid
- Unsupported target currency

**Solution**: Update CURRENCY_RATES_JSON in environment with correct exchange rates.

## Security

### Token Encryption

All OAuth tokens are encrypted at rest using AES-256-CBC:

```
Format: "<iv_hex>:<ciphertext_hex>"
Key:    ENCRYPTION_KEY env var (32 ASCII characters)
```

Tokens are decrypted per-request in memory and never logged.

### Workspace Isolation

All queries include workspace_id filter to prevent cross-workspace data leakage. Example:

```typescript
const engagement = await this.serviceEngagementRepo.findOne({
  where: { workspaceId } // Always scoped to workspace
});
```

### No Secrets in Logs

Sensitive data never logged:
- OAuth tokens (decrypted in-memory only)
- Passwords or secrets
- Full API responses with sensitive data

## Limitations

### Data Availability

- Yandex typically provides 2 years of historical data
- Older campaigns may not have complete data
- Deleted campaigns are not accessible

### Rate Limiting

- 1000 requests per hour per IP
- Multiple specialists on same workspace share quota
- Large workspaces (100+ specialists) may hit limits

### Currency Support

- Limited to currencies in CURRENCY_RATES_JSON
- Fallback to RUB if rate unavailable
- Manual rate updates required (no real-time provider)

### Campaign Grouping

- Yandex API groups by campaign, not ad group
- No individual ad performance data
- Only daily aggregation available

## Next Steps

1. **Module Integration**: Add YandexPerformanceSyncService to IntegrationsModule exports
2. **REST Endpoints**: Create /sync/yandex endpoints for manual triggering
3. **Cron Jobs**: Add scheduled daily sync via nestjs/schedule
4. **Audit Logging**: Log all sync operations to AgentPerformanceSyncLog
5. **Rate Limit Dashboard**: Monitor Yandex API quota per workspace

See INTEGRATION_GUIDE.md for detailed implementation steps.
