# Marketplace Integrations Module

The **Integrations Module** enables Performa marketplace to sync real performance data from external advertising platforms (Meta, Google, etc.) directly into specialist profiles.

This ensures marketplace listings are backed by verified, API-sourced metrics rather than self-reported claims.

## Overview

### What This Module Does

- **Syncs real campaign data** from Meta Ads API into specialist profiles
- **Validates metrics** against fraud detection rules
- **Aggregates daily data** into monthly performance summaries
- **Updates specialist profiles** with fresh stats and ROAS/CPA metrics
- **Handles token management** (encryption, refresh, expiry)
- **Manages rate limits** with exponential backoff
- **Supports scheduling** via daily cron job or manual trigger

### Key Features

✅ **Automated Daily Syncs** — Scheduled job syncs all specialists  
✅ **Real-time Manual Trigger** — REST endpoint for on-demand sync  
✅ **Fraud Detection** — Validates unrealistic metrics and patterns  
✅ **Multi-account Support** — Handles specialists with multiple ad accounts  
✅ **Rate Limit Management** — Exponential backoff and request staggering  
✅ **Workspace Isolation** — All operations tenant-aware  
✅ **Comprehensive Logging** — Audit trail of all syncs  
✅ **Error Recovery** — Token refresh, retry logic, partial success  

## Files

| File | Purpose |
|------|---------|
| `meta-sync.service.ts` | Core service for Meta Ads sync |
| `integrations.module.ts` | Module definition |
| `README.md` | This file |
| `INTEGRATION_GUIDE.md` | Detailed walkthrough of data flow |
| `API_REFERENCE.md` | Complete API documentation |
| `IMPLEMENTATION_EXAMPLES.md` | Code samples for integration |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add to AgentsModule

```typescript
// apps/api/src/agents/agents.module.ts
import { IntegrationsModule } from "./integrations/integrations.module";

@Module({
  imports: [IntegrationsModule, ...],
})
export class AgentsModule {}
```

### 3. Inject Service

```typescript
constructor(
  private readonly metaSyncService: MetaPerformanceSyncService,
) {}
```

### 4. Sync a Specialist

```typescript
const result = await this.metaSyncService.syncSpecialistMetrics(
  agentProfileId,
  workspaceId,
  { dayLookback: 30 }
);

console.log(`Synced ${result.campaignsSynced} campaigns`);
console.log(`Fraud score: ${result.fraudRiskScore}`);
```

## Integration Points

### REST Endpoints

```bash
# Manual sync
POST /agents/:agentId/sync-meta-metrics
Body: { dayLookback?: 30, forceRefresh?: false }

# Validate before publishing
POST /agents/:agentId/validate-meta-metrics
```

### Cron Jobs

```typescript
// Daily at midnight UTC
@Cron("0 0 * * *")
async syncAllSpecialistsDaily() {
  const results = await this.metaSyncService.syncAllSpecialists(
    workspaceId,
    { dayLookback: 30 }
  );
}
```

### OAuth Callback

After Meta OAuth completes, trigger initial sync:

```typescript
const syncResult = await this.metaSyncService.syncSpecialistMetrics(
  specialist.id,
  workspace.id,
  { dayLookback: 90, forceRefresh: true }
);
```

## Data Flow

```
Specialist connects
Meta account via OAuth
        ↓
┌──────────────────────────────┐
│  MetaPerformanceSyncService  │
└──────────────────────────────┘
        ↓
   Fetch ad accounts
   ├─ Get all campaigns
   ├─ Get daily insights
   └─ Map to standard format
        ↓
   Validate metrics
   ├─ Check for impossible values
   ├─ Detect ROAS/CPA spikes
   └─ Calculate fraud score
        ↓
   Persist to database
   ├─ Aggregate by month
   ├─ Upsert to agent_platform_metrics
   └─ Update specialist profile
        ↓
   Update specialist stats
   ├─ Recalculate avgROAS, avgCPA
   ├─ Build monthly performance array
   └─ Set lastPerformanceSync, sync status
```

## Configuration

### Environment Variables

```bash
# Meta OAuth (required)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_CALLBACK_URL=https://api.example.com/meta/callback

# Encryption (required)
ENCRYPTION_KEY=your-32-character-hex-key
```

### Default Settings

| Setting | Default | Range |
|---------|---------|-------|
| dayLookback | 30 days | 1-365 |
| forceRefresh | false | N/A |
| dryRun | false | N/A |
| Rate limit backoff | 100ms | 100-1000ms |
| Fraud score threshold | 50 | 0-100 |

## Key Concepts

### Aggregation Period

Daily metrics are grouped by calendar month. `aggregation_period` = first day of month.

```
Daily metrics from Feb 2024:
  - Feb 5: spend $100, roas 3.2
  - Feb 15: spend $150, roas 3.8
  - Feb 28: spend $200, roas 3.5
         ↓
Monthly aggregate (2024-02-01):
  - total_spend: $450
  - avg_roas: 3.5x
  - campaigns: 12
```

### Fraud Detection

Validates metrics for unrealistic patterns:

| Check | Threshold | Risk |
|-------|-----------|------|
| Negative spend | Any | 25 pts |
| CTR > 100% | Any | 20 pts |
| ROAS spike | > 2x historical | 10 pts |
| CPA outside range | < $0.01 or > $10k | 10 pts |

**Score Interpretation**:
- 0-30: ✅ Verified (green)
- 31-50: ⚠️ Caution (yellow)
- 51-100: ❌ Stale (red) — needs review

### Rate Limiting

Exponential backoff prevents hitting Meta API limits:

```
Request 1: immediate
Request 2: +100ms
Request 3: +200ms
Request 4: +400ms
...
Request N: +min(100ms * 2^N, 1000ms)
```

