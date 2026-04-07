# 🚀 CRITICAL IMPLEMENTATION PLAN - TEAM DEVELOPMENT

## Current Status
- ✅ Entities & Database: Complete (49 tables)
- ✅ Backend scaffolding: Complete  
- ✅ Frontend UI: Complete
- 🔴 **CRITICAL**: APIs, Real integrations, Tests - BLOCKING DEPLOYMENT

**Total Effort: 160-260 hours (4-6 weeks with 4-5 developers)**

---

## 👥 TEAM ALLOCATION (Parallel Development)

### **TEAM A: Marketplace Services** (40-60 hours)
**Developer: TBD**
**Files**: `/apps/api/src/agents/services/marketplace-*.service.ts`
**Status**: NOT STARTED (26 TODOs in controller)

**Tasks**:
1. **MarketplaceSearchService** (10 hours)
   - Implement `searchSpecialists(query)` - Filter by skills, rating, price
   - Implement `getAvailableFilters()` - Return filterable fields
   - Add Elasticsearch/database queries for search
   - Index: specialists by tier, rating, specialties

2. **MarketplaceProfileService** (12 hours)
   - `getOwnProfile()` - Fetch specialist profile + stats
   - `createProfile()` - Create specialist marketplace profile
   - `updateProfile()` - Update bio, rates, certifications
   - `addCaseStudy()` - Add portfolio/case study

3. **MarketplacePerformanceService** (10 hours)
   - `getAnalytics(id, period)` - Specialist performance metrics
   - ROAS, conversion rate, deal count, total revenue
   - Historical trends by month/quarter

4. **MarketplaceContactService** (8 hours)
   - `contactSpecialist(slug, dto)` - Send inquiry/request
   - Store in database, send email notification
   - Track contact history

5. **MarketplaceAdminService** (8 hours)
   - `createCertification(dto)` - Admin create cert
   - `verifyCertification(id, certId, dto)` - Verify specialist

6. **Connect Controller Endpoints** (8 hours)
   - Replace 8 TODOs with service calls
   - Add proper response DTOs
   - Error handling & validation

**Deliverable**: All 8 marketplace endpoints fully functional
**Testing**: E2E tests for search, profile, analytics

---

### **TEAM B: Platform API Integrations** (30-50 hours)
**Developer: TBD**
**Files**: 
- `/apps/api/src/integrations/services/platform-audience.service.ts`
- `/apps/api/src/integrations/services/performance-sync.service.ts`
- `/apps/api/src/meta/` (existing Meta service)

**Status**: PARTIALLY DONE (Meta scaffolding exists, Google/TikTok/Yandex mocked)

### **SUBTASK B1: Meta Audience Sync** (12 hours)
- ✅ Files exist: `/apps/api/src/meta/services/`
- [ ] Connect Meta Conversion API for audience upload
- [ ] Implement hashed PII handling (SHA256)
- [ ] Add webhook listeners for audience sync status
- [ ] Test with Meta sandbox

**Implementation**:
```typescript
// Replace mock in platform-audience.service.ts
private async addMetaMembers(
  audienceId: string,
  members: SyncMember[],
  connectionId: string
): Promise<{ added: number; failed: number }> {
  const connection = await this.integrationConnectionRepository.findOne({ where: { id: connectionId } })
  const accessToken = await this.decryptToken(connection.encryptedAccessToken)
  
  // Use Meta Graph API
  // POST https://graph.instagram.com/v18.0/{ad_account_id}/audiences/{audience_id}/users
  // With hashed phone/email
}
```

### **SUBTASK B2: Google Customer Match** (12 hours)
- [ ] Setup Google Ads API client
- [ ] Implement Customer Match audience upload
- [ ] Handle email, phone, MAID (Mobile Advertising ID)
- [ ] Test with Google sandbox

### **SUBTASK B3: TikTok Ads API** (10 hours)
- [ ] Implement TikTok Ads API client
- [ ] Custom audience creation
- [ ] User sync endpoints

### **SUBTASK B4: Yandex API** (8 hours)
- [ ] Yandex Audience API integration
- [ ] User upload protocol

### **SUBTASK B5: Performance Sync** (8-10 hours)
- Replace TODOs in `performance-sync.service.ts`:
  - Meta: Implement `fetchMetaMetrics()`
  - Google: Implement `fetchGoogleMetrics()`
  - Yandex: Implement `fetchYandexMetrics()`
- Daily scheduled sync using Bull queue
- Error handling & retry logic

**Deliverable**: All 4 platforms syncing audiences + performance data
**Testing**: Integration tests with each platform API

---

### **TEAM C: Creative Generation APIs** (20-40 hours)
**Developer: TBD**
**Files**: `/apps/api/src/creatives/services/creative.service.ts`
**Status**: All mocked, no real generation

