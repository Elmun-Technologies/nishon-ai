# Marketplace Cron Schedule Documentation

## Overview

The Marketplace Cron Service (`MarketplaceCronService`) provides automated scheduling for synchronizing performance metrics from Meta Ads, Google Ads, and Yandex Direct across all workspace specialists.

The service uses NestJS `@nestjs/schedule` with `@Cron` decorators for time-based job execution and maintains workspace isolation throughout all operations.

## Schedule Overview

### Daily Light Sync
- **Time**: Midnight UTC (00:00 UTC)
- **Cron Expression**: `0 0 * * *` (configurable)
- **Lookback Period**: Last 30 days
- **Purpose**: Keep marketplace metrics current with recent campaign performance
- **Typical Duration**: 10-30 minutes (depending on workspace count and specialist metrics volume)

**Process**:
1. Load all active workspaces
2. For each workspace, sync all three platforms (Meta, Google, Yandex)
3. For each platform, call `syncAllSpecialists()` to fetch and persist metrics
4. Log results with success/failure counts and total records synced
5. If one workspace fails, continue with the next

### Weekly Deep Validation
- **Time**: Sunday at 3:00 AM UTC
- **Cron Expression**: `0 3 * * 0` (configurable)
- **Lookback Period**: Last 90 days
- **Force Refresh**: Yes (overwrites existing metrics for the period)
- **Purpose**: Comprehensive fraud re-validation and metric accuracy check
- **Typical Duration**: 45-90 minutes (includes fraud detection re-validation)

**Process**:
1. Load all active workspaces
2. For each workspace, sync all three platforms with 90-day lookback
3. Force refresh all metrics in the date range (overwrite existing)
4. After syncing metrics, run fraud score re-validation via `FraudDetectionAdminService`
5. Log all changes and fraud score updates
6. If one workspace fails, continue with the next

## Purpose of Each Job

### Daily Sync (`handleDailyPerformanceSync`)
Maintains fresh performance data in the marketplace. This light sync:
- Pulls last 30 days of campaigns and performance metrics
- Validates metrics with fraud detection rules
- Upserts to the database (skips if record exists and `forceRefresh=false`)
- Updates specialist cached stats and performance ratings
- Ensures marketplace profiles reflect current campaign performance

Ideal for:
- Quick performance refreshes
- Staying within API rate limits
- Regular metric updates throughout the month

### Weekly Deep Validation (`handleWeeklyDeepValidation`)
Performs a thorough validation pass. This deep sync:
- Pulls full 90 days of performance data
- Forces refresh of all metrics in the date range (overwrites existing)
- Recalculates all performance indicators
- Runs fraud detection re-validation on all specialists
- Updates fraud risk scores based on new metrics
- Detects metric anomalies and suspicious patterns

Ideal for:
- Catching fraudulent metric patterns that accumulated over the month
- Correcting data inconsistencies
- Re-validating specialist credentials based on latest performance
- Ensuring accurate marketplace rankings

## Manual Triggering via REST Endpoint

While the cron jobs run automatically on schedule, you can also trigger them manually:

```bash
# Trigger daily sync manually
POST /api/agents/marketplace/sync/daily

# Trigger weekly deep validation manually
POST /api/agents/marketplace/sync/deep-validation

# Get sync status and recent results
GET /api/agents/marketplace/sync/status
```

Example response:
```json
{
  "lastDailySyncAt": "2024-01-15T00:00:00Z",
  "lastDailySyncStatus": "success",
  "lastWeeklySyncAt": "2024-01-14T03:00:00Z",
  "lastWeeklySyncStatus": "success",
  "workspacesProcessed": 5,
  "totalRecordsSynced": 12500,
  "errors": 0
}
```

## Configuring via Environment Variables

Override default cron expressions and behavior with environment variables in `.env`:

```bash
# Daily sync cron expression (default: '0 0 * * *' = midnight UTC)
SYNC_CRON_EXPRESSION=0 0 * * *

# Weekly deep validation cron expression (default: '0 3 * * 0' = Sunday 3am UTC)
DEEP_VALIDATION_CRON=0 3 * * 0

# Enable workspace sync staggering (default: true)
# When true, spreads syncs across ~1 hour to avoid thundering herd
STAGGER_SYNCS=true

# Milliseconds between workspace syncs (default: 180000 = 3 minutes)
# Only used if STAGGER_SYNCS=true
STAGGER_INTERVAL_MS=180000
```

### Cron Expression Format

Uses standard cron format (minute hour day month day-of-week):
- `0 0 * * *` = Every day at midnight
- `0 3 * * 0` = Every Sunday at 3 AM
- `0 */6 * * *` = Every 6 hours (0, 6, 12, 18)
- `30 22 * * *` = Every day at 10:30 PM

### Examples

**Sync at 6 PM instead of midnight**:
```bash
SYNC_CRON_EXPRESSION=0 18 * * *
```

**Deep validation on Wednesdays at 2 AM**:
```bash
DEEP_VALIDATION_CRON=0 2 * * 3
```

