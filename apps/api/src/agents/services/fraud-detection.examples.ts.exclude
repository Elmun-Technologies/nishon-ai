/**
 * Fraud Detection Service - Usage Examples
 *
 * This file demonstrates common patterns for using the FraudDetectionService
 * and FraudDetectionAdminService in your application.
 */

import { Injectable } from '@nestjs/common';
import { FraudDetectionService, MetricsData, FraudDetectionResult } from './fraud-detection.service';
import { FraudDetectionAdminService } from './fraud-detection-admin.service';

/**
 * Example 1: Integration with PerformanceSyncService
 * Shows how to validate metrics before saving them to the database
 */
@Injectable()
export class PerformanceSyncExample {
  constructor(private fraudDetection: FraudDetectionService) {}

  async syncMetricsFromPlatform(agentId: string, platform: string, metrics: MetricsData) {
    console.log(`Syncing metrics for agent ${agentId} from ${platform}`);

    // Step 1: Verify metrics for fraud
    const fraudCheck = await this.fraudDetection.verify(agentId, platform, metrics);

    console.log(`Fraud check result: passed=${fraudCheck.passed}, riskScore=${fraudCheck.riskScore}`);

    // Step 2: Handle critical issues
    if (!fraudCheck.passed) {
      console.error(`❌ FRAUD DETECTED: ${fraudCheck.reason}`);
      fraudCheck.failedChecks.forEach((check) => {
        console.error(`   - ${check.rule} (${check.severity}): ${check.message}`);
      });
      // Block publication and require manual review
      throw new Error('Fraud detected. Manual review required.');
    }

    // Step 3: Log warnings for monitoring
    if (fraudCheck.failedChecks.length > 0) {
      console.warn(`⚠️  WARNINGS: ${fraudCheck.reason}`);
      fraudCheck.failedChecks.forEach((check) => {
        console.warn(`   - ${check.rule} (${check.severity}): ${check.message}`);
      });
      // Could send notification to admins here
    }

    // Step 4: Metrics passed validation, safe to save
    console.log('✓ Metrics passed fraud validation. Saving to database.');
    // Save metrics...
  }
}

/**
 * Example 2: API Endpoint - Get Agent Fraud Status
 * Returns current fraud risk score and recent audit history
 */
@Injectable()
export class AgentFraudStatusExample {
  constructor(
    private fraudDetection: FraudDetectionService,
    private adminService: FraudDetectionAdminService,
  ) {}

  async getAgentFraudStatus(agentId: string) {
    // Get current risk score
    const riskScore = await this.fraudDetection.getFraudRiskScore(agentId);

    // Get analysis
    const analysis = await this.adminService.analyzeFraudRisk(agentId);

    return {
      agentId,
      currentRiskScore: riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      trends: analysis.trends,
      topIssues: analysis.topFailedRules.slice(0, 3),
      recommendations: analysis.recommendations,
      recentAudits: analysis.recentAudits.slice(0, 5),
    };
  }

  private getRiskLevel(score: number): string {
    if (score < 0.1) return 'SAFE';
    if (score < 0.3) return 'LOW';
    if (score < 0.5) return 'MODERATE';
    if (score < 0.8) return 'HIGH';
    return 'CRITICAL';
  }
}

/**
 * Example 3: Admin Dashboard - High-Risk Agents
 * Shows how to identify and monitor high-risk agents
 */
@Injectable()
export class AdminDashboardExample {
  constructor(private adminService: FraudDetectionAdminService) {}

  async getHighRiskAgentsDashboard() {
    // Get statistics
    const stats = await this.adminService.getFraudStatistics();

    // Get agents needing review
    const highRiskAgents = await this.adminService.getHighRiskAgents(0.5);

    return {
      summary: {
        totalAgents: stats.totalAgents,
        highRiskCount: stats.highRiskAgents,
        averageRiskScore: stats.averageRiskScore,
        criticalIssuesLast7Days: stats.recentCriticalIssues,
      },
      agentsNeedingReview: highRiskAgents.map((agent) => ({
        id: agent.id,
        displayName: agent.displayName,
        riskScore: agent.fraudRiskScore,
        lastUpdated: agent.updatedAt,
        platforms: agent.platforms,
      })),
      actionItems: [
        `Review ${stats.highRiskAgents} high-risk agents`,
        `${stats.recentCriticalIssues} critical issues in last 7 days`,
        `Average risk score: ${(stats.averageRiskScore * 100).toFixed(1)}%`,
      ],
    };
  }
}

/**
 * Example 4: Admin Action - Review and Approve Metrics
 * Shows the full workflow for admin approval of flagged metrics
 */
@Injectable()
export class AdminApprovalExample {
  constructor(private adminService: FraudDetectionAdminService) {}

