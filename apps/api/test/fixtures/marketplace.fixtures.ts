/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKETPLACE TEST FIXTURES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Helper functions for creating test data, seeding database, and cleaning up
 * after tests. All fixtures use transactions for isolation.
 */

import { Repository, DataSource } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";

// Mock entity interfaces (replace with actual imports when available)
interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  workspaceId: string;
}

interface TestWorkspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
}

interface TestAgentProfile {
  id: string;
  slug: string;
  displayName: string;
  title: string;
  agentType: "human" | "ai";
  ownerId?: string;
  platforms: string[];
  niches: string[];
  monthlyRate: number;
  commissionRate: number;
  isVerified: boolean;
  isFeatured: boolean;
  cachedRating: number;
  cachedReviewCount: number;
  isPublished: boolean;
  performanceSyncStatus: "healthy" | "stale" | "failed" | "never_synced";
  fraudRiskScore: number;
}

interface TestConnectedAccount {
  id: string;
  agentProfileId: string;
  platform: "meta" | "google" | "yandex";
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  isConnected: boolean;
}

interface TestCaseStudy {
  id: string;
  agentProfileId: string;
  title: string;
  industry: string;
  platform: string;
  metrics?: Record<string, any>;
  status: "pending_review" | "approved" | "rejected";
}

interface TestSyncLog {
  id: string;
  agentProfileId: string;
  syncType: "meta" | "google" | "yandex" | "manual";
  status: "pending" | "in_progress" | "completed" | "failed";
  recordsSynced: number;
  errorMessage?: string;
}

/**
 * Marketplace Test Fixtures
 * Provides helper functions for test data creation and cleanup
 */
export class MarketplaceFixtures {
  private jwtService: JwtService;
  private dataSource: DataSource;
  private createdIds: Map<string, string[]> = new Map();

  constructor(jwtService: JwtService, dataSource: DataSource) {
    this.jwtService = jwtService;
    this.dataSource = dataSource;
  }

  /**
   * Create a test workspace
   */
  async createTestWorkspace(
    overrides: Partial<TestWorkspace> = {},
  ): Promise<TestWorkspace> {
    const workspace: TestWorkspace = {
      id: uuidv4(),
      name: "Test Workspace " + Date.now(),
      slug: "test-workspace-" + Date.now(),
      ownerId: uuidv4(),
      ...overrides,
    };

    this.trackCreated("workspaces", workspace.id);
    return workspace;
  }

  /**
   * Create a test user
   */
  async createTestUser(
    workspaceId: string,
    overrides: Partial<TestUser> = {},
  ): Promise<TestUser> {
    const user: TestUser = {
      id: uuidv4(),
      email: `test-${Date.now()}@adspectr.test`,
      firstName: "Test",
      lastName: "User",
      workspaceId,
      ...overrides,
    };

    this.trackCreated("users", user.id);
    return user;
  }

