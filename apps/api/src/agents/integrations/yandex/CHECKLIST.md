# Yandex Direct Integration - Implementation Checklist

Track your progress implementing the Yandex Direct performance sync integration.

---

## Phase 1: Setup & Configuration

### Code Integration

- [ ] Copy `yandex-sync.service.ts` to `/apps/api/src/agents/integrations/`
- [ ] Add `YandexPerformanceSyncService` to IntegrationsModule providers
- [ ] Add `YandexPerformanceSyncService` to IntegrationsModule exports
- [ ] Verify TypeScript compilation: `npm run build`
- [ ] No TypeScript errors in strict mode

### Environment Configuration

- [ ] Add `YANDEX_CLIENT_ID` to .env.example
- [ ] Add `YANDEX_CLIENT_SECRET` to .env.example
- [ ] Add `ENCRYPTION_KEY` to .env.example (32 chars)
- [ ] Add `CURRENCY_RATES_JSON` to .env.example
- [ ] Generate ENCRYPTION_KEY: `openssl rand -hex 16`
- [ ] Set all vars in local .env for development
- [ ] Document all vars in README.md

### Database Schema

- [ ] Verify `agent_platform_metrics` table exists
- [ ] Check columns: `platform`, `aggregation_period`, `avg_roas`, `avg_cpa`
- [ ] Verify unique constraint on `(agentProfileId, platform, aggregationPeriod)`
- [ ] Add index on `(agentProfileId, platform)` for fast queries
- [ ] Verify `service_engagements` table for token storage
- [ ] Add columns: `yandex_access_token`, `yandex_token_expires_at`, etc.
- [ ] Test migration locally: `npm run migration:run`

### Entity Updates

- [ ] Verify `AgentProfile` entity has `cachedStats` field
- [ ] Verify `AgentProfile` has `fraudRiskScore` field
- [ ] Verify `AgentProfile` has `monthlyPerformance` field
- [ ] Verify `ServiceEngagement` can store Yandex tokens
- [ ] Add TypeScript interfaces if needed

---

## Phase 2: Module Integration

### Service Injection

- [ ] YandexPerformanceSyncService can be injected in other services
- [ ] All repositories injected correctly
- [ ] HttpService available for API calls
- [ ] DataSource available for transactions
- [ ] ConfigService available for env vars

### Module Exports

- [ ] IntegrationsModule exports YandexPerformanceSyncService
- [ ] AgentsModule imports IntegrationsModule
- [ ] Service available in controllers

### Dependency Resolution

- [ ] `npm run build` completes without errors
- [ ] No circular dependencies
- [ ] All peer dependencies installed

---

## Phase 3: REST Endpoints

### Manual Sync Endpoint

File: Create `/apps/api/src/agents/integrations/yandex.controller.ts`

- [ ] POST `/sync/yandex/specialist/:agentId` implemented
- [ ] Accepts MetricsPullConfig in request body
- [ ] Returns PerformanceSyncResult
- [ ] JWT auth guard applied
- [ ] Workspace isolation enforced (user.workspaceId)
- [ ] Error handling with proper HTTP status codes
- [ ] Request validation (agentId format, config validation)

### Bulk Sync Endpoint

- [ ] POST `/sync/yandex/bulk` implemented
- [ ] No agentId parameter (syncs all specialists)
- [ ] Returns array of PerformanceSyncResult
- [ ] JWT auth guard applied
- [ ] Admin check if needed
- [ ] Error handling for partial failures

### Validation Endpoint

- [ ] POST `/sync/yandex/specialist/:agentId/validate` implemented
- [ ] Forces `dryRun: true`
- [ ] Returns validation result without persisting
- [ ] Useful for testing connectivity

### Endpoint Testing

- [ ] Test successful sync: `curl -X POST /sync/yandex/specialist/agent-id`
- [ ] Test missing specialist: verify 404 response
- [ ] Test no Yandex integration: verify 400 response
- [ ] Test invalid config: verify 400 response
- [ ] Test unauthorized: verify 401 response
- [ ] Check response format matches PerformanceSyncResult

---

## Phase 4: Cron Scheduling

File: Create `/apps/api/src/agents/integrations/yandex-sync.scheduler.ts`

