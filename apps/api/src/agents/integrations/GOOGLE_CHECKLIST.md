# Google Ads Integration - Implementation Checklist

Use this checklist to track progress implementing the Google Ads API integration.

## Pre-Implementation

- [ ] Read GOOGLE_README.md for overview
- [ ] Read GOOGLE_INTEGRATION_GUIDE.md for data flow
- [ ] Read GOOGLE_API_REFERENCE.md for API details
- [ ] Review GOOGLE_IMPLEMENTATION_EXAMPLES.md code samples
- [ ] Understand database schema (shared with Meta)
- [ ] Confirm Google Cloud credentials available
- [ ] Set up test environment with test Google Ads account

## Phase 1: Environment & Database (Week 1)

### Environment Setup

- [ ] `GOOGLE_CLIENT_ID` available from Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` available from Google Cloud Console
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN` obtained from Google Ads API
- [ ] `ENCRYPTION_KEY` available (32-char hex, same as Meta)
- [ ] All secrets loaded in local .env.example
- [ ] Document where each secret comes from

### Database Preparation

- [ ] Verify agent_platform_metrics table structure (shared with Meta)
- [ ] Create TypeOrmMigration file for schema changes (if not already done for Meta)
- [ ] Add fraud_risk_score to agent_profiles (if not done for Meta)
- [ ] Add last_performance_sync to agent_profiles (if not done for Meta)
- [ ] Add performance_sync_status to agent_profiles (if not done for Meta)
- [ ] Add is_performance_data_verified to agent_profiles (if not done for Meta)
- [ ] Create indexes on agent_platform_metrics
- [ ] Run migration locally
- [ ] Test rollback locally
- [ ] Document migration file path
- [ ] Get backup of production database (if available)

### Configuration