### **SUBTASK C1: Stability AI (Images)** (10 hours)
```typescript
// Replace mock in creative.service.ts
async generateImageCreative(dto: CreateImageCreativeDto) {
  const client = new Stability.Client({
    apiKey: this.configService.get('STABILITY_API_KEY'),
  })
  
  const response = await client.textToImage({
    prompt: dto.prompt,
    style: dto.style,
    aspectRatio: dto.aspectRatio,
  })
  
  return { url: response.imageUrl, metadata: {...} }
}
```

### **SUBTASK C2: HeyGen (Videos)** (12 hours)
- API key setup
- Video generation with avatar
- Script-to-speech integration
- Background customization

### **SUBTASK C3: DALL-E 3 (Text-to-Image)** (8 hours)
- OpenAI API integration (already imported)
- Style presets mapping
- Quality levels (Standard/High/Ultra)

### **SUBTASK C4: UGC Template Rendering** (8 hours)
- Implement actual UGC video generation
- Or integrate with UGC generator service
- Script personalization

**Deliverable**: All creative generation types produce real outputs
**Testing**: Unit tests, manual testing with generated assets

---

### **TEAM D: Testing & Performance** (50-80 hours)
**Developer: TBD**
**Current**: 11 test files, 20% coverage

### **SUBTASK D1: E2E Tests** (30 hours)
- Critical user flows:
  - User registration & workspace creation
  - Connection setup (Meta, Google, AmoCRM)
  - Audience creation & sync
  - Commission calculation
  - Creative generation
  - Marketplace search & specialist booking

**Tools**: Jest + Supertest (already setup)
**Coverage Goal**: 80%

### **SUBTASK D2: Performance Optimization** (20 hours)
- Redis caching for marketplace queries
- Database query optimization
- N+1 query fixes
- Pagination implementation
- Load testing (target: 1000 concurrent users)

**Files to optimize**:
- `audience-segment.service.ts`
- `commission-calculation.service.ts`
- Marketplace search queries

### **SUBTASK D3: Security Audit** (15 hours)
- Penetration testing
- API key rotation testing
- XSS/SQL injection testing
- Rate limiting verification

**Deliverable**: 80% test coverage, performance benchmarks passed, security audit passed

---

## 🎯 PRIORITY ORDER (Do This First)

### **WEEK 1**:
1. **TEAM A** - Marketplace search (easiest, unblocks marketplace feature)
2. **TEAM B** - Meta audience sync (highest impact, most users)
3. **TEAM C** - Stability AI (most used creative type)

### **WEEK 2-3**:
4. **TEAM B** - Google + TikTok APIs
5. **TEAM C** - HeyGen + DALL-E
6. **TEAM D** - Critical E2E tests

### **WEEK 4+**:
7. **TEAM B** - Performance sync completion
8. **TEAM D** - Full test coverage + optimization

---

## 📋 GIT WORKFLOW FOR TEAM

### Branch Naming:
```
feature/marketplace-services
feature/meta-audience-sync
feature/creative-generation
feature/e2e-tests
```

### Daily Standup Checklist:
- [ ] What did I complete yesterday?
- [ ] What's blocking me?
- [ ] What's my plan for today?
- [ ] Any merge conflicts?

### Code Review Process:
1. Create PR from feature branch
2. Assign to team lead
3. Request review before merge
4. No direct push to main

### Testing Before Merge:
```bash
# Backend
pnpm --filter api test
pnpm --filter api lint
pnpm build  # Full build check

# Frontend
pnpm --filter web build
pnpm --filter web lint
```

---

## 📦 ENVIRONMENT VARIABLES NEEDED

**Backend (.env)**:
```
# Platform APIs
STABILITY_API_KEY=sk_...
HEYGEN_API_KEY=...
OPENAI_API_KEY=sk_...

# Existing
AMOCRM_CLIENT_ID=...
AMOCRM_CLIENT_SECRET=...

# Meta
META_APP_ID=...
META_APP_SECRET=...

# Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# TikTok
TIKTOK_ACCESS_TOKEN=...

# Yandex
YANDEX_ACCESS_TOKEN=...

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://...
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before merging to main:
- [ ] All CRITICAL tasks completed
- [ ] 80% test coverage
- [ ] Security audit passed
- [ ] Performance tested (1000 concurrent users)
- [ ] All real APIs connected and tested
- [ ] No mock data in production
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Rate limiting configured
- [ ] Monitoring/logging setup

---

## 💬 COMMUNICATION

**Daily**: Team standup (15 min)
**Weekly**: Progress review + blockers discussion
**Issues**: Use GitHub issues + Slack notifications

---

**Total Timeline**: 4-6 weeks with 4 developers
**Risk**: API integration delays (have backup mock data)
**Success Criteria**: Full deployment to production by end of timeline