### Daily Sync

- [ ] `@Cron(CronExpression.EVERY_DAY_AT_3AM)` decorator applied
- [ ] Syncs all specialists in all workspaces
- [ ] Uses config: `{ dayLookback: 30, forceRefresh: false }`
- [ ] Error handling: doesn't stop on individual failures
- [ ] Logging: tracks success/failure counts
- [ ] Metrics: updates Prometheus metrics

### Weekly Refresh

- [ ] `@Cron('0 2 * * 0')` (Sunday 2 AM UTC)
- [ ] Syncs with `dayLookback: 60, forceRefresh: true`
- [ ] Runs independently from daily sync
- [ ] Useful for reconciliation and verification

### Scheduler Registration

- [ ] Import ScheduleModule in IntegrationsModule
- [ ] Add YandexSyncScheduler to providers
- [ ] Verify cron jobs fire at expected times
- [ ] Check logs for successful execution

---

## Phase 5: Testing

### Unit Tests

File: Create `/apps/api/src/agents/integrations/yandex-sync.service.spec.ts`

- [ ] Test `syncSpecialistMetrics` basic flow
- [ ] Test missing specialist throws NotFoundException
- [ ] Test missing Yandex integration throws BadRequestException
- [ ] Test invalid dayLookback throws BadRequestException
- [ ] Test fraud detection identifies suspicious metrics
- [ ] Test currency conversion RUB → USD
- [ ] Test database transaction rollback on error
- [ ] Test rate limiting logic
- [ ] Test token refresh on expiry

Run: `npm test -- yandex-sync.service`

- [ ] All tests passing
- [ ] Coverage > 80% for critical paths
- [ ] No test timeouts

### Integration Tests

- [ ] Test with mock Yandex API responses
- [ ] Test full sync cycle: fetch → validate → persist → update profile
- [ ] Test error handling: API down, invalid response, etc.
- [ ] Test currency conversion with real exchange rates
- [ ] Test database transaction safety
- [ ] Test workspace isolation (cross-workspace queries fail)

Run: `npm test:e2e -- yandex`

- [ ] All integration tests passing
- [ ] No flaky tests

### Manual Testing

- [ ] Connect test Yandex Direct account
- [ ] Run manual sync via endpoint
- [ ] Verify metrics appear in database
- [ ] Check specialist profile updated with stats
- [ ] Verify audit logs created
- [ ] Check for any secrets in logs

### Load Testing

- [ ] Sync 10 specialists: verify completes in < 30s
- [ ] Sync 100 specialists: verify handles concurrency
- [ ] Sync with 60-day lookback: verify no timeout
- [ ] Verify database doesn't slow down under load
- [ ] Check memory usage is stable

---

## Phase 6: Audit Logging

### Audit Log Entity

File: Verify `/apps/api/src/agents/entities/agent-performance-sync-log.entity.ts`

- [ ] Entity has fields: action, actor, platform, success, metrics_inserted, metrics_updated
- [ ] Entity has workspace_id for isolation
- [ ] Entity has audit trail: created_at, details
- [ ] Entity is indexed on (workspace_id, platform, created_at)

### Logging Implementation

- [ ] Every sync call logs start event
- [ ] Every sync completion logs result event
- [ ] Every error logs error event with context
- [ ] No sensitive data logged (tokens, passwords)
- [ ] Log includes: agentProfileId, platform, success, duration, metrics counts

### Log Queries

- [ ] Can query syncs by workspace: `SELECT * FROM sync_logs WHERE workspace_id = ?`
- [ ] Can query by platform: `SELECT * FROM sync_logs WHERE platform = 'yandex'`
- [ ] Can query by date range: `SELECT * FROM sync_logs WHERE created_at BETWEEN ? AND ?`
- [ ] Can calculate success rate: `SELECT COUNT(*) FILTER (WHERE success) / COUNT(*) as rate FROM sync_logs`

---

## Phase 7: Monitoring & Observability

### Structured Logging

- [ ] All logs are JSON formatted
- [ ] Logs include context: agentProfileId, workspaceId, platform
- [ ] Error logs include stack traces
- [ ] No PII in logs (names, emails, tokens)

### Metrics

