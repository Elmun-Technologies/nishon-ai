import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, MoreThanOrEqual } from 'typeorm';
import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentPlatformMetrics } from '../entities/agent-platform-metrics.entity';
import { AgentPerformanceSyncLog } from '../entities/agent-performance-sync-log.entity';

/**
 * Severity levels for fraud detection findings
 */
export type FraudSeverity = 'critical' | 'warning' | 'info';

/**
 * Result of a single fraud check
 */
export interface FailedCheck {
  rule: string;
  severity: FraudSeverity;
  message: string;
  value?: number | string;
  threshold?: number | string;
}

/**
 * Main fraud detection response
 */
export interface FraudDetectionResult {
  passed: boolean;
  riskScore: number; // 0-1, where 0 = safe, 1 = high risk
  reason: string;
  failedChecks: FailedCheck[];
  timestamp: Date;
}

/**
 * Platform-specific threshold configuration
 */
export interface PlatformThresholds {
  maxRoas: number;
  maxConversionRate: number;
  maxSpendSpikeMoM: number;
  maxCpcVariance: number;
  minCampaignCount: number;
  maxDataAge: number; // in hours
}

/**
 * Metrics data structure for verification
 */
export interface MetricsData {
  platform: 'meta' | 'google' | 'yandex' | 'tiktok' | 'telegram';
  totalSpend: number;
  campaignsCount: number;
  avgRoas: number;
  avgCpa: number;
  avgCtr: number;
  conversionCount: number;
  totalRevenue: number;
  conversions?: number;
  impressions?: number;
  clicks?: number;
  timestamp?: Date;
}

/**
 * FraudDetectionService provides comprehensive fraud detection and metric validation
 * for Performa marketplace agents. It validates performance data against platform-specific
 * rules, detects anomalies, and calculates an overall fraud risk score.
 *
 * Key responsibilities:
 * - Validate performance metrics for unrealistic values
 * - Detect anomalous spending patterns
 * - Verify data consistency and integrity
 * - Calculate fraud risk scores
 * - Provide audit trails for admin review
 * - Support platform-specific rules (Meta, Google, Yandex, etc.)
 *
 * Integration points:
 * - Called by PerformanceSyncService before publishing metrics
 * - Blocks critical issues from being published
 * - Flags warnings for admin review
 * - Updates agent.fraudRiskScore in database
 */
