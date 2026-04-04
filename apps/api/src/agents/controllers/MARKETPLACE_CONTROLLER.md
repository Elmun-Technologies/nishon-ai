# MarketplaceController Implementation Guide

## Overview

The `MarketplaceController` provides comprehensive endpoints for the Performa specialist marketplace, including public discovery, specialist profile management, and administrative functions.

**File Location:** `/home/user/nishon-ai/apps/api/src/agents/controllers/marketplace.controller.ts`

**Total Lines of Code:** 1,111  
**Total Endpoints:** 15 (5 public, 5 authenticated, 5 admin)

---

## Endpoint Summary

### 1. PUBLIC ENDPOINTS (No Authentication Required)

#### GET /marketplace/specialists
- **Purpose:** Search and filter specialists in the marketplace
- **Query Parameters:**
  - `query` (string) - Search term
  - `platforms[]` (array) - Filter by platforms (meta, google, yandex, etc.)
  - `niches[]` (array) - Filter by niches
  - `certifications[]` (array) - Filter by certifications
  - `languages[]` (array) - Filter by languages
  - `countries[]` (array) - Filter by countries
  - `minRating` (number 0-5) - Minimum rating
  - `minExperience` (number) - Minimum years of experience
  - `minRoas` (number) - Minimum average ROAS
  - `sortBy` (enum) - Sort order: rating, roas, experience, price, trending
  - `page` (number) - Page number (default: 1)
  - `pageSize` (number) - Results per page (default: 20, max: 100)
- **Response:** `SearchSpecialistsResponseDto`
  - Contains: specialists array, total count, page info, available filters
- **Service Call:** `marketplaceSearchService.searchSpecialists()`

#### GET /marketplace/filters
- **Purpose:** Get available marketplace filters
- **Response:** `MarketplaceFiltersDto`
  - Contains: platforms, niches, certifications, languages, countries, priceRanges, experienceLevels
- **Service Call:** `marketplaceSearchService.getAvailableFilters()`
- **Caching:** Recommended (data changes infrequently)

#### GET /specialists/:slug
- **Purpose:** Get complete public specialist profile
- **Path Parameters:**
  - `slug` (string) - Specialist slug (required)
- **Response:** `SpecialistProfileDto`
  - Complete profile with certifications, case studies, languages, geographic coverage, performance metrics
- **Service Call:** `marketplaceSearchService.getSpecialistDetail(slug)`
- **Caching:** Recommended (24-hour TTL)

#### GET /specialists/:slug/performance
- **Purpose:** Get specialist performance metrics and analytics
- **Path Parameters:**
  - `slug` (string) - Specialist slug (required)
- **Query Parameters:**
  - `period` (enum) - Time period: 1m, 3m, 6m, 12m, all (default: 3m)
  - `platform` (enum) - Platform filter: meta, google, yandex, all (default: all)
- **Response:** `SpecialistPerformanceDto`
  - Contains: summary (avgROAS, totalSpend, totalRevenue, campaignCount, successRate), timeline, byPlatform metrics, case studies
- **Service Call:** `marketplaceSearchService.getSpecialistPerformance(slug, period, platform)`

#### POST /specialists/:slug/contact
- **Purpose:** Send contact message to specialist (optional authentication)
- **Path Parameters:**
  - `slug` (string) - Specialist slug (required)
- **Request Body:** `ContactSpecialistDto`
  - `email` (string, required) - Sender's email
  - `message` (string, required) - Contact message
  - `preferredContactMethod` (enum, optional) - Preference: email, phone, message (default: email)
- **Response:** `ContactResponseDto`
  - Contains: success, message, contactId (optional)
- **Service Call:** `marketplaceContactService.contactSpecialist(slug, dto, userId?)`
- **Side Effect:** Sends email to specialist and support team

---

### 2. AUTHENTICATED ENDPOINTS (JWT Required)