- [ ] Prometheus metrics exported on `/metrics`
- [ ] Track: `yandex_sync_total` (success/failure counts)
- [ ] Track: `yandex_sync_duration_seconds` (latency)
- [ ] Track: `yandex_fraud_score` (distribution)
- [ ] Track: `yandex_api_quota_remaining` (rate limit status)

### Alerts

- [ ] Alert if sync success rate drops below 95%
- [ ] Alert if sync duration exceeds 30s per specialist
- [ ] Alert if fraud score > 50 (manual review needed)
- [ ] Alert if API quota approaches limit (< 100 remaining)

### Health Checks

- [ ] Create `/health/yandex` endpoint
- [ ] Check Yandex API connectivity
- [ ] Check database connectivity
- [ ] Check encryption key validity
- [ ] Check config validity

---

## Phase 8: Error Handling & Resilience

### Error Messages

- [ ] All errors have clear, actionable messages
- [ ] No stack traces exposed to API clients
- [ ] Users understand what went wrong
- [ ] Support team can debug from logs

### Retry Logic

- [ ] Implement exponential backoff for transient errors
- [ ] Max 3 retries with 1s, 2s, 4s delays
- [ ] Only retry on 429, 500, 502, 503 errors
- [ ] Don't retry on 400, 401, 404 errors

### Partial Failure Handling

- [ ] If 1 campaign fails, sync other campaigns
- [ ] If 1 specialist fails, sync other specialists
- [ ] Sync result includes warnings for partial failures
- [ ] User still gets value even with some failures

### Token Expiry Handling

- [ ] Detect expired tokens (401 response)
- [ ] Attempt refresh with refresh token
- [ ] If refresh fails, notify specialist
- [ ] Gracefully degrade without crashing

---

## Phase 9: Security

### Token Encryption

- [ ] ENCRYPTION_KEY exactly 32 characters
- [ ] All tokens encrypted before storage: `encrypt(token, key)`
- [ ] All tokens decrypted at runtime: `decrypt(encrypted, key)`
- [ ] Tokens never logged or exposed
- [ ] Encryption uses AES-256-CBC

### Data Protection

- [ ] No secrets in git history: `git log --all --full-history -- '*secret*'`
- [ ] Environment variables used for all sensitive config
- [ ] Database backups encrypted
- [ ] Network traffic uses HTTPS

### Access Control

- [ ] Only authenticated users can trigger sync
- [ ] Users can only sync specialists in their workspace
- [ ] Admin checks if needed for bulk operations
- [ ] Audit log tracks who triggered sync

---

## Phase 10: Documentation

### In-Code Documentation

- [ ] Public methods have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] No TODO/FIXME in critical paths
- [ ] Type annotations on all parameters

### README.md

- [ ] Quick start guide present
- [ ] Feature overview included
- [ ] Architecture section
- [ ] Configuration section with env vars
- [ ] Troubleshooting section

### API_REFERENCE.md

- [ ] All public methods documented
- [ ] Parameter types and descriptions
- [ ] Return types documented
- [ ] Examples for each method
- [ ] Error codes explained

### INTEGRATION_GUIDE.md

- [ ] Step-by-step module integration
- [ ] REST endpoint implementation
- [ ] Cron job setup
- [ ] Audit logging integration
- [ ] Testing instructions

### IMPLEMENTATION_EXAMPLES.md

- [ ] 20+ working code examples
- [ ] Error handling patterns
- [ ] Testing patterns
- [ ] Monitoring examples
- [ ] Advanced usage recipes

### DEPLOYMENT.md

- [ ] Pre-deployment checklist
- [ ] Environment configuration
- [ ] Database migration procedure
- [ ] Monitoring setup instructions
- [ ] Disaster recovery plan
- [ ] Incident response playbooks

---

## Phase 11: Staging Deployment

### Setup

- [ ] Staging environment configured
- [ ] All env vars set in staging
- [ ] Database migrations applied in staging
- [ ] Real Yandex test account configured

### Validation

- [ ] Code deploys without errors
- [ ] Service starts successfully
- [ ] Health check endpoint responds
- [ ] Can trigger manual sync via API
- [ ] Metrics appear in database
- [ ] Audit logs created

### Testing