**Disable staggering (not recommended for large workspace counts)**:
```bash
STAGGER_SYNCS=false
```

**Change stagger interval to 5 minutes**:
```bash
STAGGER_INTERVAL_MS=300000
```

## Monitoring What to Watch For

### Key Metrics to Monitor

1. **Sync Duration**
   - Daily sync: Should complete in 10-30 minutes
   - Weekly sync: Should complete in 45-90 minutes
   - If exceeding, check for API rate limit issues or large data volumes

2. **Success Rate**
   - Target: >95% of workspaces sync successfully
   - A few failures are expected (API connectivity, token issues)
   - Persistent failures indicate a systemic issue

3. **Records Synced**
   - Daily: Typically 1000-5000 new/updated records per day
   - Weekly: Should be higher than daily (90-day lookback)
   - Zero or very low counts may indicate missing data or integration issues

4. **Fraud Detections**
   - Monitor fraud risk scores being updated during weekly sync
   - Sudden spike in fraud flags may indicate new attack patterns
   - Review associated specialists for manual validation

### Logging and Observability

The service emits structured logs at each stage:

```json
{
  "message": "Daily performance sync started",
  "timestamp": "2024-01-15T00:00:00Z"
}
```

```json
{
  "message": "Platform sync completed",
  "workspaceId": "ws-123",
  "platform": "meta",
  "specialistsSynced": 42,
  "successfulSpecialists": 40,
  "totalRecordsSynced": 2500
}
```

```json
{
  "message": "Daily performance sync completed",
  "summary": {
    "totalWorkspaces": 5,
    "totalPlatformsProcessed": 15,
    "successfulSyncs": 14,
    "failedSyncs": 1,
    "totalRecordsSynced": 12500,
    "elapsedMs": 1200000,
    "completedAt": "2024-01-15T00:20:00Z"
  }
}
```

### Alerting Rules

Configure alerts in your monitoring system for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Sync Duration | > 60 min | Investigate API rate limits |
| Success Rate | < 80% | Check workspace connectivity |
| Records Synced | = 0 | Verify integration tokens |
| Fraud Flag Rate | > 5% increase | Review affected specialists |
| Failed Platforms | Any workspace | Notify ops team |

### Log Queries

**Find all failed syncs for a workspace**:
```
source: marketplace-cron AND error AND workspaceId: "ws-123"
```

**Monitor weekly validation progress**:
```
source: marketplace-cron AND "deep validation" AND message: "completed"
```

**Find rate limit errors**:
```
source: marketplace-cron AND ("429" OR "rate limit")
```

**Track fraud validation updates**:
```
source: marketplace-cron AND "fraud score re-validation"
```

## Troubleshooting Common Issues

### Issue: Cron jobs not running

**Symptoms**: No sync logs appearing at scheduled times

**Solutions**:
1. Verify `ScheduleModule` is imported in `AppModule`:
   ```typescript
   import { ScheduleModule } from '@nestjs/schedule';
   
   @Module({
     imports: [ScheduleModule.forRoot(), ...]
   })
   ```

2. Check if `MarketplaceCronService` is registered in `AgentsModule`:
   ```typescript
   providers: [MarketplaceCronService, ...],
   exports: [MarketplaceCronService, ...]
   ```

3. Verify environment timezone. Cron times are in UTC by default.

4. Check application logs for initialization errors:
   ```
   grep "MarketplaceCronService\|ScheduleModule" logs/
   ```

### Issue: Only one workspace syncing

**Symptoms**: Logs show only 1 workspace processed instead of all active ones

**Solutions**:
1. Verify `isActive: true` filter in database:
   ```sql
   SELECT id, name, is_active FROM workspaces WHERE is_active = true;
   ```

2. Check workspace count in daily sync logs:
   ```json
   { "message": "Daily sync will process workspaces", "workspaceCount": 1 }
   ```

3. Ensure `Workspace` entity is properly imported in `MarketplaceCronService`

### Issue: API rate limit errors (429)

**Symptoms**: Sync fails with "Rate limit exceeded" errors

**Solutions**:
1. Enable workspace staggering (default is already enabled):
   ```bash
   STAGGER_SYNCS=true
   STAGGER_INTERVAL_MS=300000  # Increase to 5 minutes
   ```

2. Increase intervals between workspace syncs to reduce concurrent API calls

3. Check platform API limits:
   - Meta: 200 requests/hour for app, 600 for user token
   - Google: 1 million daily requests
   - Yandex: 1000 requests/hour

4. If rate limited, the service retries automatically with exponential backoff

### Issue: Token expired errors

**Symptoms**: Sync fails with "Access token expired" or error code 190

**Solutions**:
1. Verify connected accounts are still authenticated:
   ```sql
   SELECT id, platform, is_active, token_expires_at FROM connected_accounts 
   WHERE workspace_id = 'ws-123';
   ```

2. Check if token refresh is failing. Services attempt automatic refresh.

3. For manual refresh, trigger a re-authentication flow for the affected workspace