  async reviewAndApproveMetrics(metricId: string, auditId: string, adminId: string) {
    // Admin reviews the metric details (in UI)
    console.log(`Admin ${adminId} reviewing metric ${metricId}`);

    // Decision: The data looks legitimate based on manual verification
    // Mark the related audit as approved
    await this.adminService.reviewFraudAudit(
      auditId,
      {
        action: 'approve',
        comment: 'Manually verified. Agent legitimately achieved these results during campaign launch.',
      },
      adminId,
    );

    // Approve the metrics for publication
    await this.adminService.approveMetrics(metricId, adminId, 'Approved after manual verification');

    console.log(`✓ Metrics approved for publication`);
  }

  async reviewAndRejectMetrics(
    metricId: string,
    auditId: string,
    adminId: string,
    reason: string,
  ) {
    console.log(`Admin ${adminId} rejecting metric ${metricId}: ${reason}`);

    // Reject the metric
    await this.adminService.rejectMetrics(metricId, adminId, reason);

    // Log audit trail
    await this.adminService.reviewFraudAudit(
      auditId,
      {
        action: 'reject',
        comment: reason,
      },
      adminId,
    );

    console.log(`✓ Metrics rejected`);
  }
}

/**
 * Example 5: False Positive Management
 * Shows how to mark false positives and improve detection rules
 */
@Injectable()
export class FalsePositiveHandlingExample {
  constructor(private adminService: FraudDetectionAdminService) {}

  async markFalsePositive(auditId: string, rule: string, reason: string, adminId: string) {
    console.log(`Marking as false positive: rule=${rule}, reason=${reason}`);

    await this.adminService.reviewFraudAudit(
      auditId,
      {
        action: 'mark_false_positive',
        rule,
        comment: reason,
      },
      adminId,
    );

    console.log(
      `✓ Marked as false positive. This feedback helps improve our fraud detection algorithm.`,
    );
  }

  /**
   * Example: Agent legitimately achieved high ROAS
   */
  async handleHighRoasFalsePositive(auditId: string, adminId: string) {
    await this.markFalsePositive(
      auditId,
      'roas_anomaly',
      'Agent ran a successful holiday campaign with viral growth. ROAS of 22 is legitimate for this time period.',
      adminId,
    );
  }

  /**
   * Example: High conversion rate due to quality audience
   */
  async handleHighConversionFalsePositive(auditId: string, adminId: string) {
    await this.markFalsePositive(
      auditId,
      'conversion_rate',
      'Agent targets highly qualified B2B leads with pre-existing relationship. 12% conversion rate is normal for this segment.',
      adminId,
    );
  }
}

/**
 * Example 6: Threshold Adjustment
 * Shows how to tune fraud detection rules for different markets
 */
@Injectable()
export class ThresholdAdjustmentExample {
  constructor(private adminService: FraudDetectionAdminService) {}

  async adjustThresholdsForMarket(adminId: string) {
    // Example: Uzbekistan market has different competitive dynamics
    // ROAS values tend to be higher due to lower competition

    console.log('Adjusting thresholds for Uzbek market...');

    await this.adminService.adjustThresholds(
      'meta',
      {
        maxRoas: 20, // Increased from 15
        maxConversionRate: 18, // Increased from 15
        maxSpendSpikeMoM: 60, // Increased from 50 (more seasonal)
      },
      adminId,
    );

    console.log('✓ Thresholds updated for Meta platform in Uzbekistan market');
  }

  async adjustThresholdsForNewAgentType(adminId: string) {
    // New agent type targeting high-end customers with lower volume but higher ROAS
    console.log('Adjusting thresholds for luxury segment...');

    await this.adminService.adjustThresholds('google', { maxRoas: 25, maxConversionRate: 8 }, adminId);

    console.log('✓ Thresholds optimized for luxury segment');
  }
}

/**
 * Example 7: Audit History and Compliance
 * Shows how to retrieve fraud detection history for compliance and analysis
 */
@Injectable()
export class AuditHistoryExample {
  constructor(private adminService: FraudDetectionAdminService) {}

