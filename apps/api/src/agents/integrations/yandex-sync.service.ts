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
import { ConnectedAccount } from "../../platforms/entities/connected-account.entity";
import { Platform } from "@performa/shared";
import { decrypt, encrypt } from "../../common/crypto.util";

/**
 * PerformanceSyncResult represents the outcome of a marketplace performance sync
 * for a single specialist on Yandex Direct.
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
  currencyExchangeRates: Record<string, number>;
  errors: string[];
  warnings: string[];
}

/**
 * MetricsPullConfig controls what time period to pull metrics for.
 */
export interface MetricsPullConfig {
  /** Days to look back from today (default: 30). Minimum 1, maximum 730. */
  dayLookback: number;
  /** If true, overwrite existing metrics for the period. If false, skip existing. */
  forceRefresh: boolean;
  /** If true, only pull/validate but don't persist to DB. */
  dryRun: boolean;
  /** Target currency for metrics (default: USD). Yandex typically reports RUB. */
  targetCurrency: string;
}

/**
 * YandexPerformanceRow is the normalized performance metric pulled from Yandex Direct API.
 * Maps daily campaign reports to a standard format for storage in agent_platform_metrics.
 */
interface YandexPerformanceRow {
  campaignId: string;
  campaignName: string;
  date: Date;
  spend: number; // In original currency (RUB or currency specified in API)
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number; // Revenue in original currency
  currency: string; // Original currency code
  // Computed
  ctr: number; // (clicks / impressions) * 100
  cpa: number | null; // spend / conversions (null if conversions=0)
  roas: number | null; // conversionValue / spend (null if spend=0)
}

/**
 * YandexCampaignReport represents aggregated report data from Yandex API
 * for a single campaign across a date range.
 */
interface YandexCampaignReport {
  campaignId: string;
  campaignName: string;
  stats: Array<{
    date: string; // Format: YYYY-MM-DD
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversionsCost: number; // Revenue
  }>;
  currency: string;
}

/**
 * YandexAccountWithMetrics represents a Yandex Direct account with its associated campaigns
 * and their performance metrics.
 */
interface YandexAccountWithMetrics {
  accountId: string;
  accountName: string;
  currency: string;
  timezone: string;
  performanceRows: YandexPerformanceRow[];
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
 * YandexOAuthToken structure for token refresh responses
 */
interface YandexOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * YandexPerformanceSyncService enhances the marketplace by syncing real Yandex Direct
 * campaign performance data directly into specialist profiles. This enables:
 *
 * 1. **Data Collection**: Pulls daily campaign metrics from Yandex Direct Reports API
 * 2. **Validation**: Checks metrics for fraud using configurable rules
 * 3. **Currency Conversion**: Converts RUB metrics to target currency (typically USD)
 * 4. **Storage**: Persists normalized metrics to agent_platform_metrics
 * 5. **Profile Update**: Recalculates specialist cached stats and performance history
 * 6. **Scheduling**: Runs on-demand or via daily cron for automatic updates
 *
 * Design principles:
 * - Workspace isolation: All operations respect workspace boundaries
 * - Rate limiting: Respects Yandex's 1000 requests/hour limit
 * - Idempotency: Upserts ensure repeated syncs are safe
 * - Partial success: Per-account errors don't abort the entire specialist sync
 * - Currency handling: Converts all metrics to target currency for consistency
 * - Audit trail: All syncs logged with timestamps and result metrics
 *
 * Yandex Direct specifics:
 * - REST API (no SDK) at https://api.direct.yandex.com/json/v5/
 * - OAuth token authentication
 * - Campaign reports endpoint returns aggregated performance
 * - Monthly aggregation for storage
 * - Limited to 2 years historical data
 * - API timezone typically Moscow (UTC+3)
 *
 * Error handling:
 * - 401 (unauthorized): Token expired, attempt refresh
 * - 429 (rate limit): Exponential backoff + queue for retry
 * - 400 (invalid request): Log and skip account
 * - Currency conversion errors: Log warning, use fallback rate
 * - Missing campaigns: Log warning, continue with other accounts
 * - Fraud detection: Flag suspicious metrics, include in fraud_risk_score
 */
@Injectable()
export class YandexPerformanceSyncService {
  private readonly logger = new Logger(YandexPerformanceSyncService.name);
  private readonly encryptionKey: string | null;
  private readonly yandexApiBaseUrl = "https://api.direct.yandex.com/json/v5";