- [ ] Run full sync cycle with test account
- [ ] Monitor for 24+ hours without errors
- [ ] Verify no memory leaks
- [ ] Check database performance
- [ ] Load test with concurrent requests
- [ ] Test error scenarios

### Sign-Off

- [ ] QA team approves
- [ ] Security review passed
- [ ] Performance acceptable
- [ ] Ready for production

---

## Phase 12: Production Deployment

### Pre-Deployment

- [ ] Production database backup taken
- [ ] Monitoring and alerting configured
- [ ] On-call engineer assigned
- [ ] Rollback plan prepared
- [ ] Communication plan ready

### Deployment

- [ ] Deploy code changes
- [ ] Run database migrations
- [ ] Verify health checks passing
- [ ] Monitor error rates for 1 hour
- [ ] Monitor sync success rate for 4 hours

### Post-Deployment

- [ ] Confirm all specialists synced successfully
- [ ] Check fraud detection working
- [ ] Verify no data anomalies
- [ ] Review monitoring dashboard
- [ ] Gather stakeholder feedback

### 24-Hour Verification

- [ ] Zero critical errors in logs
- [ ] Sync success rate > 95%
- [ ] Average sync time < 5s per specialist
- [ ] No fraud false positives
- [ ] Database performance stable

---

## Phase 13: Optimization & Refinement

### Performance Optimization

- [ ] Profile sync performance: identify bottlenecks
- [ ] Cache campaign lists to reduce API calls
- [ ] Parallelize campaign report fetches
- [ ] Optimize database queries
- [ ] Reduce memory footprint

### Feature Enhancements

- [ ] Real-time currency rate updates (instead of config)
- [ ] Webhook support for Yandex campaign changes
- [ ] ML-based fraud detection (instead of rules)
- [ ] Multi-account support per specialist
- [ ] Custom fraud thresholds per workspace

### Documentation Updates

- [ ] Add troubleshooting entries as issues discovered
- [ ] Document all configuration options
- [ ] Create operational runbooks
- [ ] Record training videos
- [ ] Write blog post about integration

---

## Phase 14: Ongoing Maintenance

### Monthly Tasks

- [ ] Review sync success metrics
- [ ] Check fraud detection accuracy
- [ ] Verify backup completion
- [ ] Update exchange rates in CURRENCY_RATES_JSON
- [ ] Review error logs for patterns

### Quarterly Tasks

- [ ] Load test with current data volume
- [ ] Review Yandex API for changes
- [ ] Update dependencies (security patches)
- [ ] Review performance vs. baseline
- [ ] Plan optimization for next quarter

### Annual Tasks

- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Capacity planning for next year
- [ ] Review competitor integrations
- [ ] Plan major feature additions

---

## Success Criteria

✅ **Implementation Complete When:**

1. **Code Quality**
   - [ ] All tests passing (unit + integration)
   - [ ] Code coverage > 80%
   - [ ] TypeScript strict mode
   - [ ] No security vulnerabilities

2. **Functionality**
   - [ ] Syncs metrics from Yandex Direct API
   - [ ] Calculates derived metrics (ROAS, CPA, CTR)
   - [ ] Detects fraud with configurable rules
   - [ ] Handles errors gracefully
   - [ ] Supports multi-currency

3. **Reliability**
   - [ ] 99.9% uptime
   - [ ] < 0.1% data loss
   - [ ] Automatic recovery from transient errors
   - [ ] Database transaction safety

4. **Performance**
   - [ ] Sync < 5s per specialist
   - [ ] < 100 MB memory per instance
   - [ ] Handles 1000+ specialists
   - [ ] API rate limit respected

5. **Security**
   - [ ] Tokens encrypted at rest
   - [ ] No secrets in logs
   - [ ] Workspace isolation enforced
   - [ ] Audit trail complete

6. **Operations**
   - [ ] Clear monitoring and alerting
   - [ ] Runbooks for common issues
   - [ ] Disaster recovery tested
   - [ ] On-call support documented

---

## Sign-Off

- [ ] Product Manager Approval
- [ ] Engineering Lead Approval
- [ ] Security Review Approval
- [ ] QA Sign-Off
- [ ] Operations Team Ready

**Deployment Date:** _________

**Deployed By:** _________

**Notes:** _________________________________________________

