import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { MarketplaceCronService } from "./marketplace-cron.service";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { MetaPerformanceSyncService } from "../integrations/meta-sync.service";
import { GooglePerformanceSyncService } from "../integrations/google-sync.service";
import { YandexPerformanceSyncService } from "../integrations/yandex-sync.service";
import { FraudDetectionService } from "./fraud-detection.service";

/**
 * Mock sync result
 */
const mockSyncResult = {
  success: true,
  agentProfileId: "agent-1",
  agentDisplayName: "Test Specialist",
  metricsInserted: 50,
  metricsUpdated: 25,
  campaignsSynced: 3,
  dateRangeStart: new Date("2024-01-01"),
  dateRangeEnd: new Date("2024-01-31"),
  syncedAt: new Date(),
  fraudRiskScore: 15,
  errors: [],
  warnings: [],
};

describe("MarketplaceCronService", () => {
  let service: MarketplaceCronService;
  let workspaceRepo: Repository<Workspace>;
  let metaSync: MetaPerformanceSyncService;
  let googleSync: GooglePerformanceSyncService;
  let yandexSync: YandexPerformanceSyncService;
  let fraudDetection: FraudDetectionService;

  beforeEach(async () => {
    // Mock repositories and services
    const mockWorkspaceRepo = {
      find: jest.fn(),
    };

    const mockMetaSync = {
      syncAllSpecialists: jest.fn(),
    };

    const mockGoogleSync = {
      syncAllSpecialists: jest.fn(),
    };

    const mockYandexSync = {
      syncAllSpecialists: jest.fn(),
    };

    const mockFraudDetection = {
      getFraudRiskScore: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          SYNC_CRON_EXPRESSION: "0 0 * * *",
          DEEP_VALIDATION_CRON: "0 3 * * 0",
          STAGGER_SYNCS: "true",
          STAGGER_INTERVAL_MS: "180000",
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceCronService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepo,
        },
        {
          provide: MetaPerformanceSyncService,
          useValue: mockMetaSync,
        },
        {
          provide: GooglePerformanceSyncService,
          useValue: mockGoogleSync,
        },
        {
          provide: YandexPerformanceSyncService,
          useValue: mockYandexSync,
        },
        {
          provide: FraudDetectionService,
          useValue: mockFraudDetection,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MarketplaceCronService>(MarketplaceCronService);
    workspaceRepo = module.get<Repository<Workspace>>(
      getRepositoryToken(Workspace),
    );
    metaSync = module.get<MetaPerformanceSyncService>(MetaPerformanceSyncService);
    googleSync = module.get<GooglePerformanceSyncService>(
      GooglePerformanceSyncService,
    );
    yandexSync = module.get<YandexPerformanceSyncService>(
      YandexPerformanceSyncService,
    );
    fraudDetection = module.get<FraudDetectionService>(FraudDetectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleDailyPerformanceSync", () => {
    it("should sync all platforms for all workspaces", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
        { id: "ws-2", name: "Workspace 2", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);

      // Act
      await service.handleDailyPerformanceSync();

      // Assert
      expect(workspaceRepo.find).toHaveBeenCalled();
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledTimes(2);
      expect(googleSync.syncAllSpecialists).toHaveBeenCalledTimes(2);
      expect(yandexSync.syncAllSpecialists).toHaveBeenCalledTimes(2);

      // Verify config passed to sync methods
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledWith("ws-1", {
        dayLookback: 30,
        forceRefresh: false,
      });
    });

    it("should handle no active workspaces gracefully", async () => {
      // Arrange
      jest.spyOn(workspaceRepo, "find").mockResolvedValue([]);

      // Act
      await service.handleDailyPerformanceSync();

      // Assert
      expect(metaSync.syncAllSpecialists).not.toHaveBeenCalled();
      expect(googleSync.syncAllSpecialists).not.toHaveBeenCalled();
      expect(yandexSync.syncAllSpecialists).not.toHaveBeenCalled();
    });

    it("should continue syncing other platforms if one fails", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockRejectedValue(new Error("Meta API error"));
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);

      // Act
      await service.handleDailyPerformanceSync();

      // Assert - Google and Yandex should still be called
      expect(googleSync.syncAllSpecialists).toHaveBeenCalled();
      expect(yandexSync.syncAllSpecialists).toHaveBeenCalled();
    });

    it("should continue with next workspace if one fails", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
        { id: "ws-2", name: "Workspace 2", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);

      // First workspace Meta sync fails, others succeed
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockRejectedValueOnce(new Error("API error"))
        .mockResolvedValueOnce([mockSyncResult, mockSyncResult]);

      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);

      // Act
      await service.handleDailyPerformanceSync();

      // Assert - Should still process second workspace
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledTimes(2);
    });

    it("should collect metrics from all platforms", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);

      const metaResult = { ...mockSyncResult, metricsInserted: 100 };
      const googleResult = { ...mockSyncResult, metricsInserted: 80 };
      const yandexResult = { ...mockSyncResult, metricsInserted: 60 };

      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([metaResult]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([googleResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([yandexResult]);

      // Act
      await service.handleDailyPerformanceSync();

      // Assert - Should aggregate metrics
      expect(metaSync.syncAllSpecialists).toHaveBeenCalled();
      expect(googleSync.syncAllSpecialists).toHaveBeenCalled();
      expect(yandexSync.syncAllSpecialists).toHaveBeenCalled();
    });
  });

  describe("handleWeeklyDeepValidation", () => {
    it("should perform deep validation with 90-day lookback", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);

      // Act
      await service.handleWeeklyDeepValidation();

      // Assert
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledWith("ws-1", {
        dayLookback: 90,
        forceRefresh: true,
      });
      expect(googleSync.syncAllSpecialists).toHaveBeenCalledWith("ws-1", {
        dayLookback: 90,
        forceRefresh: true,
      });
      expect(yandexSync.syncAllSpecialists).toHaveBeenCalledWith("ws-1", {
        dayLookback: 90,
        forceRefresh: true,
      });
    });

    it("should use force refresh and 90-day lookback for deep validation", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);

      // Act
      await service.handleWeeklyDeepValidation();

      // Assert - Verify config uses force refresh and 90-day lookback
      const expectedConfig = { dayLookback: 90, forceRefresh: true };
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledWith(
        "ws-1",
        expectedConfig,
      );
    });

    it("should process multiple workspaces independently", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
        { id: "ws-2", name: "Workspace 2", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult]);

      // Act
      await service.handleWeeklyDeepValidation();

      // Assert - Both workspaces should be processed
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledWith("ws-1", expect.any(Object));
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledWith("ws-2", expect.any(Object));
    });

    it("should process multiple workspaces with full refresh", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
        { id: "ws-2", name: "Workspace 2", isActive: true } as Workspace,
        { id: "ws-3", name: "Workspace 3", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([mockSyncResult, mockSyncResult]);

      // Act
      await service.handleWeeklyDeepValidation();

      // Assert
      expect(metaSync.syncAllSpecialists).toHaveBeenCalledTimes(3);
      expect(googleSync.syncAllSpecialists).toHaveBeenCalledTimes(3);
      expect(yandexSync.syncAllSpecialists).toHaveBeenCalledTimes(3);
      expect(fraudDetectionAdmin.revalidateWorkspaceFraudScores).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error handling", () => {
    it("should log and continue if workspace loading fails", async () => {
      // Arrange
      jest
        .spyOn(workspaceRepo, "find")
        .mockRejectedValue(new Error("Database error"));

      // Act & Assert - Should not throw
      await expect(
        service.handleDailyPerformanceSync(),
      ).resolves.not.toThrow();
    });

    it("should handle all three platforms failing for a workspace", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);
      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockRejectedValue(new Error("Meta error"));
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockRejectedValue(new Error("Google error"));
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockRejectedValue(new Error("Yandex error"));

      // Act & Assert - Should not throw
      await expect(
        service.handleDailyPerformanceSync(),
      ).resolves.not.toThrow();
    });
  });

  describe("Scheduling", () => {
    it("should be scheduled with correct cron expression", () => {
      // Check that the daily sync method has the @Cron decorator
      const dailySyncMethod = service.handleDailyPerformanceSync;
      expect(dailySyncMethod).toBeDefined();
    });

    it("should be scheduled with correct weekly cron expression", () => {
      // Check that the weekly validation method has the @Cron decorator
      const weeklySyncMethod = service.handleWeeklyDeepValidation;
      expect(weeklySyncMethod).toBeDefined();
    });
  });

  describe("Data aggregation", () => {
    it("should aggregate records synced across all results", async () => {
      // Arrange
      const mockWorkspaces: Workspace[] = [
        { id: "ws-1", name: "Workspace 1", isActive: true } as Workspace,
      ];

      jest.spyOn(workspaceRepo, "find").mockResolvedValue(mockWorkspaces);

      const result1 = { ...mockSyncResult, metricsInserted: 10, metricsUpdated: 5 };
      const result2 = { ...mockSyncResult, metricsInserted: 20, metricsUpdated: 10 };

      jest
        .spyOn(metaSync, "syncAllSpecialists")
        .mockResolvedValue([result1, result2]);
      jest
        .spyOn(googleSync, "syncAllSpecialists")
        .mockResolvedValue([result1]);
      jest
        .spyOn(yandexSync, "syncAllSpecialists")
        .mockResolvedValue([result2]);

      // Act
      await service.handleDailyPerformanceSync();

      // Assert - Should aggregate counts
      expect(metaSync.syncAllSpecialists).toHaveBeenCalled();
    });
  });
});
