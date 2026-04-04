# CertificationService - Deployment Checklist

Complete this checklist to deploy the CertificationService to production.

## Pre-Deployment

### Code Review
- [ ] Review `certification.service.ts` for business logic
- [ ] Review `certification.controller.ts` for endpoints
- [ ] Review error handling and validation
- [ ] Check database schema and indexes
- [ ] Verify type definitions and DTOs

### Testing
- [ ] Run unit tests: `npm run test -- certification.service.spec.ts`
- [ ] Check test coverage: `npm run test:cov -- certification.service.spec.ts`
- [ ] Verify all test cases pass
- [ ] Review integration examples in `certification.integration.ts`
- [ ] Manual endpoint testing with Postman/curl

### Documentation
- [ ] Read `CERTIFICATION_SERVICE.md` (complete API docs)
- [ ] Review `CERTIFICATION_QUICK_START.md` (setup guide)
- [ ] Check `SERVICES_GUIDE.md` (integration patterns)
- [ ] Understand database schema and migrations

## Deployment Steps

### 1. Database Setup
- [ ] Create `marketplace_certifications` table
- [ ] Create `agent_certifications` table
- [ ] Update `agent_profiles` with new columns
- [ ] Create recommended indexes
- [ ] Run migrations: `npm run migration:run`
- [ ] Verify tables and indexes created

```bash
# Verify tables exist
\dt marketplace_certifications agent_certifications
\di idx_agent_certs_*
```

### 2. Application Setup
- [ ] Verify `agents.module.ts` imports CertificationService
- [ ] Verify `CertificationController` is registered
- [ ] Verify entities are in `TypeOrmModule.forFeature()`
- [ ] Check `services/index.ts` exports

### 3. Initialization
- [ ] Add startup hook to initialize default certifications
- [ ] Verify 5 certifications are created on first run
- [ ] Check database for created certifications

```typescript
await certService.initializeDefaultCertifications();
```

### 4. Environment Configuration
- [ ] Configure database connection string
- [ ] Verify database credentials
- [ ] Set up logging levels
- [ ] Configure CDN URLs for certification icons

### 5. API Testing
- [ ] Test GET /certifications (should return 5 certs)
- [ ] Test GET /certifications/:certId
- [ ] Test GET /agents/:agentId/certifications
- [ ] Test POST /certifications/:certId/agents/:agentId
- [ ] Test PATCH /agents/:agentId/certifications/:certId/verify
- [ ] Test DELETE /agents/:agentId/certifications/:certId
- [ ] Test GET /certifications/admin/pending
- [ ] Test search endpoints

### 6. Authorization Setup (Optional)
- [ ] Implement auth guards for admin endpoints
- [ ] Configure role-based access control
- [ ] Test admin-only endpoints with and without auth
- [ ] Verify agent can only modify own certifications

### 7. Notifications Setup (Optional)
- [ ] Implement email notification service
- [ ] Set up notification templates
- [ ] Test notifications trigger on cert events
- [ ] Verify admin gets notified of pending certs

### 8. Scheduled Tasks (Optional)
- [ ] Set up daily cleanup task at 2 AM UTC
- [ ] Configure scheduled certification sync
- [ ] Test cleanup runs successfully
- [ ] Verify expired certs are processed

## Monitoring & Validation

### Database Validation
- [ ] Run query: `SELECT COUNT(*) FROM marketplace_certifications;`
  Expected: 5 (initial certifications)
- [ ] Run query: `SELECT COUNT(*) FROM agent_certifications;`
  Expected: 0 initially
- [ ] Check indexes: `\di idx_agent_certs_*`
  Expected: 2 indexes present

### Application Logs
- [ ] Check startup logs for initialization success
- [ ] Verify no error messages in application
- [ ] Monitor error rate on endpoints
- [ ] Check performance metrics

### API Health
- [ ] Test each endpoint in production
- [ ] Verify response times are acceptable
- [ ] Check error handling works correctly
- [ ] Verify pagination works with large datasets

### Data Integrity
- [ ] Verify certifications appear on agent profiles
- [ ] Check certification levels update correctly
- [ ] Verify audit trails are created
- [ ] Confirm expiration dates are tracked

## Post-Deployment

### Monitoring Setup
- [ ] Set up alerts for errors in certification endpoints
- [ ] Monitor certification verification rate
- [ ] Track certification adoption metrics
- [ ] Set up dashboard with key metrics

### Documentation
- [ ] Update API documentation
- [ ] Document any configuration changes
- [ ] Create runbooks for common tasks
- [ ] Document troubleshooting steps

### Team Communication
- [ ] Notify team of deployment
- [ ] Share API documentation
- [ ] Provide quick start guide
- [ ] Schedule training if needed

## Verification Checklist

After deployment, verify everything works:

```bash
# 1. Test application startup
npm run start

# 2. Test GET certifications
curl http://localhost:3000/certifications

# 3. Check database
psql -c "SELECT COUNT(*) FROM marketplace_certifications;"

# 4. Check logs for errors
tail -f logs/app.log | grep -i error

# 5. Test add certification (requires auth)
curl -X POST http://localhost:3000/certifications/{certId}/agents/{agentId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"proofUrl": "https://example.com/cert.png"}'

# 6. Test admin endpoints
curl http://localhost:3000/certifications/admin/pending \
  -H "Authorization: Bearer {admin_token}"
```

## Rollback Plan

If issues occur, follow this rollback plan:

### Immediate Actions
1. Disable CertificationController endpoints
2. Stop initializing certifications
3. Disable scheduled tasks
4. Monitor error logs

### Database Rollback
```sql
-- Drop certification tables
DROP TABLE IF EXISTS agent_certifications;
DROP TABLE IF EXISTS marketplace_certifications;

-- Remove columns from agent_profiles
ALTER TABLE agent_profiles 
DROP COLUMN IF EXISTS certification_level,
DROP COLUMN IF EXISTS verification_level_updated_at,
DROP COLUMN IF EXISTS verified_by_admin;
```

### Code Rollback
```bash
# Revert to previous version
git revert {commit_hash}
npm run build
npm run start
```

## Sign-Off

- [ ] Code review approved: _________________ (Name/Date)
- [ ] Testing completed: _________________ (Name/Date)
- [ ] Database setup verified: _________________ (Name/Date)
- [ ] Endpoints tested: _________________ (Name/Date)
- [ ] Monitoring configured: _________________ (Name/Date)
- [ ] Documentation updated: _________________ (Name/Date)
- [ ] Team notified: _________________ (Name/Date)
- [ ] Production deployment approved: _________________ (Name/Date)

## Post-Deployment Validation

### Day 1
- [ ] No errors in logs
- [ ] All endpoints responding normally
- [ ] Database health check passes
- [ ] Certifications visible on agent profiles
- [ ] Admin can verify certifications

### Week 1
- [ ] No performance degradation
- [ ] Agents using certification feature
- [ ] No data integrity issues
- [ ] Expiration cleanup working
- [ ] Notifications being sent correctly

### Month 1
- [ ] Certification adoption metrics tracked
- [ ] User feedback collected
- [ ] No outstanding issues
- [ ] Performance stable
- [ ] All integrations working

## Support Contacts

For deployment issues:
1. Database: [Team lead name/email]
2. Backend: [Backend team contact]
3. DevOps: [DevOps contact]
4. Security: [Security team contact]

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Approved By**: _______________

## Notes

Use this section for any additional notes or issues discovered during deployment:

___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________

