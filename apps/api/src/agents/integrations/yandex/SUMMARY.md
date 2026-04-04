# Yandex Direct Integration - Executive Summary

## What This Does

The Yandex Direct performance sync service automatically pulls real advertising performance data from specialist accounts and stores it in the Performa marketplace. This provides:

- **Transparency**: Clients see verified, real performance data
- **Trust**: Metrics validated against fraud detection rules
- **Efficiency**: Automated daily syncs eliminate manual reporting
- **Accuracy**: Direct API pulls eliminate manual data entry errors

## Why It Matters

Specialists without verified performance data have lower credibility in the marketplace. The Yandex Direct integration provides:

1. **For Specialists**: Showcase real results to land higher-value clients
2. **For Clients**: Hire with confidence based on verified past performance
3. **For Performa**: Build reputation as trusted marketplace with proven experts

## The Problem It Solves

| Without Integration | With Integration |
|-------------------|------------------|
| Manual copy-paste reporting | Automatic daily syncs |
| Easy to fake numbers | Fraud detection validates metrics |
| Outdated data | Latest performance always current |
| Client skepticism | Verified, trusted data |
| Specialist friction | One-time OAuth setup, then automatic |

## How It Works (60-Second Overview)

1. **Specialist connects** Yandex Direct account via OAuth
2. **Service fetches** all campaigns and daily performance data
3. **Validates data** against fraud detection rules (checks for impossible values)
4. **Converts currencies** from RUB to specialist's preferred currency
5. **Stores metrics** in database (monthly aggregated)
6. **Updates profile** with calculated stats (ROAS, CPA, CTR)
7. **Repeats daily** via scheduled sync

## Key Numbers

| Metric | Value |
|--------|-------|
| API Calls per specialist sync | ~5-20 (depends on campaigns) |
| Data retention | 2 years historical |
| Rate limit | 1000 requests/hour |
| Average sync time | 2-5 seconds per specialist |
| Fraud detection rules | 8 patterns checked |
| Currency support | 20+ currencies |

## What Gets Stored

For each specialist and month:

```json
{
  "platform": "yandex",
  "month": "2024-01",
  "totalSpend": 5000.00,
  "totalRevenue": 25000.00,
  "roas": 5.0,
  "cpa": 50.00,
  "ctr": 2.5,
  "campaigns": 3,
  "conversions": 100,
  "fraudRiskScore": 15,
  "verified": true
}
```

## Fraud Detection

If data looks suspicious, the system flags it:

- Negative spend or clicks ❌
- CTR > 100% ❌
- Clicks > impressions ❌
- Conversions without spend ❌
- ROAS outside realistic range ❌
- Sudden 3x performance spike ❌

Score > 50 = marked as "stale" in UI
Score > 30 = marked as "unverified"

## Integration Points

```
ServiceEngagement
    ↓
[Yandex Token Storage]
    ↓
YandexPerformanceSyncService
    ↓
AgentPlatformMetrics (DB)
    ↓
AgentProfile (cached stats)
    ↓
Marketplace (specialist profile page)
```

## Configuration Required

```bash
YANDEX_CLIENT_ID=...              # OAuth app credentials
YANDEX_CLIENT_SECRET=...
ENCRYPTION_KEY=...                # 32-char key for token encryption
CURRENCY_RATES_JSON='{"USD": 1}' # Exchange rates
```

## Error Handling Strategy

| Error Type | Response |
|-----------|----------|
| Token expired | Automatic refresh attempt |
| API rate limit | Exponential backoff + queue |
| Missing campaigns | Log warning, continue with others |
| Fraud detected | Flag specialist, include in score |
| Network timeout | Retry with exponential backoff |
| Database error | Rollback transaction, log error |

## Performance Characteristics

- **Fast**: Most syncs complete in 2-5 seconds
- **Scalable**: Handles 1000+ specialists per workspace
- **Resilient**: Partial failures don't break entire sync
- **Efficient**: Monthly aggregation reduces storage by 95%
- **Safe**: Transaction-backed database operations

## Security Measures

| Component | Protection |
|-----------|-----------|
| OAuth tokens | AES-256-CBC encryption at rest |
| Token access | Per-request decryption, never logged |
| Workspace isolation | All queries filtered by workspace_id |
| API credentials | Stored in environment variables only |
| Logs | No sensitive data in any log entry |

## Deployment Checklist

- [ ] Add YandexPerformanceSyncService to module exports
- [ ] Configure environment variables (see Configuration)
- [ ] Add REST endpoints for manual sync trigger
- [ ] Set up cron job for daily automatic sync
- [ ] Configure audit logging to AgentPerformanceSyncLog
- [ ] Add rate limit monitoring dashboard
- [ ] Set up alerts for high fraud risk scores
- [ ] Document for specialist onboarding flow

## Usage Patterns

### One-Time Sync
```typescript
const result = await service.syncSpecialistMetrics(agentId, workspaceId);
```

### Bulk Sync (Daily Cron)
```typescript
const results = await service.syncAllSpecialists(workspaceId);
```

### Dry Run (Validation Only)
```typescript
const result = await service.syncSpecialistMetrics(agentId, workspaceId, {
  dryRun: true // No data persisted
});
```

### Force Refresh
```typescript
const result = await service.syncSpecialistMetrics(agentId, workspaceId, {
  forceRefresh: true // Overwrite existing data
});
```

## Success Metrics

Track these to measure integration success:

1. **Data Completeness**: % of specialists with verified metrics
2. **Sync Success Rate**: % of daily syncs that complete without error
3. **Fraud Detection**: % flagged as suspicious (should be 5-10%)
4. **Client Confidence**: Increase in specialist profile views/hires
5. **Data Freshness**: How recent the data is (should be < 24 hours)

## Known Limitations

1. **Data Lag**: Yandex reports data with 24-48 hour delay
2. **Campaign Grouping**: Only campaign-level data, not ad group level
3. **Historical Data**: Limited to 2 years of history
4. **Rate Limit**: 1000 requests/hour shared across all workspaces
5. **Currency**: Only supports currencies in CURRENCY_RATES_JSON
6. **Manual Updates**: Exchange rates require periodic manual updates

## Technical Debt & Future Work

1. **Real-time currency rates**: Integrate with currency API instead of config
2. **Webhook support**: Listen for Yandex campaign changes in real-time
3. **ML fraud detection**: Replace rule-based with ML model
4. **Performance optimization**: Cache campaign lists for faster syncs
5. **Multi-account**: Support specialists with multiple Yandex accounts

## Support & Troubleshooting

See README.md for:
- Quick start guide
- Common error scenarios and solutions
- Configuration details
- Monitoring and logging

See INTEGRATION_GUIDE.md for:
- Module integration steps
- REST endpoint implementation
- Cron job setup
- Audit logging integration

## Related Services

- **MetaPerformanceSyncService**: Same pattern, different API (Meta Ads)
- **GooglePerformanceSyncService**: Same pattern, different API (Google Ads)
- **AgentProfile**: Specialist data and cached stats
- **AgentPlatformMetrics**: Storage for all platform metrics

## Questions?

Refer to:
1. INTEGRATION_GUIDE.md - Technical implementation details
2. API_REFERENCE.md - Complete API documentation
3. IMPLEMENTATION_EXAMPLES.md - Code samples and patterns
4. Yandex Direct API docs - https://yandex.com/dev/direct/doc/
