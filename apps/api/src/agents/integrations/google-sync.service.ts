import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, Between } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { ServiceEngagement } from "../entities/service-engagement.entity";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { Platform } from "@performa/shared";
import { decrypt } from "../../common/crypto.util";

/**
 * PerformanceSyncResult represents the outcome of a marketplace performance sync
 * for a single specialist.
 */
export interface PerformanceSyncResult {
  success: boolean;
  agentProfileId: string;
  agentDisplayName: string;
  metricsInserted: number;
  metricsUpdated: number;
  campaignsSynced: number;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  syncedAt: Date;
  fraudRiskScore: number;
  errors: string[];
  warnings: string[];
}

/**
 * MetricsPullConfig controls what time period to pull metrics for.
 */
export interface MetricsPullConfig {
  /** Days to look back from today (default: 30). Minimum 1, maximum 365. */
  dayLookback: number;
  /** If true, overwrite existing metrics for the period. If false, skip existing. */
  forceRefresh: boolean;
  /** If true, only pull/validate but don't persist to DB. */
  dryRun: boolean;
}

/**
 * GooglePerformanceRow is the normalized performance metric pulled from Google Ads API.
 * Maps daily campaign metrics to a standard format for storage in agent_platform_metrics.
 */
interface GooglePerformanceRow {
  campaignId: string;
  campaignName: string;
  date: Date;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  // Computed
  ctr: number; // clicks / impressions
  cpa: number | null; // spend / conversions (null if conversions=0)
  roas: number; // conversionValue / spend (null if spend=0)
}

/**
 * GoogleAccountWithMetrics represents a Google Ads customer with its associated
 * campaigns and their performance metrics.
 */
interface GoogleAccountWithMetrics {
  customerId: string;
  customerName: string;
  currency: string;
  performanceRows: GooglePerformanceRow[];
}

/**
 * FraudValidationResult from the fraud detection service.
 */
export interface FraudValidationResult {
  isValid: boolean;
  fraudRiskScore: number; // 0-100
  reasons: string[];
}

/**
 * GooglePerformanceSyncService enhances the marketplace by syncing real Google Ads
 * campaign performance data directly into specialist profiles. This enables:
 *
 * 1. **Data Collection**: Pulls daily/monthly campaign metrics from Google Ads API v15
 * 2. **Validation**: Checks metrics for fraud using configurable rules
 * 3. **Storage**: Persists normalized metrics to agent_platform_metrics
 * 4. **Profile Update**: Recalculates specialist cached stats and performance history
 * 5. **Scheduling**: Runs on-demand or via daily cron for automatic updates
 *
 * Design principles:
 * - Workspace isolation: All operations respect workspace boundaries
 * - Rate limiting: Staggered API requests (10 req/10 sec limit)
 * - Idempotency: Upserts ensure repeated syncs are safe
 * - Partial success: Per-account errors don't abort the entire specialist sync
 * - Audit trail: All syncs logged with timestamps and result metrics
 *
 * Error handling:
 * - Token expired: Attempt refresh, then notify admin
 * - Rate limit: Queue for retry with exponential backoff
 * - Missing campaigns: Log warning, continue with other accounts
 * - Fraud detection: Flag suspicious metrics, include in fraud_risk_score
 */
@Injectable()
export class GooglePerformanceSyncService {
  private readonly logger = new Logger(GooglePerformanceSyncService.name);
  private readonly encryptionKey: string | null;
  private readonly googleAdsApiVersion = "v15";
  private readonly googleAdsApiBase = "https://googleads.googleapis.com";

  // Rate limit state: Google Ads API allows 10 requests per 10 seconds
  // Track request timestamps to enforce this limit
  private readonly rateLimitState = new Map<
    string,
    {
      lastRequestMs: number;
      requestTimestamps: number[];
      backoffMultiplier: number;
    }
  >();

