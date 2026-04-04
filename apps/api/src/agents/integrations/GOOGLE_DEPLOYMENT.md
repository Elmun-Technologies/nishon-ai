# Google Ads Integration - Deployment & Operations Guide

## Pre-Deployment Checklist

### Code Changes

- [ ] `GooglePerformanceSyncService` added to integrations module
- [ ] `GooglePerformanceSyncService` injection configured in services
- [ ] REST endpoints added to `AgentsController` for `/sync-google-metrics` and `/validate-google-metrics`
- [ ] Cron job created with Google sync at 1 AM UTC (after Meta at midnight)
- [ ] Error handling implemented for Google Ads API errors
- [ ] Logging configured (no tokens in logs)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing

### Database

- [ ] Migration created for new columns (shared with Meta)
- [ ] Migration tested locally
- [ ] Backup of production database taken
- [ ] Rollback plan documented

### Configuration

- [ ] `GOOGLE_CLIENT_ID` set in environment
- [ ] `GOOGLE_CLIENT_SECRET` set in environment
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN` set in environment
- [ ] `GOOGLE_CALLBACK_URL` configured
- [ ] `ENCRYPTION_KEY` set (32-char hex, same as Meta)
- [ ] All secrets in secure vault (not .env file)

### Infrastructure

- [ ] NestJS scheduler enabled
- [ ] Database connection pooling adequate
- [ ] HttpService configured for Google Ads API calls
- [ ] Rate limiting configured on API gateway (if any)
- [ ] Monitoring/alerting rules created

## Deployment Steps

### 1. Prepare Environment

```bash
# Verify environment variables
echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:?not set}"
echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:?not set}"
echo "GOOGLE_ADS_DEVELOPER_TOKEN=${GOOGLE_ADS_DEVELOPER_TOKEN:?not set}"
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY:?not set}"

# Test database connection
npm run typeorm migration:show

# Run migrations in dry-run first
npm run typeorm migration:run -- --dry-run
```

### 2. Run Migrations

```bash
# Apply database migrations
npm run typeorm migration:run

# Verify migration succeeded
npm run typeorm migration:show  # Should show migration as successful

# Query to verify new columns exist
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns 
  WHERE table_name='agent_profiles' 
  AND column_name IN ('fraud_risk_score', 'last_performance_sync', 
                      'performance_sync_status', 'is_performance_data_verified')"
```

### 3. Build & Test

```bash
# Build NestJS app
npm run build

# Run full test suite
npm test

# Run integration tests
npm run test:e2e

# Verify no TypeScript errors
npm run type-check
```

### 4. Deploy

```bash
# Option A: Docker
docker build -t performa-api:vX.Y.Z .
docker push your-registry/performa-api:vX.Y.Z
kubectl apply -f deployment.yaml  # Update image tag first

# Option B: Direct deployment
npm run build
cp -r dist /var/www/performa-api/
systemctl restart performa-api
```

### 5. Post-Deployment Verification

```bash
# Check service is running
curl http://localhost:3000/health

# Test Google OAuth flow
# 1. Get auth URL: GET /auth/google/authorize
# 2. Complete OAuth
# 3. Check ConnectedAccount created in DB

# Test manual sync endpoint
curl -X POST http://localhost:3000/agents/:agentId/sync-google-metrics \
  -H "Authorization: Bearer TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dayLookback": 7}'

# Verify cron job scheduled
# Check logs for "Starting daily Google Ads performance metrics sync" at 1 AM UTC
```

## Rollback Plan

If issues found post-deployment:

### Option 1: Revert Code

```bash
# Revert to previous version
git revert HEAD
npm run build
# Redeploy previous version
```

### Option 2: Revert Database

```bash
# Rollback migrations
npm run typeorm migration:revert

# Verify columns removed
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns 
  WHERE table_name='agent_profiles' AND column_name = 'fraud_risk_score'"