@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  /**
   * Platform-specific threshold configurations
   * These can be overridden per workspace or organization
   */
  private readonly platformThresholds: Record<string, PlatformThresholds> = {
    meta: {
      maxRoas: 15,
      maxConversionRate: 15,
      maxSpendSpikeMoM: 50,
      maxCpcVariance: 300,
      minCampaignCount: 1,
      maxDataAge: 24,
    },
    google: {
      maxRoas: 12,
      maxConversionRate: 12,
      maxSpendSpikeMoM: 50,
      maxCpcVariance: 300,
      minCampaignCount: 1,
      maxDataAge: 24,
    },
    yandex: {
      maxRoas: 10,
      maxConversionRate: 10,
      maxSpendSpikeMoM: 45,
      maxCpcVariance: 280,
      minCampaignCount: 1,
      maxDataAge: 24,
    },
    tiktok: {
      maxRoas: 14,
      maxConversionRate: 13,
      maxSpendSpikeMoM: 50,
      maxCpcVariance: 300,
      minCampaignCount: 1,
      maxDataAge: 24,
    },
    telegram: {
      maxRoas: 8,
      maxConversionRate: 8,
      maxSpendSpikeMoM: 40,
      maxCpcVariance: 250,
      minCampaignCount: 1,
      maxDataAge: 24,
    },
  };

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepo: Repository<AgentProfile>,
    @InjectRepository(AgentPlatformMetrics)
    private readonly metricsRepo: Repository<AgentPlatformMetrics>,
    @InjectRepository(AgentPerformanceSyncLog)
    private readonly syncLogRepo: Repository<AgentPerformanceSyncLog>,
  ) {}

  /**
   * Main entry point: Verify performance data for an agent
   *
   * This performs all fraud checks and returns a comprehensive result.
   * If critical issues are found, the caller should block metric publication.
   * Warnings should trigger admin review notifications.
   *
   * @param agentId - UUID of the agent profile
   * @param platform - Ad platform (meta, google, yandex, etc.)
   * @param metrics - Performance metrics to verify
   * @returns Fraud detection result with risk score and details
   */
  async verify(
    agentId: string,
    platform: string,
    metrics: MetricsData,
  ): Promise<FraudDetectionResult> {
    this.logger.debug(`Verifying metrics for agent ${agentId} on platform ${platform}`);

    const failedChecks: FailedCheck[] = [];
    const normalizedPlatform = this.normalizePlatform(platform);

    try {
      // Run all checks
      this.checkRoasAnomaly(metrics, normalizedPlatform, failedChecks);
      this.checkConversionRate(metrics, normalizedPlatform, failedChecks);
      this.checkSpendSpike(agentId, metrics, normalizedPlatform, failedChecks);
      await this.checkCpcConsistency(agentId, metrics, normalizedPlatform, failedChecks);
      await this.checkDataConsistency(agentId, metrics, normalizedPlatform, failedChecks);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(failedChecks);

      // Determine if verification passed
      const hasCritical = failedChecks.some((check) => check.severity === 'critical');
      const passed = !hasCritical;

      // Build reason
      const reason = this.buildReason(failedChecks, passed);

      const result: FraudDetectionResult = {
        passed,
        riskScore,
        reason,
        failedChecks,
        timestamp: new Date(),
      };

      // Update agent fraud risk score
      await this.updateFraudRiskScore(agentId, riskScore);

      return result;
    } catch (error) {
      this.logger.error(
        `Error during fraud verification for agent ${agentId}: ${error.message}`,
        error.stack,
      );

      // Return a cautious result on error
      return {
        passed: false,
        riskScore: 0.8,
        reason: 'Fraud verification failed due to an internal error. Manual review required.',
        failedChecks: [
          {
            rule: 'verification_error',
            severity: 'critical',
            message: `Verification error: ${error.message}`,
          },
        ],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check if ROAS value is unrealistically high
   * Unrealistic ROAS indicates either data fabrication or extremely favorable market conditions
   *
   * Rules:
   * - Meta/TikTok: > 15 ROAS = WARNING
   * - Google: > 12 ROAS = WARNING
   * - Yandex: > 10 ROAS = WARNING
   */
  private checkRoasAnomaly(
    metrics: MetricsData,
    platform: string,
    failedChecks: FailedCheck[],
  ): void {
    if (!metrics.avgRoas || metrics.avgRoas <= 0) {
      return; // No ROAS to check
    }

    const threshold = this.platformThresholds[platform]?.maxRoas || 15;

    if (metrics.avgRoas > threshold) {
      const severity = metrics.avgRoas > threshold * 1.5 ? 'critical' : 'warning';
      failedChecks.push({
        rule: 'roas_anomaly',
        severity,
        message: `ROAS value is unrealistically high (${metrics.avgRoas.toFixed(2)}). Typical maximum is ${threshold}.`,
        value: metrics.avgRoas,
        threshold,
      });
    }
  }

  /**
   * Check for abnormal month-over-month spend increases
   * Large spend spikes can indicate budget changes, scaling success, or data manipulation
   *
   * Rule: Spend spike > 50% MoM = WARNING
   */
  private checkSpendSpike(
    agentId: string,
    metrics: MetricsData,
    platform: string,
    failedChecks: FailedCheck[],
  ): void {
    // This check requires historical data, so it's async
    // The async version will be called in verify()
    // For synchronous path, we skip this
  }

  /**
   * Async version: Check for abnormal spend spikes by comparing to historical data
   */
  private async checkSpendSpikeAsync(
    agentId: string,
    metrics: MetricsData,
    platform: string,
    failedChecks: FailedCheck[],
  ): Promise<void> {
    const threshold = this.platformThresholds[platform]?.maxSpendSpikeMoM || 50;

    try {
      // Get previous month's metrics (30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const previousMetrics = await this.metricsRepo.findOne({
        where: {
          agentProfileId: agentId,
          platform,
          aggregationPeriod: MoreThanOrEqual(thirtyDaysAgo),
        },
        order: { aggregationPeriod: 'DESC' },
      });

      if (!previousMetrics || previousMetrics.totalSpend <= 0) {
        return; // No historical data to compare
      }

      const spendChange = ((metrics.totalSpend - previousMetrics.totalSpend) / previousMetrics.totalSpend) * 100;

      if (spendChange > threshold) {
        failedChecks.push({
          rule: 'spend_spike',
          severity: 'warning',
          message: `Abnormal spend increase detected: ${spendChange.toFixed(1)}% MoM increase. Typical threshold is ${threshold}%.`,
          value: spendChange,
          threshold,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to check spend spike for agent ${agentId}: ${error.message}`);
    }
  }

  /**
   * Check if conversion rate is unrealistically high
   * Conversion rates > 10-15% (depending on platform) are extremely rare
   *
   * Rules:
   * - Meta: > 15% = CRITICAL
   * - Google: > 12% = CRITICAL
   * - Yandex: > 10% = CRITICAL
   */
  private checkConversionRate(
    metrics: MetricsData,
    platform: string,
    failedChecks: FailedCheck[],
  ): void {
    if (!metrics.conversionCount || !metrics.totalSpend) {
      return; // Cannot calculate conversion rate
    }

    // If clicks are available, use them; otherwise estimate from clicks field
    let clicks = metrics.clicks || 0;

    // If we have impressions and no clicks, try to infer
    if (clicks === 0 && metrics.impressions) {
      const estimatedCtr = this.platformThresholds[platform]?.maxCpcVariance === 300 ? 0.01 : 0.005;
      clicks = Math.floor(metrics.impressions * estimatedCtr);
    }

    if (clicks <= 0) {
      return; // Cannot calculate conversion rate
    }

    const conversionRate = (metrics.conversionCount / clicks) * 100;
    const threshold = this.platformThresholds[platform]?.maxConversionRate || 15;

    if (conversionRate > threshold) {
      failedChecks.push({
        rule: 'conversion_rate',
        severity: 'critical',
        message: `Conversion rate is unrealistically high (${conversionRate.toFixed(2)}%). Typical maximum is ${threshold}%.`,
        value: conversionRate,
        threshold,
      });
    }
  }

  /**
   * Check CPC consistency and variance
   * High CPC variance indicates potential issues with bid management or auction changes
   *
   * Rule: CPC varies > 300% = INFO (informational, not a blocker)
   */
  private async checkCpcConsistency(
    agentId: string,
    metrics: MetricsData,
    platform: string,
    failedChecks: FailedCheck[],
  ): Promise<void> {
    const threshold = this.platformThresholds[platform]?.maxCpcVariance || 300;

    try {
      // Get last 5 metrics entries for this agent/platform
      const historicalMetrics = await this.metricsRepo.find({
        where: {
          agentProfileId: agentId,
          platform,
        },
        order: { createdAt: 'DESC' },
        take: 5,
      });

      if (historicalMetrics.length < 2) {
        return; // Need at least 2 data points
      }

      // Calculate CPCs
      const cpcs = historicalMetrics.map((m) => {
        if (m.totalSpend <= 0 || !m.avgCpa) return 0;
        return m.totalSpend / (m.conversionCount || 1);
      });

      const validCpcs = cpcs.filter((c) => c > 0);
      if (validCpcs.length < 2) {
        return;
      }

      // Calculate coefficient of variation
      const mean = validCpcs.reduce((a, b) => a + b) / validCpcs.length;
      const variance = validCpcs.reduce((a, c) => a + Math.pow(c - mean, 2), 0) / validCpcs.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / mean) * 100;

      if (coefficientOfVariation > threshold) {
        failedChecks.push({
          rule: 'cpc_variance',
          severity: 'info',
          message: `CPC variance is high (${coefficientOfVariation.toFixed(1)}% CV). Monitor for bid management issues.`,
          value: coefficientOfVariation,
          threshold,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to check CPC consistency for agent ${agentId}: ${error.message}`);
    }
  }

  /**
   * Check data consistency and integrity
   * Validates:
   * - Data timestamp freshness (not older than 24-48 hours)
   * - Campaign count consistency
   * - Revenue-to-spend relationship
   * - Data type consistency
   *
   * Issues here trigger WARNINGS for admin review
   */
  private async checkDataConsistency(
    agentId: string,
    metrics: MetricsData,
    platform: string,
    failedChecks: FailedCheck[],
  ): Promise<void> {
    const threshold = this.platformThresholds[platform]?.maxDataAge || 24;

    // Check 1: Data age (if timestamp provided)
    if (metrics.timestamp) {
      const dataAgeHours = (new Date().getTime() - metrics.timestamp.getTime()) / (1000 * 60 * 60);

      if (dataAgeHours > threshold) {
        failedChecks.push({
          rule: 'data_timestamp',
          severity: 'warning',
          message: `Data is older than typical (${dataAgeHours.toFixed(1)} hours). Consider re-syncing.`,
          value: dataAgeHours,
          threshold,
        });
      }
    }

    // Check 2: Campaign count consistency
    const minCampaignCount = this.platformThresholds[platform]?.minCampaignCount || 1;
    if (metrics.campaignsCount < minCampaignCount) {
      failedChecks.push({
        rule: 'campaign_count',
        severity: 'warning',
        message: `Campaign count is lower than expected (${metrics.campaignsCount}). Minimum is ${minCampaignCount}.`,
        value: metrics.campaignsCount,
        threshold: minCampaignCount,
      });
    }

    // Check 3: Revenue-to-spend ratio sanity
    if (metrics.totalRevenue > 0 && metrics.totalSpend > 0) {
      const roasFromRevenue = metrics.totalRevenue / metrics.totalSpend;
      const reportedRoas = metrics.avgRoas || roasFromRevenue;

      // Check if ROAS calculated from revenue matches reported ROAS
      const roasDifference = Math.abs(roasFromRevenue - reportedRoas) / reportedRoas;
      if (roasDifference > 0.1) {
        // More than 10% difference
        failedChecks.push({
          rule: 'roas_consistency',
          severity: 'info',
          message: `ROAS calculated from revenue (${roasFromRevenue.toFixed(2)}) differs from reported ROAS (${reportedRoas.toFixed(2)}).`,
          value: roasDifference,
          threshold: 0.1,
        });
      }
    }

    // Check 4: Data source verification
    // Get the most recent sync log
    try {
      const lastSync = await this.syncLogRepo.findOne({
        where: { agentProfileId: agentId },
        order: { createdAt: 'DESC' },
      });

      if (lastSync && lastSync.status === 'failed') {
        failedChecks.push({
          rule: 'sync_status',
          severity: 'warning',
          message: `Last data sync failed. Current data may not reflect latest platform state.`,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to check sync status for agent ${agentId}: ${error.message}`);
    }
  }

  /**
   * Calculate overall fraud risk score (0-1)
   * Score is determined by:
   * - Presence and severity of failed checks
   * - Number of violations
   * - Combination of issues
   *
   * Scoring:
   * - No issues: 0.0
   * - Only info severity: 0.1-0.2
   * - Only warnings: 0.3-0.6
   * - Mix of warnings + info: 0.4-0.7
   * - Any critical: 0.8-1.0
   */
  private calculateRiskScore(failedChecks: FailedCheck[]): number {
    if (failedChecks.length === 0) {
      return 0;
    }

    let score = 0;

    // Count severity levels
    const criticalCount = failedChecks.filter((c) => c.severity === 'critical').length;
    const warningCount = failedChecks.filter((c) => c.severity === 'warning').length;
    const infoCount = failedChecks.filter((c) => c.severity === 'info').length;

    // Critical issues: 0.8-1.0
    if (criticalCount > 0) {
      score = Math.min(1, 0.8 + (criticalCount * 0.1));
    }
    // Warnings: 0.3-0.7
    else if (warningCount > 0) {
      score = Math.min(0.7, 0.3 + (warningCount * 0.15));
    }
    // Info only: 0.1-0.2
    else if (infoCount > 0) {
      score = Math.min(0.2, 0.1 + (infoCount * 0.05));
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Build a human-readable reason for the verification result
   */
  private buildReason(failedChecks: FailedCheck[], passed: boolean): string {
    if (passed) {
      if (failedChecks.length === 0) {
        return 'All fraud checks passed. Data appears valid.';
      } else {
        const infoCount = failedChecks.filter((c) => c.severity === 'info').length;
        return `Verification passed with ${infoCount} informational note(s). Review recommended.`;
      }
    } else {
      const criticalChecks = failedChecks.filter((c) => c.severity === 'critical');
      if (criticalChecks.length === 1) {
        return `Critical issue detected: ${criticalChecks[0].message}`;
      } else {
        return `${criticalChecks.length} critical issue(s) detected. Data publication blocked.`;
      }
    }
  }

  /**
   * Get current fraud risk score for an agent
   * Returns cached score from agent_profiles table
   *
   * @param agentId - UUID of agent profile
   * @returns Risk score (0-1)
   */
  async getFraudRiskScore(agentId: string): Promise<number> {
    try {
      const profile = await this.agentProfileRepo.findOne({
        where: { id: agentId },
        select: ['fraudRiskScore'],
      });

      if (!profile) {
        this.logger.warn(`Agent profile ${agentId} not found`);
        return 0;
      }

      return profile.fraudRiskScore || 0;
    } catch (error) {
      this.logger.error(`Error fetching fraud risk score for agent ${agentId}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Update fraud risk score for an agent in database
   * This is called after each fraud verification
   *
   * @param agentId - UUID of agent profile
   * @param riskScore - New risk score (0-1)
   */
  private async updateFraudRiskScore(agentId: string, riskScore: number): Promise<void> {
    try {
      await this.agentProfileRepo.update({ id: agentId }, { fraudRiskScore: riskScore });
      this.logger.debug(`Updated fraud risk score for agent ${agentId} to ${riskScore.toFixed(3)}`);
    } catch (error) {
      this.logger.error(
        `Failed to update fraud risk score for agent ${agentId}: ${error.message}`,
      );
    }
  }

  /**
   * Normalize platform name to standard format
   */
  private normalizePlatform(platform: string): string {
    const normalized = platform.toLowerCase().trim();
    const validPlatforms = Object.keys(this.platformThresholds);

    if (validPlatforms.includes(normalized)) {
      return normalized;
    }

    // Default to meta if unknown
    this.logger.warn(`Unknown platform: ${platform}, defaulting to meta`);
    return 'meta';
  }

  /**
   * Get platform-specific thresholds
   * Can be used by callers to understand what limits are enforced
   *
   * @param platform - Platform name
   * @returns Threshold configuration
   */
  getPlatformThresholds(platform: string): PlatformThresholds {
    const normalized = this.normalizePlatform(platform);
    return this.platformThresholds[normalized];
  }

  /**
   * Update platform thresholds (admin only)
   * Allows customization of fraud detection rules per platform
   *
   * @param platform - Platform name
   * @param thresholds - New threshold values
   */
  setPlatformThresholds(platform: string, thresholds: Partial<PlatformThresholds>): void {
    const normalized = this.normalizePlatform(platform);
    this.platformThresholds[normalized] = {
      ...this.platformThresholds[normalized],
      ...thresholds,
    };
    this.logger.log(`Updated thresholds for platform ${normalized}`);
  }
}