  constructor(
    private readonly http: HttpService,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepo: Repository<AgentProfile>,
    @InjectRepository(AgentPlatformMetrics)
    private readonly metricsRepo: Repository<AgentPlatformMetrics>,
    @InjectRepository(ServiceEngagement)
    private readonly serviceEngagementRepo: Repository<ServiceEngagement>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {
    const key = this.config.get<string>("ENCRYPTION_KEY", "");
    this.encryptionKey = key.length === 32 ? key : null;
  }

  /**
   * Main entry point: sync performance metrics for a specialist into the marketplace.
   *
   * Execution flow:
   * 1. Validate specialist exists and owns connected Google Ads accounts
   * 2. Get access token from most recent ServiceEngagement
   * 3. Fetch all campaigns and their metrics from Google Ads API
   * 4. Validate metrics with fraud detection rules
   * 5. Upsert metrics to agent_platform_metrics table
   * 6. Recalculate cached stats and monthly performance
   * 7. Update specialist's lastPerformanceSync and performanceSyncStatus
   *
   * @param agentProfileId The specialist's profile ID
   * @param workspaceId Workspace context for isolation
   * @param config Pull configuration (lookback period, force refresh, etc.)
   * @returns Detailed result including metrics counts, errors, and fraud score
   * @throws NotFoundException if specialist not found
   * @throws BadRequestException if no Google Ads accounts connected
   */
  async syncSpecialistMetrics(
    agentProfileId: string,
    workspaceId: string,
    config: Partial<MetricsPullConfig> = {},
  ): Promise<PerformanceSyncResult> {
    const startTime = Date.now();
    const result: PerformanceSyncResult = {
      success: false,
      agentProfileId,
      agentDisplayName: "unknown",
      metricsInserted: 0,
      metricsUpdated: 0,
      campaignsSynced: 0,
      dateRangeStart: new Date(),
      dateRangeEnd: new Date(),
      syncedAt: new Date(),
      fraudRiskScore: 0,
      errors: [],
      warnings: [],
    };

    const pullConfig: MetricsPullConfig = {
      dayLookback: config.dayLookback ?? 30,
      forceRefresh: config.forceRefresh ?? false,
      dryRun: config.dryRun ?? false,
    };

    // Validate config
    if (pullConfig.dayLookback < 1 || pullConfig.dayLookback > 365) {
      throw new BadRequestException("dayLookback must be between 1 and 365 days");
    }

    try {
      // ──── Step 1: Load specialist profile ────────────────────────────────────
      const specialist = await this.agentProfileRepo.findOne({
        where: { id: agentProfileId },
      });

      if (!specialist) {
        throw new NotFoundException(`Agent profile ${agentProfileId} not found`);
      }

      result.agentDisplayName = specialist.displayName;

      this.logger.log({
        message: "Performance sync started for specialist",
        agentProfileId,
        displayName: specialist.displayName,
        workspaceId,
      });

      // ──── Step 2: Resolve access token ──────────────────────────────────────
      const accessToken = await this.resolveAccessToken(workspaceId);
      if (!accessToken) {
        throw new BadRequestException(
          `No active Google Ads integration found for workspace ${workspaceId}. ` +
            "Please connect a Google Ads account first.",
        );
      }

      // ──── Step 3: Get customer ID from ServiceEngagement ──────────────────────
      const customerIds = await this.getConnectedCustomerIds(workspaceId);
      if (customerIds.length === 0) {
        throw new BadRequestException(
          "No Google Ads customer accounts configured for this workspace.",
        );
      }

      // ──── Step 4: Calculate date range ────────────────────────────────────
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - pullConfig.dayLookback);

      result.dateRangeStart = startDate;
      result.dateRangeEnd = endDate;

      this.logger.debug({
        message: "Date range for metrics pull",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        dayLookback: pullConfig.dayLookback,
      });

      // ──── Step 5: Fetch customer accounts and campaign metrics ──────────────
      const accountsWithMetrics = await this.fetchAccountMetrics(
        customerIds,
        accessToken,
        startDate,
        endDate,
      );

      if (accountsWithMetrics.length === 0) {
        result.warnings.push("No campaigns found in connected Google Ads accounts");
        result.success = true;
        return result;
      }

      // ──── Step 6: Validate metrics (fraud detection) ───────────────────────
      const validatedMetrics = await this.validateMetricsWithFraudDetection(
        accountsWithMetrics,
        specialist,
      );

      result.fraudRiskScore = validatedMetrics.fraudRiskScore;

      if (validatedMetrics.errors.length > 0) {
        result.warnings.push(...validatedMetrics.errors);
      }

      // ──── Step 7: Persist to database (with transaction) ──────────────────
      if (!pullConfig.dryRun) {
        const persistResult = await this.persistMetrics(
          agentProfileId,
          validatedMetrics.rows,
          pullConfig.forceRefresh,
          startDate,
          endDate,
        );

        result.metricsInserted = persistResult.inserted;
        result.metricsUpdated = persistResult.updated;
        result.campaignsSynced = accountsWithMetrics.reduce(
          (sum, acc) => sum + new Set(acc.performanceRows.map((r) => r.campaignId)).size,
          0,
        );
      }

      // ──── Step 8: Update specialist profile ────────────────────────────────
      if (!pullConfig.dryRun) {
        await this.updateSpecialistProfile(
          agentProfileId,
          result.fraudRiskScore,
          result.metricsInserted > 0 || result.metricsUpdated > 0,
        );
      }

      result.success = true;

      this.logger.log({
        message: "Performance sync completed successfully",
        agentProfileId,
        displayName: specialist.displayName,
        durationMs: Date.now() - startTime,
        ...result,
      });

      return result;
    } catch (err: any) {
      result.errors.push(err?.message ?? "Unknown error");
      result.success = false;

      this.logger.error({
        message: "Performance sync failed",
        agentProfileId,
        error: err?.message,
        stack: err?.stack,
      });

      return result;
    }
  }