Reset after successful request.

## Fraud Detection Rules

### Impossible Metrics

- Negative spend, impressions, conversions, clicks
- CTR > 100%

**Action**: Flag with +20-25 risk points, continue

### Unrealistic Metrics

- CPA < $0.01 or > $10,000
- ROAS < 0 or > 100

**Action**: Flag with +10-15 risk points, continue

### Anomalies

- ROAS spike > 2x historical average
- Sudden drop in impressions with high spend

**Action**: Flag with +10 risk points, continue

### Fraud Score

Sum all risk points (capped at 100). If > 50, mark sync status as "stale" and require manual review before publishing.

## Performance Characteristics

Typical sync for 50 campaigns across 3 accounts:

| Step | Time |
|------|------|
| Fetch accounts | 200ms |
| Fetch campaigns | 900ms |
| Fetch insights | 2400ms |
| Fraud validation | 100ms |
| Database upsert | 500ms |
| **Total** | **~4.8s** |

## Error Handling

### Retryable Errors

- Rate limit (429) — exponential backoff
- Token expired — attempt refresh, retry

### Non-retryable Errors

- Invalid credentials — mark account inactive
- Resource not found — skip, log warning
- Permission denied — prompt user for re-auth

### Partial Success

If account A fails but account B succeeds:
- Return success = true (partial sync ok)
- Include account A error in `errors` array
- Metrics from account B persisted
- Continue with other specialists

## Monitoring

Monitor these metrics for service health:

```typescript
{
  "sync_duration_ms": 4823,
  "campaigns_synced": 45,
  "metrics_inserted": 12,
  "metrics_updated": 0,
  "fraud_risk_score": 15,
  "errors": [],
  "warnings": ["CTR spike detected"]
}
```

Alert on:
- Fraud score > 50
- Sync duration > 30s
- Failed syncs for 3+ days
- Token refresh failures

## Testing

### Unit Tests

```bash
npm test -- meta-sync.service.spec.ts
```

Tests cover:
- ✅ Metric aggregation by month
- ✅ Fraud detection rules
- ✅ Token refresh logic
- ✅ Rate limit backoff
- ✅ Error recovery
- ✅ Workspace isolation

### Integration Tests

```bash
npm test:e2e -- meta-sync.integration.spec.ts
```

## Troubleshooting

### "No active Meta integration"

**Cause**: Specialist hasn't connected Meta account  
**Fix**: Complete OAuth flow in settings

### High fraud risk score

**Cause**: Unrealistic metrics (bad conversion tracking, spam clicks)  
**Fix**: Review in Meta Ads Manager, fix conversion setup

### Sync timeout

**Cause**: Too many campaigns or API slowness  
**Fix**: Reduce dayLookback, check Meta API status

### Token refresh fails

**Cause**: Refresh token expired (> 60 days)  
**Fix**: Specialist must re-authorize via OAuth

## Database Migrations

Run migrations to add new columns:

```bash
npm run typeorm migration:run
```

This adds to `agent_profiles`:
- `fraud_risk_score`
- `last_performance_sync`
- `performance_sync_status`
- `is_performance_data_verified`

## Documentation

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** — Detailed walkthrough, data flow, validation rules
- **[API_REFERENCE.md](./API_REFERENCE.md)** — Complete API docs, database schema, examples
- **[IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md)** — Code samples for common tasks

## Security

### Token Encryption

All access tokens encrypted AES-256-CBC. Decrypt on-demand, never log plaintext.

```typescript
// Tokens stored as: "iv:ciphertext"
const token = decrypt(encryptedToken, encryptionKey);
```

### Data Privacy

- Workspace isolation: No cross-workspace data leakage
- Audit log: All syncs logged with timestamps
- PII: Only campaign names stored (no personal data)

### Rate Limit Abuse Prevention

- Per-account exponential backoff
- Max 10x backoff (1s minimum delay)
- Workspace staggering via cron offset
- Monitor for unusual patterns

## Related Services

| Service | Purpose |
|---------|---------|
| `MetaAdsService` | Pure Meta Graph API client |
| `MetaOAuthService` | OAuth flow handling |
| `AgentsService` | Specialist profile management |
| `MetaSyncService` (meta module) | Meta workspace sync (different use case) |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  Performa Marketplace                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Agents Module                                      │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Integrations Module (NEW)                           │  │ │
│  │  ├──────────────────────────────────────────────────────┤  │ │
│  │  │                                                      │  │ │
│  │  │  MetaPerformanceSyncService                         │  │ │
│  │  │  ├─ syncSpecialistMetrics()                         │  │ │
│  │  │  ├─ syncAllSpecialists()                            │  │ │
│  │  │  ├─ validateMetricsWithFraudDetection()             │  │ │
│  │  │  └─ updateSpecialistProfile()                       │  │ │
│  │  │                                                      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                          ↓                                  │ │
│  │         Meta Module (existing)                              │ │
│  │         ├─ MetaAdsService (Graph API)                      │ │
│  │         └─ MetaSyncService (workspace sync)                │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Database                                                      │
│  ├─ agent_profiles                                            │
│  ├─ agent_platform_metrics (NEW)                              │
│  └─ connected_accounts                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↓
      Meta Ads API (v20.0)
      ├─ /me/adaccounts
      ├─ /{account-id}/campaigns
      └─ /{account-id}/insights
```

## Contributing

When extending this module:

1. Keep fraud detection rules configurable
2. Maintain workspace isolation (no data leaks)
3. Log all API calls for audit trails
4. Test with multiple currencies/timezones
5. Document any breaking changes

## License

Proprietary — Performa Inc.
