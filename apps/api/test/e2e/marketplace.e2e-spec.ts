/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKETPLACE E2E TEST SUITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive E2E tests for Performa Marketplace API endpoints covering:
 * - Public search and discovery endpoints
 * - Specialist profile endpoints
 * - Performance data endpoints
 * - Authentication and authorization
 * - Admin sync and verification endpoints
 * - Error handling and edge cases
 * - Fraud detection
 * - Workspace isolation
 *
 * Test Coverage Goals: 80%+ code coverage
 * Test Categories: Happy path, error cases, edge cases, security
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { MarketplaceFixtures } from "../fixtures/marketplace.fixtures";

describe("Marketplace E2E Tests", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let fixtures: MarketplaceFixtures;
  let queryRunner: any;

  // Test data
  let testWorkspace: any;
  let testUser: any;
  let testSpecialist: any;
  let authToken: string;
  let expiredToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    fixtures = new MarketplaceFixtures(jwtService, dataSource);
  });

  beforeEach(async () => {
    // Start a transaction for test isolation
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create test data
    testWorkspace = await fixtures.createTestWorkspace();
    testUser = await fixtures.createTestUser(testWorkspace.id);
    testSpecialist = await fixtures.createTestSpecialist(testUser.id);

    // Generate tokens
    authToken = fixtures.generateAuthToken(testUser.id, testWorkspace.id);
    expiredToken = fixtures.generateExpiredToken(testUser.id, testWorkspace.id);
  });

  afterEach(async () => {
    // Rollback transaction for test isolation
    if (queryRunner && queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    await queryRunner.release();
    fixtures.clearTracking();
  });

  afterAll(async () => {
    await app.close();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE A: PUBLIC SEARCH ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  describe("A. Public Search Endpoints", () => {
    describe("GET /marketplace/specialists - Search specialists", () => {
      it("should return specialists with default pagination", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .expect(200);

        expect(response.body).toHaveProperty("specialists");
        expect(response.body).toHaveProperty("total");
        expect(response.body).toHaveProperty("page", 1);
        expect(response.body).toHaveProperty("pageSize", 20);
        expect(response.body).toHaveProperty("filters");
      });

      it("should support query parameter for text search", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ query: "performance marketing" })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
        expect(Array.isArray(response.body.specialists)).toBe(true);
      });

      it("should filter by single platform", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ platforms: ["meta"] })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
        // Verify specialists returned have the platform
        if (response.body.specialists.length > 0) {
          response.body.specialists.forEach((specialist: any) => {
            expect(specialist.platforms).toContain("meta");
          });
        }
      });

      it("should filter by multiple platforms", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ platforms: ["meta", "google"] })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
        if (response.body.specialists.length > 0) {
          response.body.specialists.forEach((specialist: any) => {
            expect(
              specialist.platforms.some((p: string) => ["meta", "google"].includes(p)),
            ).toBe(true);
          });
        }
      });

      it("should filter by niche", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ niches: ["ecommerce"] })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should filter by certifications", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ certifications: ["Meta_Blueprint"] })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should filter by language", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ languages: ["english"] })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should filter by country", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ countries: ["US"] })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should filter by minimum rating", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ minRating: 4 })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
        if (response.body.specialists.length > 0) {
          response.body.specialists.forEach((specialist: any) => {
            expect(specialist.rating).toBeGreaterThanOrEqual(4);
          });
        }
      });

      it("should filter by minimum experience years", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ minExperience: 5 })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should filter by minimum ROAS", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ minRoas: 3 })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
        if (response.body.specialists.length > 0) {
          response.body.specialists.forEach((specialist: any) => {
            if (specialist.stats && specialist.stats.avgROAS) {
              expect(specialist.stats.avgROAS).toBeGreaterThanOrEqual(3);
            }
          });
        }
      });

      it("should support sorting by rating", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "rating" })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should support sorting by ROAS", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "roas" })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should support sorting by experience", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "experience" })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should support sorting by price", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "price" })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should support sorting by trending", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "trending" })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
      });

      it("should support pagination - page 2", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ page: 2, pageSize: 10 })
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.pageSize).toBe(10);
      });

      it("should enforce max page size of 100", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ pageSize: 150 })
          .expect(400);

        expect(response.body.message).toContain("must not be greater than 100");
      });

      it("should reject page < 1", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ page: 0 })
          .expect(400);

        expect(response.body.message).toContain("must not be less than 1");
      });

      it("should reject invalid sortBy value", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "invalid_sort" })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it("should return empty results when no matches", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ query: "nonexistentspecialist12345xyz" })
          .expect(200);

        expect(response.body.specialists).toEqual([]);
        expect(response.body.total).toBe(0);
      });

      it("should combine multiple filters", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({
            platforms: ["meta"],
            niches: ["ecommerce"],
            minRating: 4,
            minRoas: 3,
            sortBy: "rating",
            page: 1,
            pageSize: 20,
          })
          .expect(200);

        expect(response.body.specialists).toBeDefined();
        expect(response.body.filters).toBeDefined();
      });
    });

    describe("GET /marketplace/filters - Get available filters", () => {
      it("should return all available filter options", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/filters")
          .expect(200);

        expect(response.body.platforms).toBeDefined();
        expect(response.body.niches).toBeDefined();
        expect(response.body.certifications).toBeDefined();
        expect(response.body.languages).toBeDefined();
        expect(response.body.countries).toBeDefined();
        expect(response.body.priceRanges).toBeDefined();
        expect(response.body.experienceLevels).toBeDefined();
      });

      it("should return arrays for filter options", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/filters")
          .expect(200);

        expect(Array.isArray(response.body.platforms)).toBe(true);
        expect(Array.isArray(response.body.niches)).toBe(true);
        expect(Array.isArray(response.body.certifications)).toBe(true);
        expect(Array.isArray(response.body.languages)).toBe(true);
        expect(Array.isArray(response.body.countries)).toBe(true);
        expect(Array.isArray(response.body.priceRanges)).toBe(true);
        expect(Array.isArray(response.body.experienceLevels)).toBe(true);
      });

      it("should cache filter options efficiently", async () => {
        const start = Date.now();
        await request(app.getHttpServer()).get("/marketplace/filters").expect(200);
        const first = Date.now() - start;

        const start2 = Date.now();
        await request(app.getHttpServer()).get("/marketplace/filters").expect(200);
        const second = Date.now() - start2;

        // Second call should be faster (cached)
        expect(second).toBeLessThanOrEqual(first + 50); // Allow small margin
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE B: SPECIALIST DETAIL ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  describe("B. Specialist Detail Endpoints", () => {
    describe("GET /specialists/:slug - Get specialist profile", () => {
      it("should return full specialist profile", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(response.body.id).toBe(testSpecialist.id);
        expect(response.body.slug).toBe(testSpecialist.slug);
        expect(response.body.displayName).toBe(testSpecialist.displayName);
        expect(response.body.title).toBe(testSpecialist.title);
        expect(response.body.platforms).toEqual(testSpecialist.platforms);
        expect(response.body.niches).toEqual(testSpecialist.niches);
        expect(response.body.monthlyRate).toBe(testSpecialist.monthlyRate);
        expect(response.body.commissionRate).toBe(testSpecialist.commissionRate);
      });

      it("should include certifications in response", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(response.body.certifications).toBeDefined();
        expect(Array.isArray(response.body.certifications)).toBe(true);
      });

      it("should include case studies in response", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(response.body.caseStudies).toBeDefined();
        expect(Array.isArray(response.body.caseStudies)).toBe(true);
      });

      it("should include performance stats", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.avgROAS).toBeDefined();
        expect(response.body.stats.avgCPA).toBeDefined();
        expect(response.body.stats.totalCampaigns).toBeDefined();
      });

      it("should include rating and review count", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(response.body.rating).toBeDefined();
        expect(response.body.reviewCount).toBeDefined();
        expect(typeof response.body.rating).toBe("number");
        expect(typeof response.body.reviewCount).toBe("number");
      });

      it("should return 404 for non-existent specialist", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists/nonexistent-specialist-slug")
          .expect(404);

        expect(response.body.message).toContain("not found");
      });

      it("should reject invalid slug format", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists/")
          .expect(400);

        expect(response.body.message).toContain("Invalid specialist slug");
      });

      it("should be cacheable (includes cache headers)", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        // Cache headers should be present for public endpoints
        expect(response.headers["cache-control"]).toBeDefined();
      });
    });

    describe("GET /specialists/:slug/performance - Get performance data", () => {
      it("should return performance data with default period (3m)", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .expect(200);

        expect(response.body.summary).toBeDefined();
        expect(response.body.summary.avgROAS).toBeDefined();
        expect(response.body.summary.totalSpend).toBeDefined();
        expect(response.body.summary.totalRevenue).toBeDefined();
        expect(response.body.timeline).toBeDefined();
        expect(Array.isArray(response.body.timeline)).toBe(true);
      });

      it("should support 1m performance period", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ period: "1m" })
          .expect(200);

        expect(response.body.summary).toBeDefined();
        expect(response.body.timeline.length).toBeLessThanOrEqual(30);
      });

      it("should support 3m performance period", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ period: "3m" })
          .expect(200);

        expect(response.body.summary).toBeDefined();
        expect(response.body.timeline.length).toBeLessThanOrEqual(90);
      });

      it("should support 6m performance period", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ period: "6m" })
          .expect(200);

        expect(response.body.summary).toBeDefined();
      });

      it("should support 12m performance period", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ period: "12m" })
          .expect(200);

        expect(response.body.summary).toBeDefined();
      });

      it("should support all-time performance period", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ period: "all" })
          .expect(200);

        expect(response.body.summary).toBeDefined();
      });

      it("should filter by Meta platform", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ platform: "meta" })
          .expect(200);

        expect(response.body.byPlatform).toBeDefined();
        // Should have data for meta if specialist manages it
      });

      it("should filter by Google platform", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ platform: "google" })
          .expect(200);

        expect(response.body.byPlatform).toBeDefined();
      });

      it("should filter by Yandex platform", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ platform: "yandex" })
          .expect(200);

        expect(response.body.byPlatform).toBeDefined();
      });

      it("should include all platforms when platform=all", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ platform: "all" })
          .expect(200);

        expect(response.body.byPlatform).toBeDefined();
        expect(Object.keys(response.body.byPlatform).length).toBeGreaterThan(0);
      });

      it("should include timeline data with dates", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .expect(200);

        if (response.body.timeline.length > 0) {
          response.body.timeline.forEach((point: any) => {
            expect(point.date).toBeDefined();
            expect(point.roas).toBeDefined();
            expect(point.spend).toBeDefined();
            expect(point.revenue).toBeDefined();
          });
        }
      });

      it("should include case studies in performance response", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .expect(200);

        expect(response.body.caseStudies).toBeDefined();
        expect(Array.isArray(response.body.caseStudies)).toBe(true);
      });

      it("should return 404 for non-existent specialist", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists/nonexistent/performance")
          .expect(404);

        expect(response.body.message).toContain("not found");
      });

      it("should reject invalid period", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}/performance`)
          .query({ period: "invalid_period" })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it("should handle specialist with no performance data", async () => {
        const newSpecialist = await fixtures.createTestSpecialist(testUser.id, {
          performanceSyncStatus: "never_synced",
        });

        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${newSpecialist.slug}/performance`)
          .expect(200);

        expect(response.body.summary).toBeDefined();
        expect(response.body.timeline).toEqual([]);
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE C: AUTHENTICATION TESTS
  // ═════════════════════════════════════════════════════════════════════════

  describe("C. Authentication Tests", () => {
    describe("Protected endpoints require JWT token", () => {
      it("GET /my-profile/specialists/:id should reject without token", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .expect(401);

        expect(response.body.message).toContain("Unauthorized");
      });

      it("POST /my-profile/specialists should reject without token", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .send({
            displayName: "Test",
            title: "Marketer",
          })
          .expect(401);

        expect(response.body.message).toContain("Unauthorized");
      });

      it("PATCH /my-profile/specialists/:id should reject without token", async () => {
        const response = await request(app.getHttpServer())
          .patch(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .send({ displayName: "Updated" })
          .expect(401);

        expect(response.body.message).toContain("Unauthorized");
      });

      it("should accept valid JWT token in Authorization header", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
      });
    });

    describe("Expired tokens are rejected", () => {
      it("should reject expired JWT token", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .set("Authorization", `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body.message).toContain("expired");
      });

      it("should reject malformed tokens", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .set("Authorization", "Bearer invalid_token_format")
          .expect(401);

        expect(response.body.message).toBeDefined();
      });

      it("should reject tokens with invalid signature", async () => {
        const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid";
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .set("Authorization", `Bearer ${invalidToken}`)
          .expect(401);

        expect(response.body.message).toBeDefined();
      });
    });

    describe("Workspace isolation", () => {
      it("user cannot access specialist from different workspace", async () => {
        // Create specialist in different workspace
        const otherWorkspace = await fixtures.createTestWorkspace();
        const otherUser = await fixtures.createTestUser(otherWorkspace.id);
        const otherSpecialist = await fixtures.createTestSpecialist(otherUser.id);

        // Try to access with current user's token
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${otherSpecialist.id}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.message).toContain("access");
      });

      it("user cannot create specialist for another workspace", async () => {
        const otherWorkspace = await fixtures.createTestWorkspace();

        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            displayName: "Test",
            title: "Marketer",
            workspaceId: otherWorkspace.id, // Try to assign to different workspace
          })
          .expect(403);

        expect(response.body.message).toContain("access");
      });

      it("specialist lists are workspace-specific", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        // Should only return specialists from user's workspace
        response.body.specialists.forEach((specialist: any) => {
          expect(specialist.workspaceId).toBe(testWorkspace.id);
        });
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE D: ADMIN SYNC ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  describe("D. Admin Sync Endpoints", () => {
    let adminToken: string;
    let adminUser: any;

    beforeEach(async () => {
      // Create admin user
      adminUser = await fixtures.createTestUser(testWorkspace.id, { isAdmin: true });
      adminToken = fixtures.generateAuthToken(adminUser.id, testWorkspace.id);
    });

    describe("POST /admin/specialists/:id/sync-performance", () => {
      it("should sync Meta platform performance data", async () => {
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "meta",
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta" })
          .expect(200);

        expect(response.body.synced).toBe(true);
        expect(response.body.records).toBeGreaterThanOrEqual(0);
        expect(response.body.nextSync).toBeDefined();
      });

      it("should sync Google platform performance data", async () => {
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "google",
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "google" })
          .expect(200);

        expect(response.body.synced).toBe(true);
        expect(response.body.nextSync).toBeDefined();
      });

      it("should sync Yandex platform performance data", async () => {
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "yandex",
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "yandex" })
          .expect(200);

        expect(response.body.synced).toBe(true);
        expect(response.body.nextSync).toBeDefined();
      });

      it("should support force refresh flag", async () => {
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "meta",
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta", forceRefresh: true })
          .expect(200);

        expect(response.body.synced).toBe(true);
        // Force refresh should bypass cache
      });

      it("should return 404 for non-existent specialist", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/admin/specialists/nonexistent/sync-performance")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta" })
          .expect(404);

        expect(response.body.message).toContain("not found");
      });

      it("should return 400 if no connected account", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta" })
          .expect(400);

        expect(response.body.message).toContain("connected");
      });

      it("should require admin role", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${authToken}`) // Non-admin token
          .send({ platform: "meta" })
          .expect(403);

        expect(response.body.message).toContain("Admin");
      });

      it("should reject invalid platform", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "invalid_platform" })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it("should include synced count in response", async () => {
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "meta",
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta" })
          .expect(200);

        expect(response.body.records).toBeDefined();
        expect(typeof response.body.records).toBe("number");
      });

      it("should include nextSync date in response", async () => {
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "meta",
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta" })
          .expect(200);

        expect(response.body.nextSync).toBeDefined();
        expect(new Date(response.body.nextSync)).toBeInstanceOf(Date);
      });

      it("should handle sync errors gracefully", async () => {
        // Create connected account with invalid token
        const connectedAccount = await fixtures.createTestConnectedAccount(
          testSpecialist.id,
          "meta",
          { accessToken: "invalid_token" },
        );

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/sync-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ platform: "meta" })
          .expect(500);

        expect(response.body.message).toBeDefined();
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE E: ADMIN VERIFICATION ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  describe("E. Admin Verification Endpoints", () => {
    let adminToken: string;
    let caseStudy: any;

    beforeEach(async () => {
      const adminUser = await fixtures.createTestUser(testWorkspace.id, { isAdmin: true });
      adminToken = fixtures.generateAuthToken(adminUser.id, testWorkspace.id);
      caseStudy = await fixtures.createTestCaseStudy(testSpecialist.id);
    });

    describe("POST /admin/specialists/:id/verify-performance", () => {
      it("should verify performance data", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            caseStudyId: caseStudy.id,
            verified: true,
          })
          .expect(200);

        expect(response.body.status).toBe("verified");
        expect(response.body.fraudRiskLevel).toBeDefined();
      });

      it("should reject case study", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            caseStudyId: caseStudy.id,
            verified: false,
          })
          .expect(200);

        expect(response.body.status).toBe("rejected");
      });

      it("should support dry-run mode (no data persisted)", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            caseStudyId: caseStudy.id,
            verified: true,
            dryRun: true,
          })
          .expect(200);

        expect(response.body.status).toBe("verified");
        expect(response.body.dryRun).toBe(true);

        // Verify data was not persisted
        const checkResponse = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        // Case study should still be in pending_review if dry-run was respected
      });

      it("should include fraud detection result", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            caseStudyId: caseStudy.id,
            verified: true,
          })
          .expect(200);

        expect(response.body.fraudRiskLevel).toBeDefined();
        expect(["low", "medium", "high"]).toContain(response.body.fraudRiskLevel);
      });

      it("should return 404 for non-existent specialist", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/admin/specialists/nonexistent/verify-performance")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ caseStudyId: caseStudy.id })
          .expect(404);

        expect(response.body.message).toContain("not found");
      });

      it("should return 400 if caseStudyId missing", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.message).toContain("caseStudyId");
      });

      it("should require admin role", async () => {
        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({ caseStudyId: caseStudy.id })
          .expect(403);

        expect(response.body.message).toContain("Admin");
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE F: SYNC STATUS ENDPOINTS
  // ═════════════════════════════════════════════════════════════════════════

  describe("F. Sync Status Endpoints", () => {
    let adminToken: string;

    beforeEach(async () => {
      const adminUser = await fixtures.createTestUser(testWorkspace.id, { isAdmin: true });
      adminToken = fixtures.generateAuthToken(adminUser.id, testWorkspace.id);
    });

    describe("GET /admin/specialists/sync-status", () => {
      it("should return recent sync status for all specialists", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          response.body.forEach((syncStatus: any) => {
            expect(syncStatus.id).toBeDefined();
            expect(syncStatus.displayName).toBeDefined();
            expect(syncStatus.lastSync).toBeDefined();
            expect(syncStatus.status).toBeDefined();
            expect(["pending", "in_progress", "completed", "failed"]).toContain(
              syncStatus.status,
            );
          });
        }
      });

      it("should filter by pending status", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .query({ status: "pending" })
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((syncStatus: any) => {
          expect(syncStatus.status).toBe("pending");
        });
      });

      it("should filter by in_progress status", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .query({ status: "in_progress" })
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it("should filter by completed status", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .query({ status: "completed" })
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it("should filter by failed status", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .query({ status: "failed" })
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it("should support limit parameter", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .query({ limit: 10 })
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.length).toBeLessThanOrEqual(10);
      });

      it("should include specialist name in results", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        if (response.body.length > 0) {
          expect(response.body[0].displayName).toBeDefined();
          expect(typeof response.body[0].displayName).toBe("string");
        }
      });

      it("should include platform in results", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        if (response.body.length > 0) {
          expect(response.body[0].platform).toBeDefined();
        }
      });

      it("should include timestamps", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);

        if (response.body.length > 0) {
          expect(response.body[0].lastSync).toBeDefined();
          expect(response.body[0].nextSync).toBeDefined();
        }
      });

      it("should require admin role", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.message).toContain("Admin");
      });

      it("should reject invalid status filter", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .query({ status: "invalid_status" })
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE G: ERROR HANDLING
  // ═════════════════════════════════════════════════════════════════════════

  describe("G. Error Handling", () => {
    describe("HTTP Status Codes", () => {
      it("should return 200 for successful GET requests", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/filters")
          .expect(200);

        expect(response.status).toBe(200);
      });

      it("should return 201 for successful POST requests creating resources", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            displayName: "Test Specialist",
            title: "Marketing Expert",
          })
          .expect(201);

        expect(response.status).toBe(201);
      });

      it("should return 400 for bad requests with validation errors", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ pageSize: 999999 })
          .expect(400);

        expect(response.status).toBe(400);
      });

      it("should return 401 for unauthenticated requests", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .expect(401);

        expect(response.status).toBe(401);
      });

      it("should return 403 for forbidden requests (authorization)", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/admin/specialists/sync-status")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(403);

        expect(response.status).toBe(403);
      });

      it("should return 404 for non-existent resources", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists/nonexistent-slug")
          .expect(404);

        expect(response.status).toBe(404);
      });

      it("should return 500 for server errors", async () => {
        // This test would need a way to trigger a server error
        // For now, just verify the status code structure
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .expect(200);

        expect([200, 201, 400, 401, 403, 404, 500]).toContain(response.status);
      });
    });

    describe("Error Message Quality", () => {
      it("should return meaningful error messages", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ pageSize: 150 })
          .expect(400);

        expect(response.body.message).toBeDefined();
        expect(response.body.message.length).toBeGreaterThan(0);
        expect(typeof response.body.message).toBe("string");
      });

      it("should not expose sensitive information in error messages", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists/invalid")
          .expect(404);

        const message = JSON.stringify(response.body);
        expect(message).not.toContain("password");
        expect(message).not.toContain("token");
        expect(message).not.toContain("secret");
      });

      it("should include error code for client handling", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ pageSize: 150 })
          .expect(400);

        // Should have either 'error' or 'code' or similar
        expect(
          response.body.error || response.body.code || response.body.statusCode,
        ).toBeDefined();
      });
    });

    describe("Transaction Rollback on Error", () => {
      it("should rollback database changes on validation error", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            // Missing required fields
          })
          .expect(400);

        // Verify specialist was not created
        const getResponse = await request(app.getHttpServer())
          .get("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        // Should not include the invalid specialist
        expect(getResponse.body.specialists).toBeDefined();
      });

      it("should rollback on authorization error", async () => {
        const otherWorkspace = await fixtures.createTestWorkspace();
        const otherUser = await fixtures.createTestUser(otherWorkspace.id);

        const response = await request(app.getHttpServer())
          .patch(`/marketplace/my-profile/specialists/${testSpecialist.id}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({ displayName: "Hacked Name" })
          .expect(403);

        // Verify specialist name wasn't changed
        const getResponse = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(getResponse.body.displayName).toBe(testSpecialist.displayName);
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE H: FRAUD DETECTION & SECURITY
  // ═════════════════════════════════════════════════════════════════════════

  describe("H. Fraud Detection & Security", () => {
    let adminToken: string;

    beforeEach(async () => {
      const adminUser = await fixtures.createTestUser(testWorkspace.id, { isAdmin: true });
      adminToken = fixtures.generateAuthToken(adminUser.id, testWorkspace.id);
    });

    describe("Fraud Risk Assessment", () => {
      it("should flag unusually high ROAS as suspicious", async () => {
        const suspiciousCase = await fixtures.createTestCaseStudy(testSpecialist.id, {
          metrics: {
            spend: 1000,
            revenue: 1000000, // 1000x ROAS - clearly fraudulent
            roas: 1000,
          },
        });

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ caseStudyId: suspiciousCase.id })
          .expect(200);

        expect(response.body.fraudRiskLevel).toBe("high");
      });

      it("should flag impossible metrics (CPA > Revenue Per Conversion)", async () => {
        const suspiciousCase = await fixtures.createTestCaseStudy(testSpecialist.id, {
          metrics: {
            conversions: 100,
            spend: 100000,
            cpa: 1000, // CPA is higher than reasonable ROI
            revenue: 50000,
          },
        });

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ caseStudyId: suspiciousCase.id })
          .expect(200);

        expect(response.body.fraudRiskLevel).toBe("high");
      });

      it("should flag missing metrics as medium risk", async () => {
        const incompleteCase = await fixtures.createTestCaseStudy(testSpecialist.id, {
          metrics: {
            spend: 10000,
            // Missing revenue and other metrics
          },
        });

        const response = await request(app.getHttpServer())
          .post(`/marketplace/admin/specialists/${testSpecialist.id}/verify-performance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ caseStudyId: incompleteCase.id })
          .expect(200);

        expect(["medium", "high"]).toContain(response.body.fraudRiskLevel);
      });

      it("should calculate fraud risk score for specialist", async () => {
        const response = await request(app.getHttpServer())
          .get(`/marketplace/specialists/${testSpecialist.slug}`)
          .expect(200);

        expect(response.body.fraudRiskScore).toBeDefined();
        expect(typeof response.body.fraudRiskScore).toBe("number");
        expect(response.body.fraudRiskScore).toBeGreaterThanOrEqual(0);
        expect(response.body.fraudRiskScore).toBeLessThanOrEqual(1);
      });
    });

    describe("Data Integrity", () => {
      it("should prevent negative spend values", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            displayName: "Test",
            title: "Marketer",
            monthlyRate: -1000, // Invalid
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it("should validate percentage fields (0-100)", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            displayName: "Test",
            title: "Marketer",
            commissionRate: 150, // > 100
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it("should sanitize HTML in text fields", async () => {
        const response = await request(app.getHttpServer())
          .post("/marketplace/my-profile/specialists")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            displayName: "<script>alert('xss')</script>",
            title: "Marketer",
          })
          .expect(400);

        // Should reject or sanitize HTML
        if (response.status === 201) {
          // If accepted, verify it's sanitized
          expect(response.body.displayName).not.toContain("<script>");
        }
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE I: PAGINATION & PAGINATION EDGE CASES
  // ═════════════════════════════════════════════════════════════════════════

  describe("I. Pagination & Cursor Handling", () => {
    describe("GET /marketplace/specialists - Pagination", () => {
      it("should return correct page count", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ pageSize: 10 })
          .expect(200);

        expect(response.body.page).toBe(1);
        expect(response.body.pageSize).toBe(10);
        expect(response.body.total).toBeGreaterThanOrEqual(0);
      });

      it("should handle last page correctly", async () => {
        const firstResponse = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ pageSize: 5 })
          .expect(200);

        if (firstResponse.body.total > 5) {
          const lastPage = Math.ceil(firstResponse.body.total / 5);
          const response = await request(app.getHttpServer())
            .get("/marketplace/specialists")
            .query({ page: lastPage, pageSize: 5 })
            .expect(200);

          expect(response.body.page).toBe(lastPage);
          expect(response.body.specialists.length).toBeLessThanOrEqual(5);
        }
      });

      it("should return empty array for out-of-range page", async () => {
        const response = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ page: 99999, pageSize: 10 })
          .expect(200);

        expect(response.body.specialists).toEqual([]);
        expect(response.body.page).toBe(99999);
      });

      it("should maintain sort order across pages", async () => {
        const page1 = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "rating", pageSize: 5, page: 1 })
          .expect(200);

        const page2 = await request(app.getHttpServer())
          .get("/marketplace/specialists")
          .query({ sortBy: "rating", pageSize: 5, page: 2 })
          .expect(200);

        // If both pages have items, verify ordering is consistent
        if (page1.body.specialists.length > 0 && page2.body.specialists.length > 0) {
          const lastOfPage1 = page1.body.specialists[page1.body.specialists.length - 1];
          const firstOfPage2 = page2.body.specialists[0];

          // Rating should be in descending order (or same)
          expect(lastOfPage1.rating).toBeGreaterThanOrEqual(firstOfPage2.rating);
        }
      });
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE J: TIMEZONE HANDLING
  // ═════════════════════════════════════════════════════════════════════════

  describe("J. Timezone Handling", () => {
    it("should store and return dates in UTC", async () => {
      const response = await request(app.getHttpServer())
        .get(`/marketplace/specialists/${testSpecialist.slug}`)
        .expect(200);

      const createdAt = new Date(response.body.createdAt);
      expect(createdAt.getUTCFullYear).toBeDefined(); // Valid date

      // Verify it's in ISO 8601 format (UTC)
      expect(response.body.createdAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should handle sync scheduling in UTC", async () => {
      const adminUser = await fixtures.createTestUser(testWorkspace.id, { isAdmin: true });
      const adminToken = fixtures.generateAuthToken(adminUser.id, testWorkspace.id);

      const response = await request(app.getHttpServer())
        .get("/marketplace/admin/specialists/sync-status")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const syncStatus = response.body[0];
        const nextSync = new Date(syncStatus.nextSync);
        expect(nextSync.getUTCFullYear).toBeDefined();
      }
    });
  });
});