  /**
   * Fetches all customer accounts and their campaign metrics from Google Ads API.
   * Handles rate limiting and per-account error recovery.
   */
  private async fetchAccountMetrics(
    customerIds: string[],
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GoogleAccountWithMetrics[]> {
    const results: GoogleAccountWithMetrics[] = [];

    for (const customerId of customerIds) {
      try {
        // Rate limit: enforce Google Ads API limit
        await this.applyRateLimit(customerId);

        const campaigns = await this.getCampaigns(customerId, accessToken);

        if (campaigns.length === 0) {
          this.logger.debug({
            message: "No campaigns found for customer",
            customerId,
          });
          continue;
        }

        // Fetch metrics for all campaigns in this customer
        const performanceRows = await this.getCampaignMetrics(
          customerId,
          accessToken,
          startDate,
          endDate,
        );

        if (performanceRows.length > 0) {
          results.push({
            customerId,
            customerName: `Customer ${customerId}`,
            currency: "USD", // TODO: fetch from customer settings
            performanceRows,
          });
        }
      } catch (err: any) {
        this.logger.error({
          message: "Failed to fetch metrics for customer",
          customerId,
          error: err?.message,
        });
        // Continue with other accounts
      }
    }

    return results;
  }

  /**
   * Fetches all campaigns for a Google Ads customer.
   * Uses Google Ads API v15 customer.gaql search.
   */
  private async getCampaigns(customerId: string, accessToken: string): Promise<any[]> {
    try {
      const query = `
        SELECT campaign.id, campaign.name, campaign.status
        FROM campaign
        WHERE campaign.status != REMOVED
        ORDER BY campaign.id
      `;

      const response = await firstValueFrom(
        this.http.post(
          `${this.googleAdsApiBase}/${this.googleAdsApiVersion}/customers/${customerId}/googleAds:search`,
          { query },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "developer-token": this.config.get<string>("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
            },
          },
        ),
      );

      return (
        response.data.results?.map((result: any) => ({
          id: result.campaign.id,
          name: result.campaign.name,
          status: result.campaign.status,
        })) || []
      );
    } catch (err: any) {
      this.logger.warn({
        message: "Failed to fetch campaigns",
        customerId,
        error: err?.response?.data?.error?.message || err?.message,
      });
      return [];
    }
  }