- [ ] Review Google Ads API v15 endpoint (https://googleads.googleapis.com/v15)
- [ ] Confirm GOOGLE_CALLBACK_URL matches OAuth application settings
- [ ] Set up logging level (debug/info/warn)
- [ ] Configure rate limit enforcement (10 req/10s)
- [ ] Document all configuration options

## Phase 2: Service Implementation (Week 1-2)

### Core Service

- [ ] Copy google-sync.service.ts to correct location
- [ ] Review all imports are correct
- [ ] Verify TypeORM entities imported
- [ ] Verify HttpService integration
- [ ] Verify encryption util import
- [ ] Test service can be instantiated
- [ ] Review error handling paths (Google Ads API specific)
- [ ] Check logging is configured (no plaintext tokens)

### Type Safety

- [ ] All interfaces exported
- [ ] PerformanceSyncResult type available
- [ ] MetricsPullConfig type exported
- [ ] FraudValidationResult documented
- [ ] GoogleAccountWithMetrics internal type correct
- [ ] No 'any' types without comments

### Documentation

- [ ] JSDoc comments on all public methods
- [ ] Parameter descriptions complete
- [ ] Return type descriptions complete
- [ ] Error conditions documented
- [ ] Example usage in comments
- [ ] Google Ads API specifics documented (cost_micros, GAQL format, etc.)

## Phase 3: Module Integration (Week 2)

### Module Setup

- [ ] `GooglePerformanceSyncService` added to IntegrationsModule providers
- [ ] `GooglePerformanceSyncService` added to IntegrationsModule exports
- [ ] HttpModule imported in IntegrationsModule
- [ ] Verify circular dependencies resolved
- [ ] Check TypeOrmModule.forFeature has all entities
- [ ] Test app builds without errors
- [ ] Service injectable in other modules

### Dependency Injection

- [ ] GooglePerformanceSyncService provided by module
- [ ] DataSource dependency resolved
- [ ] ConfigService dependency resolved
- [ ] HttpService dependency resolved
- [ ] All Repository injections work
- [ ] No missing provider errors on startup

### Testing

- [ ] Create google-sync.service.spec.ts
- [ ] Write unit tests for main methods
- [ ] Test error handling paths (Google API specific)
- [ ] Test fraud detection rules (verify same as Meta)
- [ ] Test database persistence
- [ ] Test token refresh logic
- [ ] Test rate limiting (10 req/10s enforcement)
- [ ] Achieve 80%+ code coverage

## Phase 4: REST Endpoints (Week 2-3)

### Sync Endpoint

- [ ] Add POST /agents/:agentId/sync-google-metrics
- [ ] Accept dayLookback in body
- [ ] Accept forceRefresh in body
- [ ] Return PerformanceSyncResult
- [ ] Add authentication guard
- [ ] Add workspace isolation
- [ ] Handle NotFoundException (agent not found)
- [ ] Handle BadRequestException (no account)
- [ ] Test with valid inputs
- [ ] Test with invalid inputs
- [ ] Test with missing auth

### Validate Endpoint

- [ ] Add POST /agents/:agentId/validate-google-metrics
- [ ] Run sync with dryRun: true
- [ ] Don't persist to database
- [ ] Return validation result only
- [ ] Test doesn't create metrics
- [ ] Test returns fraud score
- [ ] Test returns warnings

### Combined Endpoints (Optional)

- [ ] Add POST /agents/:agentId/sync-all-metrics (Meta + Google)
- [ ] Run both in parallel for efficiency
- [ ] Return results for both platforms
- [ ] Handle partial failures (one succeeds, one fails)

### Error Responses

- [ ] Return proper HTTP status codes
- [ ] Include error messages in response
- [ ] Include request IDs for tracing
- [ ] Log all errors
- [ ] Return actionable error messages

## Phase 5: Cron Job (Week 3)

### Create Cron Service

- [ ] Create/update agents-cron.service.ts
- [ ] Add Google sync job at 1 AM UTC (after Meta at midnight)
- [ ] Iterate over all workspaces
- [ ] Call syncAllSpecialists per workspace
- [ ] Handle per-workspace errors gracefully
- [ ] Log start/completion of job
- [ ] Track metrics (count successful/failed)

### Stagger Syncs

- [ ] Calculate offset per workspace (optional but recommended)
- [ ] Spread syncs across time window to avoid thundering herd
- [ ] Document scheduling pattern
- [ ] Test with multiple workspaces

### Optional: Weekly Deep Validation

- [ ] Add weekly job for 90-day refresh (Sunday 2 AM UTC)
- [ ] Run on off-peak hours
- [ ] Force fraud detection re-validation
- [ ] Update fraud scores
- [ ] Log changes

### Testing

- [ ] Test cron schedule expression
- [ ] Mock GooglePerformanceSyncService
- [ ] Verify calls per workspace
- [ ] Test error handling
- [ ] Test with multiple workspaces

## Phase 6: Integration (Week 3-4)

### OAuth Callback Enhancement

- [ ] Locate google-auth.controller.ts (or create if needed)
- [ ] After token exchange, inject GooglePerformanceSyncService
- [ ] Trigger syncSpecialistMetrics on successful OAuth
- [ ] Use dayLookback: 90 for initial sync
- [ ] Use forceRefresh: true
- [ ] Log sync result
- [ ] Don't block OAuth callback on sync error
- [ ] Notify user of sync status

### Marketplace Publishing

- [ ] In agents.service.ts, update publishSpecialistToMarketplace
- [ ] Validate metrics in dry-run mode for all platforms
- [ ] Check fraudRiskScore <= 50 (across all platforms)
- [ ] Only publish if validation passes
- [ ] Persist metrics if validation passes
- [ ] Mark specialist as published
- [ ] Set isPerformanceDataVerified
- [ ] Test cannot publish if fraud score high

### Specialist Profile Display

- [ ] Update specialist detail pages to show Google metrics
- [ ] Display combined metrics from Meta + Google
- [ ] Show platform-specific metrics separately
- [ ] Show last sync time for each platform
- [ ] Show fraud risk score

### Admin Dashboard (Optional)

- [ ] Show last_performance_sync timestamp
- [ ] Show performance_sync_status
- [ ] Show fraud_risk_score (per platform)
- [ ] Show monthly_performance array
- [ ] Add manual "Sync Now" button
- [ ] Show sync history/logs
- [ ] Alert if sync status = 'stale'

## Phase 7: Testing (Week 4)

### Unit Tests

- [ ] Test data aggregation by month
- [ ] Test fraud detection rules (all 7 checks, same as Meta)
- [ ] Test token refresh logic
- [ ] Test rate limit enforcement (10 req/10s)
- [ ] Test error handling paths
- [ ] Test metric calculation (ROAS, CPA, CTR)
- [ ] Test cost_micros conversion
- [ ] Test workspace isolation
- [ ] Test partial success scenarios
- [ ] Run: npm test -- google-sync.service.spec.ts

### Integration Tests

- [ ] Test full sync end-to-end
- [ ] Mock Google Ads API responses
- [ ] Verify metrics persisted to DB
- [ ] Verify specialist profile updated
- [ ] Test with multiple customers
- [ ] Test with multiple campaigns
- [ ] Test error recovery
- [ ] Test rate limiting behavior
- [ ] Run: npm run test:e2e

### Manual Testing

- [ ] Create test specialist account
- [ ] Connect real/test Google Ads account via OAuth
- [ ] Manually trigger sync via endpoint
- [ ] Verify metrics appear in database
- [ ] Check specialist profile updated with Google data
- [ ] Verify fraudRiskScore calculated
- [ ] Test token refresh (wait for expiry or trigger)
- [ ] Test rate limiting (many rapid requests)
- [ ] Test with multiple customer accounts
- [ ] Check logs for errors/warnings

### Load Testing

- [ ] Sync 10 specialists in parallel
- [ ] Sync 100 specialists sequentially
- [ ] Monitor database query performance
- [ ] Monitor memory usage
- [ ] Monitor API response times
- [ ] Monitor Google API rate limit behavior
- [ ] Identify bottlenecks
- [ ] Document performance baselines

## Phase 8: Deployment to Staging (Week 5)

### Pre-Deployment

- [ ] All tests passing (unit + integration)
- [ ] Code review completed
- [ ] No TypeScript errors
- [ ] No console.log statements (only logger)
- [ ] All error paths tested
- [ ] Documentation up-to-date
- [ ] No tokens or secrets in code

### Staging Deployment

- [ ] Pull latest code
- [ ] Build in staging environment
- [ ] Set environment variables correctly
- [ ] Run database migrations (or verify already run for Meta)
- [ ] Verify migration succeeded
- [ ] Restart API service
- [ ] Check service is healthy
- [ ] Monitor logs for errors

### Staging Testing

- [ ] Test sync endpoint works
- [ ] Test with real Google Ads account
- [ ] Verify metrics persisted correctly
- [ ] Check cron job runs at 1 AM UTC
- [ ] Monitor for errors for 3-5 days
- [ ] Verify database performance
- [ ] Check API response times
- [ ] Monitor rate limit behavior
- [ ] Test token refresh
- [ ] Compare Meta vs Google data quality

### Staging Monitoring

- [ ] Set up alerts in staging (optional)
- [ ] Monitor sync duration
- [ ] Monitor error rate
- [ ] Monitor fraud scores
- [ ] Collect baseline metrics
- [ ] Document any issues found
- [ ] Test alert escalation

## Phase 9: Production Deployment (Week 5-6)

### Pre-Production Checklist

- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Staging tests all passed
- [ ] Performance baselines documented
- [ ] Monitoring/alerting configured
- [ ] On-call team notified
- [ ] Runbook prepared
- [ ] Time window approved (low-traffic period)

### Production Deployment

- [ ] Verify environment variables set
- [ ] Pull latest code
- [ ] Build (npm run build)
- [ ] Create database backup
- [ ] Run migrations (if not run for Meta)
- [ ] Verify migrations succeeded
- [ ] Deploy to production
- [ ] Verify all replicas are healthy
- [ ] Check service is running

### Post-Deployment Verification

- [ ] Health check endpoint responds
- [ ] Sync endpoint responds
- [ ] Check database for errors
- [ ] Monitor error logs
- [ ] Verify no database locks
- [ ] Check API response times
- [ ] Monitor memory usage
- [ ] Test OAuth flow
- [ ] Test manual sync trigger
- [ ] Verify cron job will run at 1 AM UTC

### Post-Deployment Monitoring (24-48h)

- [ ] Monitor sync duration
- [ ] Monitor success rate
- [ ] Monitor fraud scores
- [ ] Monitor token refresh rate
- [ ] Monitor error logs
- [ ] Check for rate limit issues
- [ ] Verify specialist metrics updated
- [ ] Check specialist marketplace pages
- [ ] Compare Meta vs Google metrics
- [ ] Get stakeholder feedback

## Phase 10: Optimization & Tuning (Week 6+)

### Fraud Detection Tuning

- [ ] Collect real fraud scores
- [ ] Identify outliers
- [ ] Adjust thresholds if needed
- [ ] Review fraud validation rules
- [ ] Document rule changes
- [ ] Communicate changes to admins

### Performance Optimization

- [ ] Analyze query plans
- [ ] Add missing indexes (if any)
- [ ] Optimize batch sizes
- [ ] Consider caching
- [ ] Profile hot paths
- [ ] Optimize rate limiting
- [ ] Compare performance vs Meta integration

### Monitoring & Alerting

- [ ] Finalize alert thresholds
- [ ] Set up dashboards
- [ ] Document alert runbooks
- [ ] Train on-call team
- [ ] Test alert escalation

## Post-Launch Tasks

- [ ] Send launch announcement
- [ ] Update marketing materials
- [ ] Train support team
- [ ] Create FAQ documentation
- [ ] Monitor marketplace impact
- [ ] Gather specialist feedback
- [ ] Plan Phase 3 (TikTok, Yandex, etc.)
- [ ] Document lessons learned

## Quick Reference: File Locations

| File | Purpose | Status |
|------|---------|--------|
| `/apps/api/src/agents/integrations/google-sync.service.ts` | Core service | ✅ Created |
| `/apps/api/src/agents/integrations/integrations.module.ts` | Module | ✅ Updated |
| `/apps/api/src/agents/agents.module.ts` | Add import | TODO |
| `/apps/api/src/agents/agents.controller.ts` | Add endpoints | TODO |
| `/apps/api/src/agents/agents-cron.service.ts` | Cron job | TODO |
| `/apps/api/src/auth/google-auth.controller.ts` | Post-OAuth sync | TODO |
| `/apps/api/src/database/migrations/` | DB migration | ✅ Shared with Meta |

## Quick Reference: Key Contacts

- **Google API Support**: support.google.com/googleads/
- **Google Cloud Console**: console.cloud.google.com
- **Database Team**: @db-team (if applicable)
- **DevOps/Infra**: @infra-team
- **Product**: @product-team
- **Specialist Team**: @specialist-success

## Differences from Meta Integration

### Key Points to Remember

1. **API Client**: Direct HTTP via HttpService (not a custom wrapper service)
2. **API Version**: v15 (vs Meta's v20)
3. **Query Format**: GAQL SQL-like syntax (vs Graph API endpoints)
4. **Cost Unit**: Micros (divide by 1,000,000) (vs currency units)
5. **Rate Limit**: 10 req/10s (vs 200 req/hour)
6. **Account ID**: customer_id (numeric string) (vs ad_account_id)
7. **Data Source**: ServiceEngagement.externalAccountId (vs ConnectedAccount)
8. **Sync Schedule**: 1 AM UTC (after Meta at midnight)

### Testing Considerations

- Ensure Google Ads API responses mock cost_micros correctly
- Test rate limiting with 10-request window (not hourly)
- Verify GAQL query format in mocks
- Test with realistic Google Ads campaign structures

## Sign-Off

- Implementation started: __________ (date)
- Staging deployment: __________ (date)
- Production deployment: __________ (date)
- Post-launch review: __________ (date)

Completed by: __________________ (name/signature)
Reviewed by: __________________ (name/signature)

---

## Notes

Use this space to document any deviations, decisions, or special considerations:

_____________________________________________________

_____________________________________________________

_____________________________________________________