  /**
   * Create a test specialist profile
   */
  async createTestSpecialist(
    ownerId: string,
    overrides: Partial<TestAgentProfile> = {},
  ): Promise<TestAgentProfile> {
    const slug = `specialist-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const specialist: TestAgentProfile = {
      id: uuidv4(),
      slug,
      displayName: "Test Specialist " + Date.now(),
      title: "Performance Marketer",
      agentType: "human",
      ownerId,
      platforms: ["meta", "google"],
      niches: ["ecommerce", "saas"],
      monthlyRate: 5000,
      commissionRate: 15,
      isVerified: true,
      isFeatured: false,
      cachedRating: 4.5,
      cachedReviewCount: 12,
      isPublished: true,
      performanceSyncStatus: "healthy",
      fraudRiskScore: 0.1,
      ...overrides,
    };

    this.trackCreated("specialists", specialist.id);
    return specialist;
  }

  /**
   * Create a test connected account (Meta, Google, Yandex)
   */
  async createTestConnectedAccount(
    agentProfileId: string,
    platform: "meta" | "google" | "yandex" = "meta",
    overrides: Partial<TestConnectedAccount> = {},
  ): Promise<TestConnectedAccount> {
    const account: TestConnectedAccount = {
      id: uuidv4(),
      agentProfileId,
      platform,
      accountId: `${platform}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      accessToken: `mock_token_${Date.now()}_${Math.random()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      isConnected: true,
      ...overrides,
    };

    this.trackCreated("connected_accounts", account.id);
    return account;
  }

  /**
   * Create a test case study with performance data
   */
  async createTestCaseStudy(
    agentProfileId: string,
    overrides: Partial<TestCaseStudy> = {},
  ): Promise<TestCaseStudy> {
    const caseStudy: TestCaseStudy = {
      id: uuidv4(),
      agentProfileId,
      title: "E-commerce Campaign Case Study " + Date.now(),
      industry: "ecommerce",
      platform: "meta",
      metrics: {
        spend: 50000,
        revenue: 250000,
        roas: 5.0,
        cpc: 0.85,
        ctr: 2.1,
        conversions: 1200,
        cpa: 41.67,
      },
      status: "approved",
      ...overrides,
    };

    this.trackCreated("case_studies", caseStudy.id);
    return caseStudy;
  }

  /**
   * Create a test performance sync log
   */
  async createTestSyncLog(
    agentProfileId: string,
    overrides: Partial<TestSyncLog> = {},
  ): Promise<TestSyncLog> {
    const now = new Date();
    const syncLog: TestSyncLog = {
      id: uuidv4(),
      agentProfileId,
      syncType: "meta",
      status: "completed",
      recordsSynced: 15,
      ...overrides,
    };

    this.trackCreated("sync_logs", syncLog.id);
    return syncLog;
  }

  /**
   * Generate a valid JWT token for testing
   */
  generateAuthToken(userId: string, workspaceId: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email: `user-${userId}@test.local`,
        workspaceId,
      },
      {
        expiresIn: "1h",
      },
    );
  }

  /**
   * Generate an expired JWT token for testing
   */
  generateExpiredToken(userId: string, workspaceId: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email: `user-${userId}@test.local`,
        workspaceId,
      },
      {
        expiresIn: "0s",
      },
    );
  }

  /**
   * Track created IDs for cleanup
   */
  private trackCreated(type: string, id: string): void {
    if (!this.createdIds.has(type)) {
      this.createdIds.set(type, []);
    }
    this.createdIds.get(type)!.push(id);
  }

  /**
   * Create mock performance data timeline
   */
  createMockPerformanceTimeline(
    days: number = 90,
  ): Array<{ date: string; roas: number; spend: number; revenue: number }> {
    const timeline = [];
    const baseDate = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);

      timeline.push({
        date: date.toISOString().split("T")[0],
        roas: 3.5 + Math.random() * 2,
        spend: 10000 + Math.random() * 5000,
        revenue: 40000 + Math.random() * 20000,
      });
    }

    return timeline.reverse();
  }

  /**
   * Create mock platform-specific metrics
   */
  createMockPlatformMetrics(): Record<string, any> {
    return {
      meta: {
        campaigns: 8,
        adSets: 24,
        ads: 48,
        totalSpend: 35000,
        totalRevenue: 140000,
        roas: 4.0,
        cpc: 0.95,
        ctr: 2.3,
        conversions: 800,
        cpa: 43.75,
      },
      google: {
        campaigns: 5,
        adGroups: 15,
        totalSpend: 25000,
        totalRevenue: 125000,
        roas: 5.0,
        cpc: 1.2,
        ctr: 1.8,
        conversions: 400,
        cpa: 62.5,
      },
      yandex: {
        campaigns: 3,
        adGroups: 8,
        totalSpend: 15000,
        totalRevenue: 75000,
        roas: 5.0,
        cpc: 1.5,
        ctr: 1.5,
        conversions: 200,
        cpa: 75.0,
      },
    };
  }

  /**
   * Get all created IDs (for debugging/inspection)
   */
  getCreatedIds(): Map<string, string[]> {
    return this.createdIds;
  }

  /**
   * Clear created IDs tracking
   */
  clearTracking(): void {
    this.createdIds.clear();
  }

  /**
   * Cleanup test data (delete all created records)
   * Should be called in afterEach or afterAll test hooks
   */
  async cleanup(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Delete in reverse order of creation to respect foreign keys
      const deletionOrder = [
        "fraud_detection_audits",
        "agent_performance_sync_logs",
        "agent_platform_metrics",
        "agent_historical_performance",
        "agent_case_studies",
        "agent_certifications",
        "agent_geographic_coverages",
        "agent_languages",
        "agent_reviews",
        "service_engagements",
        "agent_profiles",
        "connected_accounts",
        "users",
        "workspaces",
      ];

      for (const table of deletionOrder) {
        const ids = this.createdIds.get(table) || [];
        if (ids.length > 0) {
          await queryRunner.query(
            `DELETE FROM "${table}" WHERE id = ANY($1)`,
            [ids],
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

/**
 * Create a fixtures instance for use in test suites
 */
export function createMarketplaceFixtures(
  jwtService: JwtService,
  dataSource: DataSource,
): MarketplaceFixtures {
  return new MarketplaceFixtures(jwtService, dataSource);
}