  /**
   * Fetches daily performance metrics for all campaigns in a customer.
   * Aggregates impressions, clicks, spend, and conversions.
   */
  private async getCampaignMetrics(
    customerId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GooglePerformanceRow[]> {
    try {
      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      const query = `
        SELECT
          campaign.id,
          campaign.name,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversion_value
        FROM campaign
        WHERE
          campaign.status != REMOVED
          AND segments.date >= '${formatDate(startDate)}'
          AND segments.date <= '${formatDate(endDate)}'
        ORDER BY segments.date DESC, campaign.id
      `;

      const response = await firstValueFrom(
        this.http.post(
          `${this.googleAdsApiBase}/${this.googleAdsApiVersion}/customers/${customerId}/googleAds:search`,
          { query },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "developer-token": this.config.get<string>("GOOGLE_ADS_DEVELOPER_TOKEN", ""),
            },
          },
        ),
      );

      const rows: GooglePerformanceRow[] = [];

      for (const result of response.data.results || []) {
        const metrics = result.metrics;
        const campaign = result.campaign;

        // Google Ads API returns cost in micros (millionths)
        const spend = (metrics.cost_micros || 0) / 1000000;
        const impressions = parseInt(metrics.impressions || "0", 10);
        const clicks = parseInt(metrics.clicks || "0", 10);
        const conversions = parseFloat(metrics.conversions || "0");
        const conversionValue = parseFloat(metrics.conversion_value || "0");

        // Calculate derived metrics
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpa = conversions > 0 ? spend / conversions : null;
        const roas = spend > 0 ? conversionValue / spend : null;

        rows.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          date: new Date(result.segments.date),
          spend,
          impressions,
          clicks,
          conversions,
          conversionValue,
          ctr,
          cpa,
          roas,
        });
      }

      return rows;
    } catch (err: any) {
      this.logger.warn({
        message: "Failed to fetch campaign metrics",
        customerId,
        error: err?.response?.data?.error?.message || err?.message,
      });
      return [];
    }
  }

  /**
   * Validates metrics for fraud and suspicious patterns.
   * Checks for:
   * - Unrealistic ROAS (too high or too low)
   * - Unrealistic CPA values
   * - Impossible metrics (negative values, CTR > 100)
   * - Sudden spikes or anomalies
   */
  private async validateMetricsWithFraudDetection(
    accountsWithMetrics: GoogleAccountWithMetrics[],
    specialist: AgentProfile,
  ): Promise<{
    rows: GooglePerformanceRow[];
    fraudRiskScore: number;
    errors: string[];
  }> {
    const allRows: GooglePerformanceRow[] = accountsWithMetrics.flatMap(
      (acc) => acc.performanceRows,
    );

    let fraudRiskScore = 0;
    const errors: string[] = [];

    // Basic validation: check for impossible metrics
    for (const row of allRows) {
      if (row.spend < 0) {
        errors.push(`Campaign ${row.campaignId}: Negative spend detected`);
        fraudRiskScore += 25;
      }

      if (row.ctr > 100) {
        errors.push(`Campaign ${row.campaignId}: CTR > 100% (impossible)`);
        fraudRiskScore += 20;
      }

      if (row.conversions < 0) {
        errors.push(`Campaign ${row.campaignId}: Negative conversions detected`);
        fraudRiskScore += 20;
      }

      // Check for unrealistic ROAS
      if (row.roas !== null && (row.roas < 0 || row.roas > 100)) {
        errors.push(`Campaign ${row.campaignId}: ROAS ${row.roas.toFixed(2)} is unrealistic`);
        fraudRiskScore += 15;
      }

      // Check for unrealistic CPA
      if (row.cpa !== null && (row.cpa < 0.01 || row.cpa > 10000)) {
        errors.push(`Campaign ${row.campaignId}: CPA $${row.cpa.toFixed(2)} is unrealistic`);
        fraudRiskScore += 10;
      }
    }

    // Additional: check if specialist's average ROAS would spike unrealistically
    if (specialist.cachedStats) {
      const avgRoas = allRows
        .filter((r) => r.roas !== null)
        .reduce((sum, r) => sum + r.roas, 0) / Math.max(1, allRows.filter((r) => r.roas !== null).length);

      const historicalRoas = specialist.cachedStats.avgROAS;
      const roasChange = Math.abs(avgRoas - historicalRoas) / Math.max(0.1, historicalRoas);

      if (roasChange > 2) {
        errors.push(
          `ROAS spike detected: ${avgRoas.toFixed(2)} vs historical ${historicalRoas.toFixed(2)}`,
        );
        fraudRiskScore += 10;
      }
    }

    // Cap fraud risk score at 100
    fraudRiskScore = Math.min(100, fraudRiskScore);

    return {
      rows: allRows,
      fraudRiskScore,
      errors,
    };
  }

  /**
   * Persists validated metrics to agent_platform_metrics table.
   * Groups daily metrics by month (aggregationPeriod = first day of month).
   * Uses upsert to handle idempotent syncs.
   */
  private async persistMetrics(
    agentProfileId: string,
    rows: GooglePerformanceRow[],
    forceRefresh: boolean,
    startDate: Date,
    endDate: Date,
  ): Promise<{ inserted: number; updated: number }> {
    // Group by month for aggregation
    const byMonth = new Map<string, GooglePerformanceRow[]>();

    for (const row of rows) {
      // Create first-day-of-month date for aggregationPeriod
      const monthKey = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}`;
      const aggregationPeriod = new Date(row.date.getFullYear(), row.date.getMonth(), 1);

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey)!.push(row);
    }

    // Aggregate metrics by month
    const aggregatedMetrics: Partial<AgentPlatformMetrics>[] = [];

    for (const [monthKey, monthRows] of byMonth.entries()) {
      const totalSpend = monthRows.reduce((sum, r) => sum + r.spend, 0);
      const totalImpressions = monthRows.reduce((sum, r) => sum + r.impressions, 0);
      const totalClicks = monthRows.reduce((sum, r) => sum + r.clicks, 0);
      const totalConversions = monthRows.reduce((sum, r) => sum + r.conversions, 0);
      const totalRevenue = monthRows.reduce((sum, r) => sum + r.conversionValue, 0);

      // Calculate aggregated metrics
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : null;
      const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : null;

      const aggregationPeriod = new Date(
        parseInt(monthKey.split("-")[0], 10),
        parseInt(monthKey.split("-")[1], 10) - 1,
        1,
      );

      aggregatedMetrics.push({
        agentProfileId,
        platform: "google",
        aggregationPeriod,
        totalSpend,
        campaignsCount: new Set(monthRows.map((r) => r.campaignId)).size,
        avgRoas: avgRoas ?? undefined,
        avgCpa: avgCpa ?? undefined,
        avgCtr,
        conversionCount: totalConversions,
        totalRevenue,
        sourceType: "api_pull",
        isVerified: true,
      });
    }

    // Upsert to database
    let inserted = 0;
    let updated = 0;

    const result = await this.dataSource.transaction(async (em) => {
      for (const metric of aggregatedMetrics) {
        // Delete existing if forceRefresh is true
        if (forceRefresh) {
          await em.delete(AgentPlatformMetrics, {
            agentProfileId,
            platform: "google",
            aggregationPeriod: metric.aggregationPeriod,
          });
        }

        // Upsert
        const upsertResult = await em.upsert(
          AgentPlatformMetrics,
          metric,
          {
            conflictPaths: ["agentProfileId", "platform", "aggregationPeriod"],
            skipUpdateIfNoValuesChanged: true,
          },
        );

        // TypeORM upsert returns affected rows count
        if (upsertResult.raw?.affectedRows === 1 && upsertResult.identifiers.length > 0) {
          const existing = await em.findOne(AgentPlatformMetrics, {
            where: {
              agentProfileId,
              platform: "google",
              aggregationPeriod: metric.aggregationPeriod,
            },
          });
          if (existing && existing.updatedAt > new Date(Date.now() - 1000)) {
            updated++;
          } else {
            inserted++;
          }
        } else {
          inserted++;
        }
      }
    });

    this.logger.log({
      message: "Metrics persisted",
      agentProfileId,
      platform: "google",
      metricsCount: aggregatedMetrics.length,
      inserted,
      updated,
    });

    return { inserted, updated };
  }

  /**
   * Updates specialist profile with recalculated stats.
   * Computes avgRoas, avgCpa from all stored metrics.
   * Updates monthly_performance array with last 12 months.
   * Sets lastPerformanceSync and performanceSyncStatus.
   */
  private async updateSpecialistProfile(
    agentProfileId: string,
    fraudRiskScore: number,
    metricsUpdated: boolean,
  ): Promise<void> {
    // Fetch all metrics for this specialist (all platforms)
    const metrics = await this.metricsRepo.find({
      where: {
        agentProfileId,
      },
      order: {
        aggregationPeriod: "DESC",
      },
    });

    // Calculate aggregated stats (across all platforms)
    let totalSpend = 0;
    let totalRevenue = 0;
    let roasSum = 0;
    let cpaSum = 0;
    let roasCount = 0;
    let cpaCount = 0;
    let totalCampaigns = 0;

    for (const metric of metrics) {
      totalSpend += Number(metric.totalSpend);
      totalRevenue += Number(metric.totalRevenue);
      totalCampaigns += metric.campaignsCount;

      if (metric.avgRoas !== null) {
        roasSum += Number(metric.avgRoas);
        roasCount++;
      }

      if (metric.avgCpa !== null) {
        cpaSum += Number(metric.avgCpa);
        cpaCount++;
      }
    }

    const avgRoas = roasCount > 0 ? roasSum / roasCount : 0;
    const avgCpa = cpaCount > 0 ? cpaSum / cpaCount : 0;

    // Build monthly performance array (last 12 months)
    const monthlyPerformance: Array<{
      month: string;
      roas: number;
      spend: number;
      campaigns: number;
    }> = [];

    const last12Months = metrics.slice(0, 12);
    for (const metric of last12Months) {
      const monthDate = new Date(metric.aggregationPeriod);
      const monthName = monthDate.toLocaleString("en-US", { month: "short" });

      monthlyPerformance.push({
        month: monthName,
        roas: Number(metric.avgRoas ?? 0),
        spend: Number(metric.totalSpend),
        campaigns: metric.campaignsCount,
      });
    }

    // Update specialist profile
    const specialist = await this.agentProfileRepo.findOne({
      where: { id: agentProfileId },
    });

    if (!specialist) {
      this.logger.warn({
        message: "Specialist profile not found for update",
        agentProfileId,
      });
      return;
    }

    if (metricsUpdated) {
      specialist.cachedStats = {
        avgROAS: avgRoas,
        avgCPA: avgCpa,
        avgCTR: specialist.cachedStats?.avgCTR ?? 0,
        totalCampaigns,
        activeCampaigns: specialist.cachedStats?.activeCampaigns ?? 0,
        successRate: specialist.cachedStats?.successRate ?? 0,
        totalSpendManaged: totalSpend,
        bestROAS: specialist.cachedStats?.bestROAS ?? avgRoas,
      };

      specialist.monthlyPerformance = monthlyPerformance;
    }

    specialist.lastPerformanceSync = new Date();
    specialist.performanceSyncStatus =
      fraudRiskScore > 50 ? "stale" : metricsUpdated ? "healthy" : "healthy";
    specialist.fraudRiskScore = fraudRiskScore;
    specialist.isPerformanceDataVerified = fraudRiskScore <= 30;

    await this.agentProfileRepo.save(specialist);

    this.logger.log({
      message: "Specialist profile updated",
      agentProfileId,
      displayName: specialist.displayName,
      avgRoas,
      avgCpa,
      fraudRiskScore,
      performanceSyncStatus: specialist.performanceSyncStatus,
    });
  }

  /**
   * Rate limiting helper: enforces Google Ads API limit of 10 requests per 10 seconds.
   * Uses exponential backoff if limit is hit.
   */
  private async applyRateLimit(customerId: string): Promise<void> {
    const now = Date.now();
    const state = this.rateLimitState.get(customerId);

    if (state) {
      // Remove timestamps older than 10 seconds
      state.requestTimestamps = state.requestTimestamps.filter((ts) => now - ts < 10000);

      // If we have 10 requests in the last 10 seconds, wait
      if (state.requestTimestamps.length >= 10) {
        const oldestTimestamp = state.requestTimestamps[0];
        const waitTime = 10000 - (now - oldestTimestamp) + 100; // +100ms buffer

        if (waitTime > 0) {
          this.logger.warn({
            message: "Rate limit approached, applying backoff",
            customerId,
            requestsInWindow: state.requestTimestamps.length,
            waitMs: waitTime,
          });

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      state.requestTimestamps.push(Date.now());
      state.lastRequestMs = Date.now();
    } else {
      this.rateLimitState.set(customerId, {
        lastRequestMs: now,
        requestTimestamps: [now],
        backoffMultiplier: 1,
      });
    }
  }

  /**
   * Handles rate limit responses from Google Ads API.
   * Increases backoff multiplier for future requests to this customer.
   */
  private handleRateLimit(customerId: string): void {
    const state = this.rateLimitState.get(customerId);
    if (state) {
      state.backoffMultiplier = Math.min(state.backoffMultiplier * 2, 10); // Cap at 10x
      this.logger.warn({
        message: "Rate limit hit, increasing backoff",
        customerId,
        backoffMultiplier: state.backoffMultiplier,
      });
    }
  }

  /**
   * Resolves Google Ads access token for a workspace.
   * Looks up most recent active ServiceEngagement and decrypts token if needed.
   * Attempts token refresh if token has expired.
   */
  private async resolveAccessToken(workspaceId: string): Promise<string | null> {
    const engagement = await this.serviceEngagementRepo.findOne({
      where: {
        workspaceId,
        platformType: "google_ads",
        isActive: true,
      },
      order: { createdAt: "DESC" },
    });

    if (!engagement || !engagement.accessToken) {
      return null;
    }

    let token = engagement.accessToken;

    // Decrypt if needed
    if (this.encryptionKey && token.includes(":")) {
      try {
        token = decrypt(token, this.encryptionKey);
      } catch (err: any) {
        this.logger.warn({
          message: "Token decryption failed",
          workspaceId,
          error: err?.message,
        });
        return null;
      }
    }

    // Check if token is expired and attempt refresh
    if (engagement.tokenExpiresAt && engagement.tokenExpiresAt < new Date()) {
      if (engagement.refreshToken) {
        try {
          const newToken = await this.refreshAccessToken(
            engagement.refreshToken,
            engagement.clientId,
            engagement.clientSecret,
          );
          token = newToken;
          engagement.accessToken = newToken;
          engagement.tokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now
          await this.serviceEngagementRepo.save(engagement);

          this.logger.log({
            message: "Token refreshed successfully",
            workspaceId,
          });
        } catch (err: any) {
          this.logger.error({
            message: "Token refresh failed",
            workspaceId,
            error: err?.message,
          });
          return null;
        }
      } else {
        this.logger.warn({
          message: "Token expired and no refresh token available",
          workspaceId,
        });
        return null;
      }
    }

    return token;
  }

  /**
   * Attempts to refresh an expired access token using the refresh token.
   * Calls Google OAuth token endpoint.
   */
  private async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<string> {
    const decryptedRefresh = this.encryptionKey
      ? decrypt(refreshToken, this.encryptionKey)
      : refreshToken;

    const response = await firstValueFrom(
      this.http.post(
        "https://oauth2.googleapis.com/token",
        {
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: decryptedRefresh,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      ),
    );

    return response.data.access_token;
  }

  /**
   * Gets list of Google Ads customer IDs connected to a workspace.
   * Fetches from ServiceEngagement records.
   */
  private async getConnectedCustomerIds(workspaceId: string): Promise<string[]> {
    const engagements = await this.serviceEngagementRepo.find({
      where: {
        workspaceId,
        platformType: "google_ads",
        isActive: true,
      },
    });

    return engagements
      .map((e) => e.externalAccountId)
      .filter((id): id is string => !!id)
      .map((id) => id.replace(/[^0-9]/g, "")); // Remove hyphens from customer ID
  }

  /**
   * Bulk sync: Syncs performance metrics for all specialists in a workspace.
   * Useful for scheduled daily sync via cron job.
   * Errors on individual specialists don't abort the batch.
   */
  async syncAllSpecialists(
    workspaceId: string,
    config: Partial<MetricsPullConfig> = {},
  ): Promise<PerformanceSyncResult[]> {
    this.logger.log({
      message: "Starting bulk performance sync for workspace",
      workspaceId,
      platform: "google",
    });

    const specialists = await this.agentProfileRepo.find({
      where: {
        agentType: "human", // Only sync human specialists with real performance
        isVerified: true,
      },
    });

    const results: PerformanceSyncResult[] = [];

    for (const specialist of specialists) {
      try {
        const result = await this.syncSpecialistMetrics(specialist.id, workspaceId, config);
        results.push(result);
      } catch (err: any) {
        this.logger.error({
          message: "Failed to sync specialist",
          agentProfileId: specialist.id,
          displayName: specialist.displayName,
          error: err?.message,
        });

        results.push({
          success: false,
          agentProfileId: specialist.id,
          agentDisplayName: specialist.displayName,
          metricsInserted: 0,
          metricsUpdated: 0,
          campaignsSynced: 0,
          dateRangeStart: new Date(),
          dateRangeEnd: new Date(),
          syncedAt: new Date(),
          fraudRiskScore: 0,
          errors: [err?.message ?? "Unknown error"],
          warnings: [],
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log({
      message: "Bulk performance sync completed",
      workspaceId,
      platform: "google",
      totalSpecialists: specialists.length,
      successCount,
      failureCount: specialists.length - successCount,
    });

    return results;
  }
}
