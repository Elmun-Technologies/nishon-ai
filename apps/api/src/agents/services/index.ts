/**
 * Agents Services - Public Exports
 *
 * Central export point for all agent-related services.
 */

export {
  FraudDetectionService,
  FraudDetectionResult,
  FailedCheck,
  MetricsData,
  FraudSeverity,
  PlatformThresholds,
} from './fraud-detection.service';

export {
  FraudDetectionAdminService,
  AdminFraudAction,
  FraudRiskAnalysis,
} from './fraud-detection-admin.service';

// Export example patterns for documentation
export * from './fraud-detection.examples';
