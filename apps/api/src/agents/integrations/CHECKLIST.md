# Implementation Checklist

Use this checklist to track progress implementing the Meta Ads API integration.

## Pre-Implementation

- [ ] Read SUMMARY.md for overview
- [ ] Read INTEGRATION_GUIDE.md for data flow
- [ ] Read API_REFERENCE.md for API details
- [ ] Review IMPLEMENTATION_EXAMPLES.md code samples
- [ ] Understand database schema changes
- [ ] Confirm Meta API credentials available
- [ ] Set up test environment with test specialist account

## Phase 1: Environment & Database (Week 1)

### Environment Setup
- [ ] `META_APP_ID` available in vault/env
- [ ] `META_APP_SECRET` available in vault/env
- [ ] `ENCRYPTION_KEY` generated (32-char hex)
- [ ] All secrets loaded in local .env.example
- [ ] Document where each secret comes from

### Database Preparation
- [ ] Create TypeOrmMigration file for schema changes
- [ ] Add fraud_risk_score to agent_profiles
- [ ] Add last_performance_sync to agent_profiles
- [ ] Add performance_sync_status to agent_profiles
- [ ] Add is_performance_data_verified to agent_profiles
- [ ] Verify agent_platform_metrics table structure
- [ ] Create indexes on agent_platform_metrics
- [ ] Run migration locally
- [ ] Test rollback locally
- [ ] Document migration file path
- [ ] Get backup of production database (if available)

### Configuration
- [ ] Review GRAPH_VERSION in MetaAdsService (v20.0)
- [ ] Confirm META_CALLBACK_URL matches app settings
- [ ] Set up logging level (debug/info/warn)
- [ ] Configure rate limit backoff values
- [ ] Document all configuration options

## Phase 2: Service Implementation (Week 1-2)

### Core Service
- [ ] Copy meta-sync.service.ts to correct location
- [ ] Copy integrations.module.ts to correct location
- [ ] Review all imports are correct
- [ ] Verify TypeORM entities imported
- [ ] Check MetaAdsService integration
- [ ] Verify encryption util import
- [ ] Test service can be instantiated
- [ ] Review error handling paths
- [ ] Check logging is configured

### Type Safety
- [ ] All interfaces exported
- [ ] PerformanceSyncResult type available
- [ ] MetricsPullConfig type exported
- [ ] FraudValidationResult documented
- [ ] MetaAccountWithMetrics internal type correct
- [ ] No 'any' types without comments

### Documentation
- [ ] JSDoc comments on all public methods
- [ ] Parameter descriptions complete
- [ ] Return type descriptions complete
- [ ] Error conditions documented
- [ ] Example usage in comments

## Phase 3: Module Integration (Week 2)

### Import IntegrationsModule
- [ ] Add to AgentsModule imports
- [ ] Verify circular dependencies resolved
- [ ] Check TypeOrmModule.forFeature has all entities
- [ ] Verify HttpModule imported
- [ ] Confirm MetaModule available to import
- [ ] Test app builds without errors
- [ ] Service injectable in other modules

### Dependency Injection
- [ ] MetaPerformanceSyncService provided by module
- [ ] MetaAdsService dependency resolved
- [ ] DataSource dependency resolved
- [ ] ConfigService dependency resolved
- [ ] HttpService dependency resolved
- [ ] All Repository injections work
- [ ] No missing provider errors on startup

### Testing
- [ ] Create meta-sync.service.spec.ts
- [ ] Write unit tests for main methods
- [ ] Test error handling paths
- [ ] Test fraud detection rules
- [ ] Test database persistence
- [ ] Test token refresh logic
- [ ] Test rate limiting
- [ ] Achieve 80%+ code coverage

## Phase 4: REST Endpoints (Week 2-3)

### Sync Endpoint
- [ ] Add POST /agents/:agentId/sync-meta-metrics
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
- [ ] Add POST /agents/:agentId/validate-meta-metrics
- [ ] Run sync with dryRun: true
- [ ] Don't persist to database
- [ ] Return validation result only
- [ ] Test doesn't create metrics
- [ ] Test returns fraud score
- [ ] Test returns warnings

### Error Responses
- [ ] Return proper HTTP status codes
- [ ] Include error messages in response
- [ ] Include request IDs for tracing
- [ ] Log all errors
- [ ] Return actionable error messages

## Phase 5: Cron Job (Week 3)

### Create Cron Service
- [ ] Create agents-cron.service.ts (if new)
- [ ] Add daily sync job at midnight UTC
- [ ] Iterate over all workspaces
- [ ] Call syncAllSpecialists per workspace
- [ ] Handle per-workspace errors gracefully
- [ ] Log start/completion of job
- [ ] Track metrics (count successful/failed)

### Optional: Stagger Syncs
- [ ] Calculate offset per workspace
- [ ] Spread syncs across the hour
- [ ] Prevent thundering herd
- [ ] Document scheduling pattern

### Optional: Weekly Deep Validation
- [ ] Add weekly job for 90-day refresh
- [ ] Run on off-peak hours (weekend)
- [ ] Force fraud detection re-validation
- [ ] Update fraud scores
- [ ] Log changes

### Testing
- [ ] Test cron schedule expression
- [ ] Mock MetaPerformanceSyncService
- [ ] Verify calls per workspace
- [ ] Test error handling
- [ ] Test with multiple workspaces

## Phase 6: Integration (Week 3-4)