4. Check logs for "token expired" or "refresh failed" messages

### Issue: Zero records synced

**Symptoms**: Sync succeeds but `totalRecordsSynced: 0`

**Solutions**:
1. Verify specialists exist and have connected ad accounts:
   ```sql
   SELECT id, display_name, agent_type FROM agent_profiles 
   WHERE workspace_id = 'ws-123' AND is_verified = true LIMIT 5;
   ```

2. Check if specialists have campaigns in their ad platforms:
   - Meta: Visit Ads Manager
   - Google: Visit Google Ads
   - Yandex: Visit Direct

3. Verify no campaign records found within date range:
   ```sql
   SELECT COUNT(*) FROM agent_platform_metrics 
   WHERE agent_profile_id = 'ap-123' 
   AND metric_date BETWEEN '2024-01-01' AND '2024-01-31';
   ```

4. Check for API connection errors in logs

### Issue: Memory usage increasing during sync

**Symptoms**: Node process memory grows with each cron job

**Solutions**:
1. Check if cron jobs are completing. Long-running jobs can accumulate memory.

2. Review logs for any unfinished operations:
   ```
   grep "started" logs/ | grep -v "completed"
   ```

3. Increase Node memory limit temporarily:
   ```bash
   export NODE_OPTIONS="--max_old_space_size=4096"
   ```

4. Monitor for memory leaks in sync services (especially large metric loads)

5. Consider reducing `dayLookback` for daily sync if memory is constrained

## Performance Tuning

### For Large Workspace Counts (>10)

1. **Stagger syncs across longer periods**:
   ```bash
   STAGGER_INTERVAL_MS=300000  # 5 minutes between workspaces
   ```

2. **Schedule daily sync during off-peak hours**:
   ```bash
   SYNC_CRON_EXPRESSION=0 2 * * *  # 2 AM instead of midnight
   ```

3. **Run weekly validation on a less critical day**:
   ```bash
   DEEP_VALIDATION_CRON=0 3 * * 6  # Saturday instead of Sunday
   ```

### For High Data Volumes

1. **Reduce daily lookback if needed** (not recommended, but possible):
   - Modify `dayLookback: 30` in `handleDailyPerformanceSync()` method
   - Still run weekly with full 90-day lookback for fraud detection

2. **Increase sync intervals** to stay within API rate limits

3. **Monitor API quota usage** and adjust workspace batch sizes

### Cost Optimization

1. **API calls are proportional to specialists**: More specialists = more API calls
2. **Weekly sync costs more than daily** (3x the lookback period)
3. **Consider batching multiple workspaces** if running separately
4. **Optimize fraud detection rules** to reduce unnecessary checks

## API Integration Points

The cron service uses these integration services:

```typescript
// Meta Ads performance sync
MetaPerformanceSyncService.syncAllSpecialists(workspaceId, config)
  -> PerformanceSyncResult[]

// Google Ads performance sync
GooglePerformanceSyncService.syncAllSpecialists(workspaceId, config)
  -> PerformanceSyncResult[]

// Yandex Direct performance sync
YandexPerformanceSyncService.syncAllSpecialists(workspaceId, config)
  -> PerformanceSyncResult[]

// Fraud score re-validation
FraudDetectionAdminService.revalidateWorkspaceFraudScores(workspaceId)
  -> Promise<void>
```

Each service handles:
- API authentication and token refresh
- Rate limiting and backoff
- Metric normalization and calculation
- Fraud detection validation
- Database persistence

## Architecture

```
MarketplaceCronService
  ├── handleDailyPerformanceSync() [Daily at 00:00 UTC]
  │   └── For each workspace:
  │       ├── MetaPerformanceSyncService.syncAllSpecialists()
  │       ├── GooglePerformanceSyncService.syncAllSpecialists()
  │       └── YandexPerformanceSyncService.syncAllSpecialists()
  │
  └── handleWeeklyDeepValidation() [Sundays at 03:00 UTC]
      └── For each workspace:
          ├── MetaPerformanceSyncService.syncAllSpecialists(config: 90-day, force)
          ├── GooglePerformanceSyncService.syncAllSpecialists(config: 90-day, force)
          ├── YandexPerformanceSyncService.syncAllSpecialists(config: 90-day, force)
          └── FraudDetectionAdminService.revalidateWorkspaceFraudScores()
```

## Security Considerations

1. **Workspace Isolation**: All syncs are scoped to a single workspace
2. **Token Security**: Access tokens are encrypted in the database
3. **API Rate Limiting**: Staggering prevents API abuse
4. **Error Logging**: Sensitive data (tokens, credentials) are not logged
5. **Audit Trail**: All sync operations are logged with timestamps and results

## Support and Debugging

For issues, collect the following information:

1. **Cron job logs** for the time period in question
2. **Workspace count** and **active workspace IDs**
3. **Specialist count** per workspace
4. **API error messages** if present
5. **Environment variables** (without sensitive values)
6. **Database state** (workspace `is_active`, specialist `is_verified`)

Contact the platform engineering team with this information for support.