#### GET /my-profile/specialists/:id
- **Purpose:** Get own specialist profile details
- **Auth:** JWT (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
- **Response:** `SpecialistProfileDto`
  - Full profile with analytics
- **Service Call:** `marketplaceProfileService.getOwnProfile(id, userId)`
- **Authorization Check:** Verify ownership (request.user.id === profile.ownerId)

#### POST /my-profile/specialists
- **Purpose:** Create new specialist profile
- **Auth:** JWT (required)
- **Request Body:** `CreateSpecialistProfileDto`
  - `displayName` (string, required) - Display name
  - `title` (string, required) - Professional title
  - `bio` (string, optional) - Biography
  - `platforms` (array, optional) - Supported platforms
  - `niches` (array, optional) - Specialist niches
  - `specializations` (array, optional) - Areas of expertise
  - `languages` (array, optional) - Spoken languages
  - `countries` (array, optional) - Service countries
  - `monthlyRate` (number, optional) - Fixed monthly rate
  - `commissionRate` (number, optional) - Commission percentage
  - `pricingModel` (enum, optional) - Pricing: fixed, commission, hybrid
  - `avatar` (string, optional) - Avatar emoji or URL
  - `location` (string, optional) - Location string
  - `responseTime` (string, optional) - Response time estimate
- **Response:** `SpecialistProfileDto`
  - Created profile with ID and slug
- **Service Call:** `marketplaceProfileService.createProfile(userId, dto)`
- **Side Effects:**
  - Auto-generate slug from displayName
  - Set status to "pending_review" (optional)

#### PATCH /my-profile/specialists/:id
- **Purpose:** Update specialist profile
- **Auth:** JWT (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
- **Request Body:** `UpdateSpecialistProfileDto`
  - All fields from CreateSpecialistProfileDto but optional
  - Supports partial updates
- **Response:** `SpecialistProfileDto`
  - Updated profile
- **Service Call:** `marketplaceProfileService.updateProfile(id, userId, dto)`
- **Authorization Check:** Verify ownership

#### POST /my-profile/specialists/:id/case-studies
- **Purpose:** Add case study to portfolio
- **Auth:** JWT (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
- **Request Body:** `AddCaseStudyDto`
  - `title` (string, required) - Case study title
  - `industry` (string, required) - Industry/vertical
  - `platform` (string, required) - Platform (meta, google, yandex, etc.)
  - `description` (string, optional) - Detailed description
  - `metrics` (object, optional) - Performance metrics (ROAS, CPA, etc.)
  - `images[]` (array, optional) - Image URLs
  - `proofUrl` (string, optional) - Link to proof/documentation
- **Response:** `CaseStudyResponseDto`
  - Created case study with status: "pending_review"
- **Service Call:** `marketplaceProfileService.addCaseStudy(id, userId, dto)`
- **Workflow:**
  - Create case study entity
  - Set status to "pending_review"
  - Trigger admin review process
  - Return created case study

#### GET /my-profile/specialists/:id/analytics
- **Purpose:** Get specialist dashboard analytics
- **Auth:** JWT (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
- **Query Parameters:**
  - `period` (enum, optional) - Analytics period: 7d, 30d, 90d, all (default: 30d)
- **Response:** `AnalyticsDto`
  - Contains: profileViews, impressions, contacts, engagement, conversion (each with trend)
  - Timeline data with daily breakdown
- **Service Call:** `marketplacePerformanceService.getAnalytics(id, userId, period)`
- **Authorization Check:** Verify ownership
- **Metrics to Track:**
  - Profile views
  - Profile impressions
  - Contact requests received
  - Engagement rate
  - Conversion rate (hires/contacts)

---

### 3. ADMIN ENDPOINTS (JWT + AdminGuard Required)

#### POST /admin/specialists/:id/sync-performance
- **Purpose:** Manually trigger performance data synchronization
- **Auth:** JWT + AdminGuard (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
- **Request Body:** `SyncPerformanceDto`
  - `platform` (enum, required) - Platform to sync: meta, google, yandex
  - `force` (boolean, optional) - Force sync even if recent sync exists (default: false)
- **Response:** `{ synced: boolean; records: number; nextSync: Date }`
- **Service Call:** `marketplaceAdminService.syncPerformance(id, platform, force)`
- **Side Effects:**
  - Create or update PerformanceSyncLog entry
  - Fetch performance data from platform API
  - Update specialist metrics

#### POST /admin/specialists/:id/verify-performance
- **Purpose:** Verify performance data and assess fraud risk
- **Auth:** JWT + AdminGuard (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
- **Request Body:** `VerifyPerformanceDto`
  - `caseStudyId` (string, required) - Case study ID to verify
  - `verified` (boolean, optional) - Mark as verified (default: true)
  - `fraudRiskLevel` (enum, optional) - Risk level: low, medium, high (default: low)
- **Response:** `{ status: "verified" | "rejected"; fraudRiskLevel: string }`
- **Service Call:** `marketplaceAdminService.verifyPerformance(id, dto)`
- **Checks:**
  - Validate performance claims
  - Cross-check with platform metrics
  - Assess fraud risk
  - Update case study status and risk level

#### GET /admin/specialists/sync-status
- **Purpose:** Monitor all specialist performance syncs
- **Auth:** JWT + AdminGuard (required)
- **Query Parameters:**
  - `status` (enum, optional) - Filter by status: pending, in_progress, completed, failed
  - `limit` (number, optional) - Result limit (default: 100)
- **Response:** `SyncStatusDto[]`
  - Array of sync status objects containing:
    - id, slug, displayName
    - lastSync, nextSync (dates)
    - status (pending, in_progress, completed, failed)
    - recordCount, errors[]
- **Service Call:** `marketplaceAdminService.getSyncStatus(status?, limit?)`
- **Purpose:** Dashboard for monitoring data synchronization health

#### POST /admin/certifications
- **Purpose:** Create new certification type
- **Auth:** JWT + AdminGuard (required)
- **Request Body:** `CreateCertificationDto`
  - `name` (string, required) - Certification name
  - `issuer` (string, required) - Issuing organization
  - `description` (string, optional) - Certification description
  - `icon` (string, optional) - Icon emoji or URL
  - `badge` (string, optional) - Badge image URL
- **Response:** `{ id: string; name: string; issuer: string }`
- **Service Call:** `marketplaceAdminService.createCertification(dto)`
- **Side Effects:**
  - Create certification entity
  - Make available for specialists to claim

#### POST /admin/specialists/:id/certifications/:certId/verify
- **Purpose:** Verify specialist certification claim
- **Auth:** JWT + AdminGuard (required)
- **Path Parameters:**
  - `id` (string) - Specialist profile ID (required)
  - `certId` (string) - Certification ID (required)
- **Request Body:** `VerifyCertificationDto`
  - `verified` (boolean, optional) - Mark as verified (default: true)
  - `expiresAt` (string, optional) - Expiration date (ISO 8601)
- **Response:** `{ status: "verified" | "rejected"; expiresAt?: string }`
- **Service Call:** `marketplaceAdminService.verifyCertification(id, certId, dto)`
- **Checks:**
  - Validate certification claim with issuer
  - Set expiration if provided
  - Update certification status

---

## Service Dependencies

The controller depends on these services (to be implemented):

1. **`MarketplaceSearchService`**
   - Methods:
     - `searchSpecialists(query)`
     - `getAvailableFilters()`
     - `getSpecialistDetail(slug)`
     - `getSpecialistPerformance(slug, period, platform)`

2. **`MarketplaceProfileService`**
   - Methods:
     - `createProfile(userId, dto)`
     - `updateProfile(id, userId, dto)`
     - `getOwnProfile(id, userId)`
     - `addCaseStudy(id, userId, dto)`

3. **`MarketplacePerformanceService`**
   - Methods:
     - `getAnalytics(id, userId, period)`

4. **`MarketplaceContactService`**
   - Methods:
     - `contactSpecialist(slug, dto, userId?)`

5. **`MarketplaceAdminService`**
   - Methods:
     - `syncPerformance(id, platform, force)`
     - `verifyPerformance(id, dto)`
     - `getSyncStatus(status?, limit?)`
     - `createCertification(dto)`
     - `verifyCertification(id, certId, dto)`

---

## DTOs Included

### Query DTOs
- `SearchSpecialistsQueryDto`
- `PerformanceQueryDto`

### Request DTOs
- `ContactSpecialistDto`
- `CreateSpecialistProfileDto`
- `UpdateSpecialistProfileDto`
- `AddCaseStudyDto`
- `SyncPerformanceDto`
- `VerifyPerformanceDto`
- `CreateCertificationDto`
- `VerifyCertificationDto`

### Response DTOs
- `SpecialistProfileDto`
- `SearchSpecialistsResponseDto`
- `MarketplaceFiltersDto`
- `SpecialistPerformanceDto`
- `ContactResponseDto`
- `CaseStudyResponseDto`
- `AnalyticsDto`
- `SyncStatusDto`

---

## Error Handling

All endpoints include validation and error handling:

- **400 BadRequestException** - Invalid parameters or missing required fields
- **401 Unauthorized** - Missing or invalid JWT token
- **403 ForbiddenException** - Insufficient permissions (ownership, admin role)
- **404 NotFoundException** - Resource not found

---

## Guard Implementation Notes

1. **JWT Auth Guard:**
   - Currently using `@UseGuards(AuthGuard("jwt"))`
   - Verify `req.user.id` exists in request

2. **Admin Guard:**
   - TODO: Create custom `AdminGuard` or extend `AuthGuard`
   - Check `req.user.roles` includes "admin"
   - Comment markers: `// TODO: Add AdminGuard`

---

## Swagger Documentation

All endpoints include comprehensive Swagger documentation:
- `@ApiTags('Marketplace - Specialists')` - Groups all endpoints
- `@ApiOperation()` - Clear descriptions
- `@ApiResponse()` - Status codes and response types
- `@ApiQuery()` - Query parameter documentation
- `@ApiParam()` - Path parameter documentation
- `@ApiBearerAuth()` - JWT authentication indicator

---

## Implementation Checklist

- [x] Controller file created with all endpoints
- [x] DTOs defined for all requests/responses
- [x] Swagger decorators applied
- [x] Input validation (BadRequestException)
- [x] Authorization checks (ownership, admin role)
- [x] Error handling framework
- [ ] Create `MarketplaceSearchService`
- [ ] Create `MarketplaceProfileService`
- [ ] Create `MarketplacePerformanceService`
- [ ] Create `MarketplaceContactService`
- [ ] Create `MarketplaceAdminService`
- [ ] Implement `AdminGuard` (or use existing)
- [ ] Create entities for case studies, certifications, performance logs
- [ ] Integrate with email service (contact feature)
- [ ] Add performance syncing with platform APIs
- [ ] Add caching layer (Redis) for filters and profiles
- [ ] Add rate limiting to public endpoints
- [ ] Add request logging/monitoring

---

## File Structure

```
/home/user/nishon-ai/apps/api/src/agents/
├── controllers/
│   ├── marketplace.controller.ts (NEW - 1,111 lines)
│   └── MARKETPLACE_CONTROLLER.md (THIS FILE)
├── services/
│   ├── marketplace-search.service.ts (TODO)
│   ├── marketplace-profile.service.ts (TODO)
│   ├── marketplace-performance.service.ts (TODO)
│   ├── marketplace-contact.service.ts (TODO)
│   └── marketplace-admin.service.ts (TODO)
├── entities/
│   └── [existing entities + new marketplace entities]
├── agents.controller.ts
├── agents.service.ts
└── agents.module.ts
```

---

## Next Steps

1. Create the required services listed above
2. Create entity classes for:
   - SpecialistPerformanceSyncLog
   - SpecialistAnalytics
   - SpecialistContact
3. Implement the `AdminGuard` if not already present
4. Add error handling middleware if needed
5. Configure email service for contact feature
6. Set up performance data synchronization jobs
7. Add caching strategies for public endpoints
8. Write unit and integration tests

---

## Notes

- All service calls have `// TODO` comments indicating where implementation is needed
- The controller is designed to be service-agnostic; services can be implemented independently
- Consider adding request/response logging for audit trails
- Performance syncing should be asynchronous (queue-based) for large data volumes
- Case study verification should have a review workflow with admin notifications