# Should return empty
```

### Option 3: Disable Feature

If code is deployed but causing issues:

```typescript
// In google-sync.service.ts
async syncSpecialistMetrics(...) {
  if (!this.config.get("FEATURE_GOOGLE_SYNC_ENABLED")) {
    throw new Error("Google Ads sync temporarily disabled");
  }
  // ... rest of code
}
```

Set `FEATURE_GOOGLE_SYNC_ENABLED=false` to disable.

## Monitoring Setup

### Logs to Watch

**INFO** (normal):
```
"Performance sync started for specialist"
"Performance sync completed successfully"
"Token refreshed successfully"
"Metrics persisted"
```

**WARN** (investigate):
```
"No campaigns found in connected Google Ads accounts"
"Rate limit approached, applying backoff"
"Token decryption failed"
"High fraud risk score detected"
```

**ERROR** (critical):
```
"Performance sync failed"
"Token refresh failed"
"Database transaction failed"
```

### Key Metrics to Monitor

```typescript
// In your monitoring dashboard (DataDog, Prometheus, etc.)
{
  "google_sync_duration_ms": {
    "p50": 3000,
    "p95": 8000,
    "p99": 15000
  },
  "google_campaigns_synced": {
    "p50": 30,
    "p95": 100
  },
  "google_fraud_risk_score": {
    "avg": 15,
    "max": 85
  },
  "google_sync_success_rate": 0.98,  // 98% success
  "google_error_rate": 0.02,         // 2% errors
  "google_rate_limit_hits": 0,       // Should be minimal
  "google_token_refreshes_daily": 2  // Expected token refresh rate
}
```

### Alerts to Set Up

| Metric | Threshold | Action |
|--------|-----------|--------|
| Sync duration | > 30s | Page on-call |
| Fraud score avg | > 40 | Slack alert to admins |
| Sync failures | > 5% daily | Page on-call |
| Token refresh failures | > 10/day | Slack alert |
| Rate limit hits | > 100/day | Investigate API usage |
| Database errors | > 0 | Critical alert |
| Cron job failure | Any | Critical alert |

### Example Prometheus Alerts

```yaml
groups:
  - name: google_sync
    rules:
      - alert: GoogleSyncHighFraudScore
        expr: google_sync_fraud_score_avg > 40
        for: 1h
        annotations:
          summary: "High average fraud score in Google syncs"
          
      - alert: GoogleSyncSlowDuration
        expr: google_sync_duration_ms > 30000
        for: 15m
        annotations:
          summary: "Google sync taking > 30 seconds"
          
      - alert: GoogleSyncHighFailureRate
        expr: google_sync_success_rate < 0.95
        for: 1h
        annotations:
          summary: "Google sync failure rate > 5%"
          
      - alert: GoogleSyncRateLimitHits
        expr: increase(google_sync_rate_limit_hits[1h]) > 50
        for: 15m
        annotations:
          summary: "High rate limit hits on Google API"
```

## Health Checks

### Database Health

```sql
-- Check if metrics table is accessible
SELECT COUNT(*) FROM agent_platform_metrics WHERE platform = 'google';

-- Check recent syncs
SELECT MAX(synced_at) as last_sync FROM agent_platform_metrics WHERE platform = 'google';

-- Check for stale data (last sync > 7 days ago)
SELECT COUNT(*) FROM agent_profiles 
WHERE last_performance_sync < NOW() - INTERVAL '7 days' AND is_published = true;
```

### API Health

```bash
# Check if sync endpoint responds
curl -s http://localhost:3000/agents/test-id/sync-google-metrics -I

# Check if cron job is running (should see log entries at 1 AM UTC)
tail -f /var/log/performa-api.log | grep "Starting daily Google Ads"
```

### Service Health

```typescript
// Add health check endpoint
@Get("health/google-sync")
async getGoogleSyncHealth() {
  const lastSync = await metricsRepo
    .createQueryBuilder()
    .where("platform = :platform", { platform: "google" })
    .orderBy("synced_at", "DESC")
    .limit(1)
    .getOne();

  const syncedRecently = lastSync?.syncedAt > new Date(Date.now() - 86400000);

  return {
    status: syncedRecently ? "healthy" : "stale",
    lastSync: lastSync?.syncedAt,
    syncStale: !syncedRecently
  };
}
```

## Operational Tasks

### Manually Sync a Specialist

```bash
# Via API
curl -X POST https://api.example.com/agents/$AGENT_ID/sync-google-metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dayLookback": 30, "forceRefresh": true}'

# Via CLI (if available)
npm run cli -- sync-metrics --agent-id $AGENT_ID --workspace-id $WS_ID --platform google
```

### Fix High Fraud Score

1. **Investigate**: Check the warnings in sync result
   ```sql
   SELECT * FROM agent_platform_metrics 
   WHERE agent_profile_id = $ID AND platform = 'google' AND fraud_risk_score > 50
   ORDER BY aggregation_period DESC;
   ```

2. **Review**: Check metrics in Google Ads Manager
   - Verify conversion tracking is set up
   - Check for bot traffic or invalid clicks
   - Review campaign objectives

3. **Resolve**: After fixing in Google Ads, force refresh
   ```bash
   curl -X POST /agents/$ID/sync-google-metrics \
     -d '{"forceRefresh": true}'
   ```

### Handle Token Expiration

```sql
-- Find accounts with expired tokens
SELECT ca.*, ap.display_name 
FROM connected_accounts ca
JOIN agent_profiles ap ON ap.id = ca.agent_profile_id
WHERE ca.platform = 'google' 
  AND ca.token_expires_at < NOW();

-- Notify affected specialists
-- (Admin should send email asking them to re-authorize)
```

### Update Fraud Detection Rules

To modify fraud detection thresholds:

```typescript
// In google-sync.service.ts validateMetricsWithFraudDetection()
private fraudDetectionConfig = {
  negativeSpendRisk: 25,        // Change here
  ctrMaxPercent: 100,
  cpaMinDollars: 0.01,
  cpaMaxDollars: 10000,
  roasMaxSpikeFactor: 2.0,      // Change here
  ...
};
```

After changes:
1. Deploy new code
2. Force refresh metrics: `forceRefresh: true`
3. Monitor fraud scores for changes

## Performance Tuning

### Database Query Optimization

```sql
-- Ensure indexes exist
CREATE INDEX idx_agent_platform_metrics_profile 
  ON agent_platform_metrics(agent_profile_id, platform, aggregation_period);