  async generateComplianceReport(agentId: string, adminId: string) {
    console.log(`Generating compliance report for agent ${agentId}...`);

    // Get audit history for last 90 days
    const audits = await this.adminService.getAuditHistory(agentId, 90, 100);

    // Analyze patterns
    const criticalCount = audits.filter((a) => !a.passed).length;
    const approvedCount = audits.filter((a) => a.action === 'admin_approved').length;
    const rejectedCount = audits.filter((a) => a.action === 'admin_rejected').length;
    const falsePositives = audits.filter((a) => a.action === 'marked_false_positive').length;

    return {
      agentId,
      reportPeriod: '90 days',
      summary: {
        totalChecks: audits.length,
        criticalIssues: criticalCount,
        adminApprovals: approvedCount,
        adminRejections: rejectedCount,
        falsePositivesMarked: falsePositives,
        passingRate: ((audits.filter((a) => a.passed).length / audits.length) * 100).toFixed(1) + '%',
      },
      auditTrail: audits.map((a) => ({
        timestamp: a.createdAt,
        action: a.action,
        platform: a.platform,
        riskScore: a.riskScore,
        issues: a.failedChecks?.map((c) => c.rule) || [],
        comment: a.adminComment,
      })),
    };
  }
}

/**
 * Example 8: Batch Processing
 * Shows how to process multiple agents' metrics efficiently
 */
@Injectable()
export class BatchProcessingExample {
  constructor(private fraudDetection: FraudDetectionService) {}

  async processMonthlyMetricsReview(agentIds: string[], allMetrics: Map<string, MetricsData[]>) {
    console.log(`Processing fraud detection for ${agentIds.length} agents...`);

    const results: Map<string, FraudDetectionResult[]> = new Map();

    for (const agentId of agentIds) {
      const agentMetrics = allMetrics.get(agentId) || [];
      const agentResults: FraudDetectionResult[] = [];

      for (const metrics of agentMetrics) {
        const result = await this.fraudDetection.verify(agentId, metrics.platform, metrics);
        agentResults.push(result);
      }

      results.set(agentId, agentResults);
    }

    // Generate summary
    const summary = {
      agentsProcessed: agentIds.length,
      totalMetrics: Array.from(results.values()).reduce((sum, arr) => sum + arr.length, 0),
      passedCount: Array.from(results.values()).reduce(
        (sum, arr) => sum + arr.filter((r) => r.passed).length,
        0,
      ),
      failedCount: Array.from(results.values()).reduce(
        (sum, arr) => sum + arr.filter((r) => !r.passed).length,
        0,
      ),
      averageRiskScore:
        (
          Array.from(results.values())
            .flat()
            .reduce((sum, r) => sum + r.riskScore, 0) / Array.from(results.values()).flat().length
        ).toFixed(3),
    };

    console.log(`✓ Processing complete: ${JSON.stringify(summary, null, 2)}`);

    return { results, summary };
  }
}

/**
 * Example 9: Threshold Configuration Per Workspace
 * Shows how to customize fraud detection rules per organization
 */
@Injectable()
export class WorkspaceThresholdsExample {
  constructor(private fraudDetection: FraudDetectionService) {}

  /**
   * Get platform thresholds for an agent
   * Could be extended to support workspace-specific overrides
   */
  getThresholdsForAgent(platform: string) {
    return this.fraudDetection.getPlatformThresholds(platform);
  }

  /**
   * Example: Conservative thresholds for regulated industries (finance, healthcare)
   */
  applyConservativeThresholds() {
    // These would be stored per-workspace in future enhancement
    const conservativeThresholds = {
      maxRoas: 8,
      maxConversionRate: 5,
      maxSpendSpikeMoM: 30,
      maxCpcVariance: 200,
      maxDataAge: 12,
    };

    return conservativeThresholds;
  }

  /**
   * Example: Lenient thresholds for high-growth startups
   */
  applyGrowthThresholds() {
    const growthThresholds = {
      maxRoas: 25,
      maxConversionRate: 25,
      maxSpendSpikeMoM: 100,
      maxCpcVariance: 500,
      maxDataAge: 48,
    };

    return growthThresholds;
  }
}

/**
 * Example 10: Real-time Monitoring
 * Shows how to set up continuous fraud detection monitoring
 */
@Injectable()
export class RealTimeMonitoringExample {
  constructor(private adminService: FraudDetectionAdminService) {}

  async startMonitoringLoop() {
    console.log('Starting real-time fraud monitoring...');

    // Run every 5 minutes
    setInterval(async () => {
      try {
        // Get current high-risk agents
        const highRiskAgents = await this.adminService.getHighRiskAgents(0.7);

        if (highRiskAgents.length > 0) {
          console.log(`⚠️  Alert: ${highRiskAgents.length} agents with critical fraud risk`);

          highRiskAgents.forEach((agent) => {
            console.log(`   - ${agent.displayName}: ${(agent.fraudRiskScore * 100).toFixed(1)}%`);
          });

          // TODO: Send alert to admins via Slack/email
        }

        // Get statistics
        const stats = await this.adminService.getFraudStatistics();
        console.log(`Monthly summary - Critical issues: ${stats.recentCriticalIssues}`);
      } catch (error) {
        console.error('Monitoring error:', error.message);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}