### OAuth Callback Enhancement
- [ ] Locate meta-auth.controller.ts
- [ ] After token exchange, inject MetaPerformanceSyncService
- [ ] Trigger syncSpecialistMetrics on successful OAuth
- [ ] Use dayLookback: 90 for initial sync
- [ ] Use forceRefresh: true
- [ ] Log sync result
- [ ] Don't block OAuth callback on sync error
- [ ] Notify user of sync status

### Marketplace Publishing
- [ ] In agents.service.ts, add publishSpecialistToMarketplace
- [ ] Validate metrics in dry-run mode first
- [ ] Check fraudRiskScore <= 50
- [ ] Only publish if validation passes
- [ ] Persist metrics if validation passes
- [ ] Mark specialist as published
- [ ] Set isPerformanceDataVerified
- [ ] Test cannot publish if fraud score high

### Admin Dashboard (Optional)
- [ ] Show last_performance_sync timestamp
- [ ] Show performance_sync_status
- [ ] Show fraud_risk_score
- [ ] Show monthly_performance array
- [ ] Add manual "Sync Now" button
- [ ] Show sync history/logs
- [ ] Alert if sync status = 'stale'

## Phase 7: Testing (Week 4)

### Unit Tests
- [ ] Test data aggregation by month
- [ ] Test fraud detection rules (all 7 checks)
- [ ] Test token refresh logic
- [ ] Test rate limit backoff
- [ ] Test error handling paths
- [ ] Test metric calculation (ROAS, CPA, CTR)
- [ ] Test workspace isolation
- [ ] Test partial success scenarios
- [ ] Run: npm test -- meta-sync.service.spec.ts

### Integration Tests
- [ ] Test full sync end-to-end
- [ ] Mock Meta API responses
- [ ] Verify metrics persisted to DB
- [ ] Verify specialist profile updated
- [ ] Test with multiple accounts
- [ ] Test with multiple campaigns
- [ ] Test error recovery
- [ ] Run: npm run test:e2e

### Manual Testing
- [ ] Create test specialist account
- [ ] Connect real/test Meta account via OAuth
- [ ] Manually trigger sync via endpoint
- [ ] Verify metrics appear in database
- [ ] Check specialist profile updated
- [ ] Verify fraudRiskScore calculated
- [ ] Test token refresh (wait for expiry)
- [ ] Test rate limiting (many rapid requests)
- [ ] Test with multiple accounts
- [ ] Check logs for errors/warnings

### Load Testing
- [ ] Sync 10 specialists in parallel
- [ ] Sync 100 specialists sequentially
- [ ] Monitor database query performance
- [ ] Monitor memory usage
- [ ] Monitor API response times
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

### Staging Deployment
- [ ] Pull latest code
- [ ] Build in staging environment
- [ ] Set environment variables correctly
- [ ] Run database migrations
- [ ] Verify migration succeeded
- [ ] Restart API service
- [ ] Check service is healthy
- [ ] Monitor logs for errors

### Staging Testing
- [ ] Test sync endpoint works
- [ ] Test with real Meta account
- [ ] Verify metrics persisted
- [ ] Check cron job runs
- [ ] Monitor for errors for 3-5 days
- [ ] Verify database performance
- [ ] Check API response times
- [ ] Monitor rate limit behavior
- [ ] Test token refresh

### Staging Monitoring
- [ ] Set up alerts in staging (optional)
- [ ] Monitor sync duration
- [ ] Monitor error rate
- [ ] Monitor fraud scores
- [ ] Collect baseline metrics
- [ ] Document any issues found

## Phase 9: Production Deployment (Week 5-6)

### Pre-Production Checklist
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Staging tests all passed
- [ ] Performance baselines documented
- [ ] Monitoring/alerting configured
- [ ] On-call team notified
- [ ] Runbook prepared
- [ ] Time window approved

### Production Deployment
- [ ] Verify environment variables set
- [ ] Pull latest code
- [ ] Build (npm run build)
- [ ] Create database backup
- [ ] Run migrations (limited test run first)
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
- [ ] Verify cron job ran

### Post-Deployment Monitoring (24-48h)
- [ ] Monitor sync duration
- [ ] Monitor success rate
- [ ] Monitor fraud scores
- [ ] Monitor token refresh rate
- [ ] Monitor error logs
- [ ] Check for rate limit issues
- [ ] Verify specialist metrics updated
- [ ] Check specialist marketplace pages
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
- [ ] Plan Phase 2 (Google, etc.)
- [ ] Document lessons learned

## Quick Reference: File Locations

| File | Purpose | Status |
|------|---------|--------|
| `/apps/api/src/agents/integrations/meta-sync.service.ts` | Core service | ✅ Created |
| `/apps/api/src/agents/integrations/integrations.module.ts` | Module | ✅ Created |
| `/apps/api/src/agents/agents.module.ts` | Add import | TODO |
| `/apps/api/src/agents/agents.controller.ts` | Add endpoints | TODO |
| `/apps/api/src/agents/agents-cron.service.ts` | Cron job | TODO |
| `/apps/api/src/auth/meta-auth.controller.ts` | Post-OAuth sync | TODO |
| `/apps/api/src/database/migrations/` | DB migration | TODO |

## Quick Reference: Key Contacts

- **Meta API Support**: developers.facebook.com/support
- **Database Team**: @db-team (if applicable)
- **DevOps/Infra**: @infra-team
- **Product**: @product-team
- **Specialist Team**: @specialist-success

## Sign-Off

- Implementation started: __________ (date)
- Staging deployment: __________ (date)
- Production deployment: __________ (date)
- Post-launch review: __________ (date)

Completed by: __________________ (name/signature)
Reviewed by: __________________ (name/signature)

