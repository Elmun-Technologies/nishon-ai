import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MarketplaceSearchService } from "./marketplace-search.service";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentCertification } from "../entities/agent-certification.entity";
import { AgentLanguage } from "../entities/agent-language.entity";
import { AgentGeographicCoverage } from "../entities/agent-geographic-coverage.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { AgentReview } from "../entities/agent-review.entity";
import { AgentHistoricalPerformance } from "../entities/agent-historical-performance.entity";
import { MarketplaceCertification } from "../entities/marketplace-certification.entity";
import { NotFoundException } from "@nestjs/common";

describe("MarketplaceSearchService", () => {
  let service: MarketplaceSearchService;
  let agentProfileRepository: Repository<AgentProfile>;
  let agentCertificationRepository: Repository<AgentCertification>;
  let agentLanguageRepository: Repository<AgentLanguage>;
  let agentGeographicCoverageRepository: Repository<AgentGeographicCoverage>;
  let agentPlatformMetricsRepository: Repository<AgentPlatformMetrics>;
  let agentReviewRepository: Repository<AgentReview>;
  let agentHistoricalPerformanceRepository: Repository<AgentHistoricalPerformance>;
  let marketplaceCertificationRepository: Repository<MarketplaceCertification>;

  const mockAgentProfile: Partial<AgentProfile> = {
    id: "test-id-1",
    slug: "test-specialist",
    displayName: "Test Specialist",
    title: "Facebook Ads Expert",
    bio: "Specialized in e-commerce marketing",
    isPublished: true,
    isIndexable: true,
    platforms: ["meta", "google"],
    niches: ["e-commerce", "fashion"],
    cachedRating: 4.8,
    cachedReviewCount: 42,
    cachedStats: {
      avgROAS: 4.2,
      avgCPA: 8,
      avgCTR: 3.8,
      totalCampaigns: 100,
      activeCampaigns: 25,
      successRate: 89,
      totalSpendManaged: 500000,
      bestROAS: 8.5,
    },
    monthlyRate: 150,
    isVerified: true,
    isFeatured: false,
    searchKeywords: "facebook meta ads e-commerce fashion marketing",
    languages: [],
    geographicCoverage: [],
    certifications: [],
    reviews: [],
    platformMetrics: [],
    historicalPerformance: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceSearchService,
        {
          provide: getRepositoryToken(AgentProfile),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentCertification),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentLanguage),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentGeographicCoverage),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentPlatformMetrics),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentReview),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentHistoricalPerformance),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MarketplaceCertification),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MarketplaceSearchService>(MarketplaceSearchService);
    agentProfileRepository = module.get<Repository<AgentProfile>>(
      getRepositoryToken(AgentProfile),
    );
    agentCertificationRepository = module.get<Repository<AgentCertification>>(
      getRepositoryToken(AgentCertification),
    );
    agentLanguageRepository = module.get<Repository<AgentLanguage>>(
      getRepositoryToken(AgentLanguage),
    );
    agentGeographicCoverageRepository =
      module.get<Repository<AgentGeographicCoverage>>(
        getRepositoryToken(AgentGeographicCoverage),
      );
    agentPlatformMetricsRepository =
      module.get<Repository<AgentPlatformMetrics>>(
        getRepositoryToken(AgentPlatformMetrics),
      );
    agentReviewRepository = module.get<Repository<AgentReview>>(
      getRepositoryToken(AgentReview),
    );
    agentHistoricalPerformanceRepository =
      module.get<Repository<AgentHistoricalPerformance>>(
        getRepositoryToken(AgentHistoricalPerformance),
      );
    marketplaceCertificationRepository =
      module.get<Repository<MarketplaceCertification>>(
        getRepositoryToken(MarketplaceCertification),
      );
  });

  describe("searchSpecialists", () => {
    it("should search specialists with basic filters", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockAgentProfile]),
        clone: jest.fn(),
      };

      mockQueryBuilder.clone.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockAgentProfile]),
      });

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchSpecialists({
        query: "facebook ads",
        page: 1,
        pageSize: 20,
      });

      expect(results).toBeDefined();
      expect(results.specialists).toHaveLength(1);
      expect(results.page).toBe(1);
      expect(results.pageSize).toBe(20);
    });

    it("should apply platform filter", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockAgentProfile]),
        clone: jest.fn(),
      };

      mockQueryBuilder.clone.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchSpecialists({
        platforms: ["meta", "google"],
        page: 1,
        pageSize: 20,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(results.specialists).toBeDefined();
    });

    it("should apply rating filter", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockAgentProfile]),
        clone: jest.fn(),
      };

      mockQueryBuilder.clone.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchSpecialists({
        minRating: 4.0,
        page: 1,
        pageSize: 20,
      });

      expect(results.specialists).toBeDefined();
      expect(results.specialists[0].cachedRating).toBeGreaterThanOrEqual(4.0);
    });

    it("should handle pagination correctly", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
        getMany: jest.fn().mockResolvedValue([mockAgentProfile]),
        clone: jest.fn(),
      };

      mockQueryBuilder.clone.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
      });

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchSpecialists({
        page: 2,
        pageSize: 20,
      });

      expect(results.page).toBe(2);
      expect(results.pageSize).toBe(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20); // (2-1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it("should enforce maximum page size", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockAgentProfile]),
        clone: jest.fn(),
      };

      mockQueryBuilder.clone.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const results = await service.searchSpecialists({
        pageSize: 200, // Exceeds max of 100
      });

      expect(results.pageSize).toBe(100); // Should be capped at 100
    });
  });

  describe("getSpecialistDetail", () => {
    it("should return specialist profile with all relations", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockAgentProfile),
      };

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSpecialistDetail("test-specialist");

      expect(result).toBeDefined();
      expect(result.displayName).toBe("Test Specialist");
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
    });

    it("should throw NotFoundException if specialist not found", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      await expect(
        service.getSpecialistDetail("non-existent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getSpecialistPerformance", () => {
    it("should return performance data for specialist", async () => {
      jest
        .spyOn(agentProfileRepository, "findOne")
        .mockResolvedValue(mockAgentProfile as AgentProfile);

      const mockMetricsQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(agentPlatformMetricsRepository, "createQueryBuilder")
        .mockReturnValue(mockMetricsQueryBuilder as any);

      const result = await service.getSpecialistPerformance(
        "test-specialist",
      );

      expect(result).toBeDefined();
      expect(result.slug).toBe("test-specialist");
      expect(result.avgRoas).toBe(mockAgentProfile.cachedStats.avgROAS);
    });

    it("should throw NotFoundException if specialist not found", async () => {
      jest
        .spyOn(agentProfileRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        service.getSpecialistPerformance("non-existent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateSearchKeywords", () => {
    it("should update search keywords for specialist", async () => {
      jest
        .spyOn(agentProfileRepository, "findOne")
        .mockResolvedValue(mockAgentProfile as AgentProfile);

      jest
        .spyOn(agentProfileRepository, "update")
        .mockResolvedValue({ affected: 1 } as any);

      await service.updateSearchKeywords("test-id-1");

      expect(agentProfileRepository.update).toHaveBeenCalledWith(
        { id: "test-id-1" },
        expect.objectContaining({
          searchKeywords: expect.any(String),
        }),
      );
    });

    it("should throw NotFoundException if agent not found", async () => {
      jest
        .spyOn(agentProfileRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        service.updateSearchKeywords("non-existent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAvailableFilters", () => {
    it("should return available filters with counts", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        clone: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
      };

      jest
        .spyOn(agentProfileRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      jest
        .spyOn(agentGeographicCoverageRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      jest
        .spyOn(marketplaceCertificationRepository, "createQueryBuilder")
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAvailableFilters();

      expect(result).toBeDefined();
      expect(result.platforms).toBeDefined();
      expect(result.niches).toBeDefined();
      expect(result.countries).toBeDefined();
      expect(Array.isArray(result.platforms)).toBe(true);
    });
  });
});