CREATE INDEX idx_agent_platform_metrics_synced 
  ON agent_platform_metrics(synced_at DESC);

CREATE INDEX idx_agent_platform_metrics_platform 
  ON agent_platform_metrics(platform);

-- Analyze table for query planner
ANALYZE agent_platform_metrics;

-- Check for missing indexes
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

### Rate Limiting Tuning

Google Ads API limit: 10 requests per 10 seconds.

If hitting limits frequently:
1. Check if multiple workspaces syncing simultaneously
2. Stagger cron jobs across time windows
3. Increase wait time threshold before sync starts

```typescript
// In google-sync.service.ts applyRateLimit()
private async applyRateLimit(customerId: string) {
  // Current: uses 10 request window, 100ms buffer
  // If issues, increase buffer or reduce batch size
  const bufferMs = 200; // Increase from 100 if needed
}
```

### Batch Size Optimization

If syncing many specialists:
- Consider processing specialists in smaller batches
- Add delays between workspace syncs
- Monitor database connection pool usage

---

## Troubleshooting

### "No active Google Ads integration found"

**Cause**: Specialist hasn't connected Google Ads account via OAuth  
**Fix**: Complete OAuth flow in settings → Integrations → Connect Google Ads

**Debug**:
```sql
SELECT * FROM connected_accounts 
WHERE platform = 'google' AND workspace_id = $ID;
```

### "Rate limit approached, applying backoff"

**Cause**: Making requests too quickly  
**Fix**: This is automatic. Normal during bulk syncs.

**Verify**:
```bash
# Check logs for backoff messages
tail -f /var/log/performa-api.log | grep "Rate limit"
```

### Sync timeout (> 30 seconds)

**Cause**: Too many campaigns or API slowness  
**Fix**: 
1. Reduce `dayLookback` (use 7-14 days instead of 30)
2. Check Google API status at console.cloud.google.com
3. Increase timeout in configuration if available

### Token refresh fails

**Cause**: Refresh token expired (> 60 days of no use)  
**Fix**: Specialist must re-authorize via OAuth

**Debug**:
```sql
SELECT * FROM connected_accounts 
WHERE platform = 'google' AND token_expires_at < NOW();
```

### High fraud risk scores after deployment

**Cause**: New deployment using different fraud detection thresholds  
**Fix**: Review the changes to `validateMetricsWithFraudDetection()`

**Rollback if necessary**:
```typescript
// Temporarily disable fraud detection
const fraudRiskScore = 0; // Bypass detection
```

### Database locks during migration

**Cause**: Migration blocking other queries  
**Fix**: Run migration during maintenance window

```bash
# Check for locks before migration
psql $DATABASE_URL -c "SELECT * FROM pg_locks;"

# Run with lower lock level if possible
npm run typeorm migration:run -- --transaction=false
```

## Monitoring Dashboards

### Sample Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Google Ads Sync Health",
    "panels": [
      {
        "title": "Sync Success Rate",
        "targets": [
          {
            "expr": "rate(google_sync_total[5m])"
          }
        ]
      },
      {
        "title": "Sync Duration (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, google_sync_duration_ms)"
          }
        ]
      },
      {
        "title": "Fraud Score Distribution",
        "targets": [
          {
            "expr": "google_fraud_risk_score"
          }
        ]
      },
      {
        "title": "Rate Limit Hits",
        "targets": [
          {
            "expr": "increase(google_rate_limit_hits[1h])"
          }
        ]
      }
    ]
  }
}
```

## Disaster Recovery

### Restore from Backup

```bash
# Stop API service
systemctl stop performa-api

# Restore database from backup
pg_restore -d performa_prod /backups/performa_db_2024-03-05.dump

# Check data integrity
psql performa_prod -c "SELECT COUNT(*) FROM agent_platform_metrics WHERE platform='google';"

# Restart service
systemctl start performa-api

# Verify health
curl http://localhost:3000/health/google-sync
```

### Data Cleanup

If corrupted data exists:

```sql
-- Remove corrupted metrics for a specialist
DELETE FROM agent_platform_metrics 
WHERE agent_profile_id = $ID 
  AND platform = 'google'
  AND fraud_risk_score > 80;

-- Reset sync status
UPDATE agent_profiles 
SET last_performance_sync = NULL,
    performance_sync_status = 'never_synced'
WHERE id = $ID;
```

Then trigger new sync to repopulate clean data.

---

## Post-Deployment Tasks

- [ ] Monitor for 24-48 hours
- [ ] Verify cron jobs ran at scheduled times
- [ ] Check fraud scores are reasonable
- [ ] Confirm specialist pages show updated metrics
- [ ] Gather feedback from stakeholders
- [ ] Document any issues encountered
- [ ] Plan follow-up optimizations
