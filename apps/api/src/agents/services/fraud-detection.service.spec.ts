import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FraudDetectionService, MetricsData } from './fraud-detection.service';
import { AgentProfile } from '../entities/agent-profile.entity';
import { AgentPlatformMetrics } from '../entities/agent-platform-metrics.entity';
import { AgentPerformanceSyncLog } from '../entities/agent-performance-sync-log.entity';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  let agentProfileRepo: Repository<AgentProfile>;
  let metricsRepo: Repository<AgentPlatformMetrics>;
  let syncLogRepo: Repository<AgentPerformanceSyncLog>;

  const mockAgentId = 'test-agent-uuid';
  const mockAgentProfile: Partial<AgentProfile> = {
    id: mockAgentId,
    displayName: 'Test Agent',
    fraudRiskScore: 0,
  };

  const validMetrics: MetricsData = {
    platform: 'meta',
    totalSpend: 5000,
    campaignsCount: 10,
    avgRoas: 4.5,
    avgCpa: 8.2,
    avgCtr: 2.5,
    conversionCount: 100,
    totalRevenue: 22500,
    clicks: 500,
    impressions: 10000,
    timestamp: new Date(),
  };

  const highRoasMetrics: MetricsData = {
    ...validMetrics,
    avgRoas: 18, // Above threshold
  };

  const highConversionMetrics: MetricsData = {
    ...validMetrics,
    conversionCount: 500, // 100% conversion rate
    clicks: 500,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudDetectionService,
        {
          provide: getRepositoryToken(AgentProfile),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentPlatformMetrics),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentPerformanceSyncLog),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FraudDetectionService>(FraudDetectionService);
    agentProfileRepo = module.get<Repository<AgentProfile>>(getRepositoryToken(AgentProfile));
    metricsRepo = module.get<Repository<AgentPlatformMetrics>>(
      getRepositoryToken(AgentPlatformMetrics),
    );
    syncLogRepo = module.get<Repository<AgentPerformanceSyncLog>>(
      getRepositoryToken(AgentPerformanceSyncLog),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify', () => {
    it('should pass verification for valid metrics', async () => {
      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      const result = await service.verify(mockAgentId, 'meta', validMetrics);

      expect(result.passed).toBe(true);
      expect(result.riskScore).toBe(0);
      expect(result.failedChecks).toHaveLength(0);
      expect(result.reason).toContain('All fraud checks passed');
    });

    it('should flag high ROAS as warning', async () => {
      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      const result = await service.verify(mockAgentId, 'meta', highRoasMetrics);

      expect(result.passed).toBe(true); // ROAS is warning, not critical
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.failedChecks).toContainEqual(
        expect.objectContaining({
          rule: 'roas_anomaly',
          severity: 'warning',
        }),
      );
    });

    it('should flag extremely high ROAS as critical', async () => {
      const extremeRoasMetrics: MetricsData = {
        ...validMetrics,
        avgRoas: 30, // Extremely high
      };

      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      const result = await service.verify(mockAgentId, 'meta', extremeRoasMetrics);

      expect(result.passed).toBe(false);
      expect(result.failedChecks).toContainEqual(
        expect.objectContaining({
          rule: 'roas_anomaly',
          severity: 'critical',
        }),
      );
    });

    it('should flag unrealistic conversion rate as critical', async () => {
      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      const result = await service.verify(mockAgentId, 'meta', highConversionMetrics);

      expect(result.passed).toBe(false);
      expect(result.failedChecks).toContainEqual(
        expect.objectContaining({
          rule: 'conversion_rate',
          severity: 'critical',
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(agentProfileRepo, 'update').mockRejectedValue(new Error('DB Error'));
      jest.spyOn(metricsRepo, 'findOne').mockRejectedValue(new Error('DB Error'));
      jest.spyOn(syncLogRepo, 'findOne').mockRejectedValue(new Error('DB Error'));

      const result = await service.verify(mockAgentId, 'meta', validMetrics);

      expect(result.passed).toBe(false);
      expect(result.riskScore).toBe(0.8); // Cautious score
      expect(result.failedChecks[0].severity).toBe('critical');
    });
  });

  describe('getFraudRiskScore', () => {
    it('should return agent fraud risk score', async () => {
      jest.spyOn(agentProfileRepo, 'findOne').mockResolvedValue({
        ...mockAgentProfile,
        fraudRiskScore: 0.5,
      } as AgentProfile);

      const score = await service.getFraudRiskScore(mockAgentId);

      expect(score).toBe(0.5);
    });

    it('should return 0 if agent not found', async () => {
      jest.spyOn(agentProfileRepo, 'findOne').mockResolvedValue(null);

      const score = await service.getFraudRiskScore('non-existent');

      expect(score).toBe(0);
    });
  });

  describe('platform thresholds', () => {
    it('should have Meta platform thresholds', () => {
      const thresholds = service.getPlatformThresholds('meta');

      expect(thresholds.maxRoas).toBe(15);
      expect(thresholds.maxConversionRate).toBe(15);
      expect(thresholds.maxSpendSpikeMoM).toBe(50);
    });

    it('should have Google platform thresholds', () => {
      const thresholds = service.getPlatformThresholds('google');

      expect(thresholds.maxRoas).toBe(12);
      expect(thresholds.maxConversionRate).toBe(12);
    });

    it('should allow updating platform thresholds', () => {
      service.setPlatformThresholds('meta', { maxRoas: 20, maxConversionRate: 20 });
      const thresholds = service.getPlatformThresholds('meta');

      expect(thresholds.maxRoas).toBe(20);
      expect(thresholds.maxConversionRate).toBe(20);
    });

    it('should normalize unknown platforms to meta', () => {
      const thresholds = service.getPlatformThresholds('unknown-platform');

      // Should return meta defaults
      expect(thresholds.maxRoas).toBe(15);
    });
  });

  describe('risk score calculation', () => {
    it('should calculate score based on severity', async () => {
      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      // Test with multiple issues
      const problematicMetrics: MetricsData = {
        ...validMetrics,
        avgRoas: 18,
        campaignsCount: 0, // Below threshold
      };

      const result = await service.verify(mockAgentId, 'meta', problematicMetrics);

      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.riskScore).toBeLessThanOrEqual(1);
      expect(result.failedChecks.length).toBeGreaterThan(0);
    });
  });

  describe('data consistency checks', () => {
    it('should check data age', async () => {
      const oldMetrics: MetricsData = {
        ...validMetrics,
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours old
      };

      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      const result = await service.verify(mockAgentId, 'meta', oldMetrics);

      expect(result.failedChecks).toContainEqual(
        expect.objectContaining({
          rule: 'data_timestamp',
          severity: 'warning',
        }),
      );
    });

    it('should check campaign count', async () => {
      const noCampaignMetrics: MetricsData = {
        ...validMetrics,
        campaignsCount: 0,
      };

      jest.spyOn(agentProfileRepo, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(metricsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(syncLogRepo, 'findOne').mockResolvedValue(null);

      const result = await service.verify(mockAgentId, 'meta', noCampaignMetrics);

      expect(result.failedChecks).toContainEqual(
        expect.objectContaining({
          rule: 'campaign_count',
          severity: 'warning',
        }),
      );
    });
  });
});