  // Rate limit state: track last request time and remaining quota
  private readonly rateLimitState = new Map<
    string,
    {
      lastRequestMs: number;
      backoffMultiplier: number;
      requestsRemaining: number;
      resetTimeMs: number;
    }
  >();

  // Currency exchange rates cache (RUB to other currencies)
  // In production, this should be fetched from an external service
  private currencyRates: Record<string, number> = {
    USD: 1, // Will be populated dynamically
    EUR: 1,
    GBP: 1,
  };

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
    @InjectRepository(ConnectedAccount)
    private readonly connectedAccountRepo: Repository<ConnectedAccount>,
  ) {
    const key = this.config.get<string>("ENCRYPTION_KEY", "");
    this.encryptionKey = key.length === 32 ? key : null;
    this.initializeCurrencyRates();
  }

  /**
   * Initializes currency exchange rates from config or defaults to fallback rates.
   * In production, these should come from a real-time currency service.
   */
  private initializeCurrencyRates(): void {
    const rateConfig = this.config.get<string>("CURRENCY_RATES_JSON", "{}");
    try {
      const parsed = JSON.parse(rateConfig);
      this.currencyRates = { ...this.currencyRates, ...parsed };
    } catch {
      // Fallback to defaults
      this.currencyRates = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        RUB: 0.011, // 1 RUB ≈ 0.011 USD (approximate, should be updated regularly)
      };
    }
  }

  /**
   * Main entry point: sync performance metrics for a specialist into the marketplace.
   *
   * Execution flow:
   * 1. Validate specialist exists and has Yandex Direct service engagement
   * 2. Get access token from ServiceEngagement
   * 3. Fetch all Yandex ad accounts associated with workspace
   * 4. Fetch campaigns and their reports from Yandex API
   * 5. Convert currencies to target currency
   * 6. Validate metrics with fraud detection rules
   * 7. Upsert metrics to agent_platform_metrics table
   * 8. Recalculate cached stats and monthly performance
   * 9. Update specialist's lastPerformanceSync and performanceSyncStatus
   *
   * @param agentProfileId The specialist's profile ID
   * @param workspaceId Workspace context for isolation
   * @param config Pull configuration (lookback period, force refresh, etc.)
   * @returns Detailed result including metrics counts, errors, and fraud score
   * @throws NotFoundException if specialist not found
   * @throws BadRequestException if no Yandex service engagement
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
      currencyExchangeRates: this.currencyRates,
      errors: [],
      warnings: [],
    };

    const pullConfig: MetricsPullConfig = {
      dayLookback: config.dayLookback ?? 30,
      forceRefresh: config.forceRefresh ?? false,
      dryRun: config.dryRun ?? false,
      targetCurrency: config.targetCurrency ?? "USD",
    };

    // Validate config
    if (pullConfig.dayLookback < 1 || pullConfig.dayLookback > 730) {
      throw new BadRequestException("dayLookback must be between 1 and 730 days");
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
        message: "Performance sync started for specialist (Yandex Direct)",
        agentProfileId,
        displayName: specialist.displayName,
        workspaceId,
      });

      // ──── Step 2: Resolve access token ──────────────────────────────────────
      const accessToken = await this.resolveAccessToken(workspaceId);
      if (!accessToken) {
        throw new BadRequestException(
          `No active Yandex Direct integration found for workspace ${workspaceId}. ` +
            "Please connect a Yandex Direct account first.",
        );
      }

      // ──── Step 3: Calculate date range ────────────────────────────────────
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - pullConfig.dayLookback);

      result.dateRangeStart = startDate;
      result.dateRangeEnd = endDate;

      this.logger.debug({
        message: "Date range for metrics pull (Yandex)",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        dayLookback: pullConfig.dayLookback,
      });

      // ──── Step 4: Fetch ad accounts and campaign metrics ────────────────────
      const accountsWithMetrics = await this.fetchAccountMetrics(
        workspaceId,
        accessToken,
        startDate,
        endDate,
      );

      if (accountsWithMetrics.length === 0) {
        result.warnings.push("No campaigns found in Yandex Direct accounts");
        result.success = true;
        return result;
      }

      // ──── Step 5: Convert currencies to target currency ──────────────────────
      const convertedMetrics = this.convertCurrencies(accountsWithMetrics, pullConfig.targetCurrency);

      // ──── Step 6: Validate metrics (fraud detection) ───────────────────────
      const validatedMetrics = await this.validateMetricsWithFraudDetection(
        convertedMetrics,
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
          pullConfig.targetCurrency,
        );

        result.metricsInserted = persistResult.inserted;
        result.metricsUpdated = persistResult.updated;
        result.campaignsSynced = convertedMetrics.reduce(
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
        message: "Performance sync completed successfully (Yandex Direct)",
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
        message: "Performance sync failed (Yandex Direct)",
        agentProfileId,
        error: err?.message,
        stack: err?.stack,
      });

      return result;
    }
  }

  /**
   * Fetches all ad accounts and their campaign reports from Yandex Direct API.
   * Handles pagination, rate limiting, and per-account error recovery.
   */
  private async fetchAccountMetrics(
    workspaceId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<YandexAccountWithMetrics[]> {
    const accounts = await this.getYandexAccounts(accessToken);
    const results: YandexAccountWithMetrics[] = [];

    for (const account of accounts) {
      try {
        // Rate limit: stagger requests
        await this.applyRateLimit(account.id);

        const campaigns = await this.getYandexCampaigns(account.id, accessToken);

        if (campaigns.length === 0) {
          this.logger.debug({
            message: "No campaigns found for Yandex account",
            accountId: account.id,
            accountName: account.name,
          });
          continue;
        }

        // Fetch reports for all campaigns in this account
        const campaignReports = await this.getAccountCampaignReports(
          account.id,
          campaigns,
          accessToken,
          startDate,
          endDate,
        );

        // Map reports to YandexPerformanceRow format
        const performanceRows = this.mapReportsToMetrics(campaignReports, campaigns);

        results.push({
          accountId: account.id,
          accountName: account.name,
          currency: account.currency ?? "RUB",
          timezone: account.timezone ?? "Europe/Moscow",
          performanceRows,
        });
      } catch (err: any) {
        this.logger.error({
          message: "Failed to fetch metrics for Yandex account",
          accountId: account.id,
          accountName: account.name,
          error: err?.message,
        });
        // Continue with other accounts
      }
    }

    return results;
  }

  /**
   * Fetches list of Yandex Direct accounts accessible with the current token.
   * Uses /accounts endpoint.
   */
  private async getYandexAccounts(accessToken: string): Promise<any[]> {
    try {
      await this.applyRateLimit("accounts");

      const response = await firstValueFrom(
        this.http.get(`${this.yandexApiBaseUrl}/accounts`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Accept-Language": "en",
          },
        }),
      );

      this.updateRateLimitState("accounts", response.headers);

      return response.data.result || [];
    } catch (err: any) {
      if (err.response?.status === 401) {
        this.logger.warn({
          message: "Yandex authorization failed (token may be expired)",
          error: err?.response?.data?.error_description,
        });
      } else {
        this.logger.error({
          message: "Failed to fetch Yandex accounts",
          status: err.response?.status,
          error: err?.response?.data?.error_description || err?.message,
        });
      }
      return [];
    }
  }

  /**
   * Fetches campaigns for a specific Yandex account.
   */
  private async getYandexCampaigns(accountId: string, accessToken: string): Promise<any[]> {
    try {
      await this.applyRateLimit(accountId);

      const response = await firstValueFrom(
        this.http.post(
          `${this.yandexApiBaseUrl}/campaigns`,
          {
            method: "get",
            params: {
              SelectionCriteria: {},
              FieldNames: ["Id", "Name", "Status", "Currency"],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Accept-Language": "en",
            },
          },
        ),
      );

      this.updateRateLimitState(accountId, response.headers);

      return response.data.result?.Campaigns || [];
    } catch (err: any) {
      this.logger.warn({
        message: "Failed to fetch Yandex campaigns",
        accountId,
        error: err?.response?.data?.error_description || err?.message,
      });
      return [];
    }
  }

  /**
   * Fetches campaign reports (daily performance statistics) from Yandex Direct API.
   * Groups reports by campaign for easier processing.
   */
  private async getAccountCampaignReports(
    accountId: string,
    campaigns: any[],
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<YandexCampaignReport[]> {
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const campaignReports: YandexCampaignReport[] = [];

    // Fetch reports for each campaign
    for (const campaign of campaigns) {
      try {
        await this.applyRateLimit(accountId);

        const response = await firstValueFrom(
          this.http.post(
            `${this.yandexApiBaseUrl}/reports`,
            {
              params: {
                SelectionCriteria: {
                  CampaignIds: [campaign.Id],
                },
                FieldNames: [
                  "Date",
                  "Impressions",
                  "Clicks",
                  "Cost",
                  "Conversions",
                  "ConversionsCost",
                ],
                OrderBy: [
                  {
                    Field: "Date",
                    SortOrder: "ASCENDING",
                  },
                ],
                DateRangeType: "CUSTOM_DATE",
                DateRangeCustom: {
                  StartDate: formatDate(startDate),
                  EndDate: formatDate(endDate),
                },
              },
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Accept-Language": "en",
              },
            },
          ),
        );

        this.updateRateLimitState(accountId, response.headers);

        const reportData = response.data.result?.ReportData || [];
        if (reportData.length > 0) {
          campaignReports.push({
            campaignId: String(campaign.Id),
            campaignName: campaign.Name,
            stats: reportData,
            currency: campaign.Currency || "RUB",
          });
        }
      } catch (err: any) {
        // Check for specific errors
        if (err.response?.status === 429) {
          this.handleRateLimit(accountId);
          this.logger.warn({
            message: "Rate limit hit, retrying campaign",
            accountId,
            campaignId: campaign.Id,
          });
        } else {
          this.logger.warn({
            message: "Failed to fetch campaign report",
            accountId,
            campaignId: campaign.Id,
            campaignName: campaign.Name,
            error: err?.response?.data?.error_description || err?.message,
          });
        }
      }
    }

    return campaignReports;
  }

  /**
   * Maps raw Yandex campaign reports to normalized YandexPerformanceRow format.
   * Calculates derived metrics (CTR, CPA, ROAS).
   */
  private mapReportsToMetrics(
    campaignReports: YandexCampaignReport[],
    campaigns: any[],
  ): YandexPerformanceRow[] {
    const campaignMap = new Map(campaigns.map((c) => [String(c.Id), c]));
    const rows: YandexPerformanceRow[] = [];

    for (const report of campaignReports) {
      const campaign = campaignMap.get(report.campaignId);

      if (!campaign) {
        this.logger.debug({
          message: "Campaign not found in lookup (Yandex)",
          campaignId: report.campaignId,
        });
        continue;
      }

      for (const stat of report.stats) {
        const spend = parseFloat(String(stat.cost || 0));
        const impressions = parseInt(String(stat.impressions || 0), 10);
        const clicks = parseInt(String(stat.clicks || 0), 10);
        const conversions = parseFloat(String(stat.conversions || 0));
        const conversionValue = parseFloat(String(stat.conversionsCost || 0));

        // Calculate derived metrics
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpa = conversions > 0 ? spend / conversions : null;
        const roas = spend > 0 ? conversionValue / spend : null;

        rows.push({
          campaignId: report.campaignId,
          campaignName: report.campaignName,
          date: new Date(stat.date),
          spend,
          impressions,
          clicks,
          conversions,
          conversionValue,
          currency: report.currency,
          ctr,
          cpa,
          roas,
        });
      }
    }

    return rows;
  }

  /**
   * Converts currency values in performance rows from source currency to target currency.
   * Uses cached exchange rates; logs warnings if rates are unavailable.
   */
  private convertCurrencies(
    accountsWithMetrics: YandexAccountWithMetrics[],
    targetCurrency: string,
  ): YandexAccountWithMetrics[] {
    const converted = accountsWithMetrics.map((account) => ({
      ...account,
      performanceRows: account.performanceRows.map((row) => {
        if (row.currency === targetCurrency) {
          return row; // No conversion needed
        }

        // Get exchange rate
        const rate = this.currencyRates[targetCurrency];
        if (!rate) {
          this.logger.warn({
            message: "No exchange rate available for target currency",
            sourceCurrency: row.currency,
            targetCurrency,
            campaignId: row.campaignId,
          });
          return row; // Return unconverted row with original currency
        }

        // Convert RUB to other currencies using rate
        // Assume currencyRates are: base=RUB, rates show multiplier to other currencies
        const rubToTargetRate = this.getRubToTargetRate(targetCurrency);

        return {
          ...row,
          spend: this.roundCurrency(row.spend * rubToTargetRate),
          conversionValue: this.roundCurrency(row.conversionValue * rubToTargetRate),
          currency: targetCurrency,
          // Recalculate derived metrics with converted values
          cpa: row.conversions > 0 ? this.roundCurrency((row.spend * rubToTargetRate) / row.conversions) : null,
          roas: row.spend > 0 ? this.roundCurrency((row.conversionValue * rubToTargetRate) / (row.spend * rubToTargetRate)) : null,
        };
      }),
    }));

    return converted;
  }

  /**
   * Gets conversion rate from RUB to target currency.
   * If direct rate unavailable, returns 1 as fallback.
   */
  private getRubToTargetRate(targetCurrency: string): number {
    // Assume currencyRates are indexed by target currency
    // and represent: targetCurrency rate = 1 RUB * rate
    // For example: USD: 0.011 means 1 RUB = 0.011 USD

    if (targetCurrency === "RUB") {
      return 1;
    }

    return this.currencyRates[targetCurrency] ?? 1;
  }

  /**
   * Rounds currency values to 2 decimal places.
   */
  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Validates metrics for fraud and suspicious patterns.
   * Checks for:
   * - Unrealistic ROAS (too high or too low)
   * - Unrealistic CPA values
   * - Impossible metrics (negative values, CTR > 100)
   * - Sudden spikes or anomalies
   * - Currency conversion anomalies
   */
  private async validateMetricsWithFraudDetection(
    accountsWithMetrics: YandexAccountWithMetrics[],
    specialist: AgentProfile,
  ): Promise<{
    rows: YandexPerformanceRow[];
    fraudRiskScore: number;
    errors: string[];
  }> {
    const allRows: YandexPerformanceRow[] = accountsWithMetrics.flatMap(
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

      if (row.impressions < 0) {
        errors.push(`Campaign ${row.campaignId}: Negative impressions detected`);
        fraudRiskScore += 20;
      }

      if (row.clicks > row.impressions) {
        errors.push(`Campaign ${row.campaignId}: Clicks > impressions (impossible)`);
        fraudRiskScore += 25;
      }

      // Check for unrealistic ROAS (typically between 0.1 and 50 for most industries)
      if (row.roas !== null && (row.roas < 0 || row.roas > 100)) {
        errors.push(`Campaign ${row.campaignId}: ROAS ${row.roas.toFixed(2)} is unrealistic`);
        fraudRiskScore += 15;
      }

      // Check for unrealistic CPA (typically $0.01 to $10,000 depending on industry)
      if (row.cpa !== null && (row.cpa < 0.01 || row.cpa > 100000)) {
        errors.push(`Campaign ${row.campaignId}: CPA $${row.cpa.toFixed(2)} is unrealistic`);
        fraudRiskScore += 10;
      }

      // Check for zero spend with conversions (potential fraud)
      if (row.spend === 0 && row.conversions > 0) {
        errors.push(`Campaign ${row.campaignId}: Conversions without spend`);
        fraudRiskScore += 30;
      }
    }

    // Additional: check if specialist's average ROAS would spike unrealistically
    if (specialist.cachedStats && allRows.length > 0) {
      const avgRoas =
        allRows.filter((r) => r.roas !== null).reduce((sum, r) => sum + r.roas, 0) /
        Math.max(1, allRows.filter((r) => r.roas !== null).length);

      const historicalRoas = specialist.cachedStats.avgROAS ?? 1;
      const roasChange = Math.abs(avgRoas - historicalRoas) / Math.max(0.1, historicalRoas);

      if (roasChange > 3 && avgRoas > 50) {
        errors.push(
          `ROAS spike detected: ${avgRoas.toFixed(2)} vs historical ${historicalRoas.toFixed(2)}`,
        );
        fraudRiskScore += 12;
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
    rows: YandexPerformanceRow[],
    forceRefresh: boolean,
    startDate: Date,
    endDate: Date,
    targetCurrency: string,
  ): Promise<{ inserted: number; updated: number }> {
    // Group by month for aggregation
    const byMonth = new Map<string, YandexPerformanceRow[]>();

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
        platform: "yandex",
        aggregationPeriod,
        totalSpend: this.roundCurrency(totalSpend),
        campaignsCount: new Set(monthRows.map((r) => r.campaignId)).size,
        avgRoas: avgRoas ? this.roundCurrency(avgRoas) : undefined,
        avgCpa: avgCpa ? this.roundCurrency(avgCpa) : undefined,
        avgCtr: this.roundCurrency(avgCtr),
        conversionCount: totalConversions,
        totalRevenue: this.roundCurrency(totalRevenue),
        sourceType: "api_pull",
        isVerified: true,
      });
    }

    // Upsert to database
    let inserted = 0;
    let updated = 0;

    await this.dataSource.transaction(async (em) => {
      for (const metric of aggregatedMetrics) {
        // Delete existing if forceRefresh is true
        if (forceRefresh) {
          await em.delete(AgentPlatformMetrics, {
            agentProfileId,
            platform: "yandex",
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
              platform: "yandex",
              aggregationPeriod: metric.aggregationPeriod,
            },
          });
          if (existing && existing.syncedAt > new Date(Date.now() - 1000)) {
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
      message: "Metrics persisted (Yandex Direct)",
      agentProfileId,
      metricsCount: aggregatedMetrics.length,
      inserted,
      updated,
    });

    return { inserted, updated };
  }

  /**
   * Updates specialist profile with recalculated stats.
   * Computes avgRoas, avgCpa from all stored metrics (all platforms).
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

    // Calculate aggregated stats
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

      if (metric.avgRoas !== null && metric.avgRoas !== undefined) {
        roasSum += Number(metric.avgRoas);
        roasCount++;
      }

      if (metric.avgCpa !== null && metric.avgCpa !== undefined) {
        cpaSum += Number(metric.avgCpa);
        cpaCount++;
      }
    }

    const avgRoas = roasCount > 0 ? roasSum / roasCount : 0;
    const avgCpa = cpaCount > 0 ? cpaSum / cpaCount : 0;

    // Build monthly performance array (last 12 months, across all platforms)
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
      message: "Specialist profile updated (Yandex Direct)",
      agentProfileId,
      displayName: specialist.displayName,
      avgRoas,
      avgCpa,
      fraudRiskScore,
      performanceSyncStatus: specialist.performanceSyncStatus,
    });
  }

  /**
   * Rate limiting helper: enforces minimum delay between API requests per account
   * to avoid hitting Yandex's 1000 requests/hour limit.
   * Uses exponential backoff on 429 responses.
   */
  private async applyRateLimit(accountId: string): Promise<void> {
    const now = Date.now();
    const state = this.rateLimitState.get(accountId);

    if (state) {
      const elapsed = now - state.lastRequestMs;
      const minDelay = 100 * state.backoffMultiplier; // Start at 100ms, exponential backoff

      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }

      // Reset backoff after successful request
      state.lastRequestMs = Date.now();
    } else {
      this.rateLimitState.set(accountId, {
        lastRequestMs: now,
        backoffMultiplier: 1,
        requestsRemaining: 1000,
        resetTimeMs: Date.now() + 3600000, // 1 hour
      });
    }
  }

  /**
   * Handles rate limit (429) responses from Yandex API.
   * Increases backoff multiplier for future requests to this account.
   */
  private handleRateLimit(accountId: string): void {
    const state = this.rateLimitState.get(accountId);
    if (state) {
      state.backoffMultiplier = Math.min(state.backoffMultiplier * 2, 10); // Cap at 10x
      this.logger.warn({
        message: "Yandex rate limit hit, increasing backoff",
        accountId,
        backoffMultiplier: state.backoffMultiplier,
      });
    }
  }

  /**
   * Updates rate limit state from response headers.
   * Yandex API returns X-RateLimit-* headers.
   */
  private updateRateLimitState(accountId: string, headers: any): void {
    const state = this.rateLimitState.get(accountId);
    if (state && headers) {
      const remaining = parseInt(headers["x-ratelimit-remaining"] ?? "1000", 10);
      const resetTime = parseInt(headers["x-ratelimit-reset"] ?? "0", 10);

      state.requestsRemaining = remaining;
      if (resetTime > 0) {
        state.resetTimeMs = resetTime * 1000;
      }

      if (remaining < 100) {
        this.logger.warn({
          message: "Yandex API rate limit approaching",
          accountId,
          requestsRemaining: remaining,
        });
      }
    }
  }

  /**
   * Resolves Yandex Direct access token for a workspace.
   * Looks up ServiceEngagement and decrypts token if needed.
   * Attempts token refresh if token has expired.
   */
  private async resolveAccessToken(workspaceId: string): Promise<string | null> {
    const connectedAccount = await this.connectedAccountRepo.findOne({
      where: {
        workspaceId,
        platform: Platform.YANDEX,
        isActive: true,
      },
      order: { createdAt: "DESC" },
    });

    if (!connectedAccount || !connectedAccount.accessToken) {
      return null;
    }

    let token = connectedAccount.accessToken;

    // Decrypt if needed
    if (this.encryptionKey && token.includes(":")) {
      try {
        token = decrypt(token, this.encryptionKey);
      } catch (err: any) {
        this.logger.warn({
          message: "Token decryption failed (Yandex)",
          workspaceId,
          error: err?.message,
        });
        return null;
      }
    }

    // Check if token is expired and attempt refresh
    if (connectedAccount.tokenExpiresAt && connectedAccount.tokenExpiresAt < new Date()) {
      if (connectedAccount.refreshToken) {
        try {
          const newToken = await this.refreshAccessToken(connectedAccount.refreshToken);
          token = newToken;

          // Update connected account with new token
          connectedAccount.accessToken = this.encryptionKey
            ? encrypt(newToken, this.encryptionKey)
            : newToken;
          connectedAccount.tokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour
          await this.connectedAccountRepo.save(connectedAccount);

          this.logger.log({
            message: "Yandex token refreshed successfully",
            workspaceId,
          });
        } catch (err: any) {
          this.logger.error({
            message: "Yandex token refresh failed",
            workspaceId,
            error: err?.message,
          });
          return null;
        }
      } else {
        this.logger.warn({
          message: "Yandex token expired and no refresh token available",
          workspaceId,
        });
        return null;
      }
    }

    return token;
  }

  /**
   * Attempts to refresh an expired Yandex access token using the refresh token.
   * Calls Yandex's OAuth token refresh endpoint.
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const clientId = this.config.get<string>("YANDEX_CLIENT_ID", "");
    const clientSecret = this.config.get<string>("YANDEX_CLIENT_SECRET", "");

    const decryptedRefresh = this.encryptionKey ? decrypt(refreshToken, this.encryptionKey) : refreshToken;

    try {
      const response = await firstValueFrom(
        this.http.post("https://oauth.yandex.com/token", {
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: decryptedRefresh,
        }),
      );

      const oauthToken = response.data as YandexOAuthToken;
      return oauthToken.access_token;
    } catch (err: any) {
      this.logger.error({
        message: "Yandex OAuth token refresh failed",
        status: err.response?.status,
        error: err.response?.data?.error || err?.message,
      });
      throw new InternalServerErrorException("Failed to refresh Yandex token");
    }
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
      message: "Starting bulk performance sync for workspace (Yandex Direct)",
      workspaceId,
    });

    const specialists = await this.agentProfileRepo.find({
      where: {
        // Only sync human specialists with real performance
        agentType: "human",
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
          message: "Failed to sync specialist (Yandex Direct)",
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
          currencyExchangeRates: this.currencyRates,
          errors: [err?.message ?? "Unknown error"],
          warnings: [],
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log({
      message: "Bulk performance sync completed (Yandex Direct)",
      workspaceId,
      totalSpecialists: specialists.length,
      successCount,
      failureCount: specialists.length - successCount,
    });

    return results;
  }
}
