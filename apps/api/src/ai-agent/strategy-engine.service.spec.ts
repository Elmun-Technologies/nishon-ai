import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { StrategyEngineService, StrategyInput } from "./strategy-engine.service";
import { Workspace } from "../workspaces/entities/workspace.entity";

// Shared mock for completeJson so tests can change its behavior
const mockCompleteJson = jest.fn();

jest.mock("@adspectr/ai-sdk", () => ({
  AdSpectrAiClient: jest.fn().mockImplementation(() => ({
    completeJson: mockCompleteJson,
  })),
  buildStrategyPrompt: jest.fn().mockReturnValue("mock prompt"),
  STRATEGY_SYSTEM_PROMPT: "mock system prompt",
}));

const makeWorkspace = (overrides: Partial<any> = {}): any => ({
  id: "ws-1",
  name: "Test Business",
  industry: "E-commerce",
  productDescription: "Test product",
  targetAudience: "18-35 males",
  monthlyBudget: 500,
  goal: "leads",
  targetLocation: "Uzbekistan",
  ...overrides,
});

const makeStrategy = (): any => ({
  summary: "Strong potential in local e-commerce market",
  marketAnalysis: {
    targetMarketSize: "Large",
    competitionLevel: "Medium",
    seasonality: "Low",
    keyInsights: ["Mobile-first audience"],
  },
  recommendedPlatforms: ["meta", "google"],
  budgetAllocation: { meta: 60, google: 40 },
  channelBreakdown: [],
  monthlyForecast: {
    estimatedLeads: 100,
    estimatedSales: 20,
    estimatedRoas: 3.5,
    estimatedCpa: 5,
    estimatedCtr: 2.5,
    confidence: "medium",
  },
  targetingRecommendations: [],
  creativeGuidelines: {
    tone: "Professional",
    keyMessages: [],
    callToActions: ["Learn More"],
    visualStyle: "Modern",
    formatRecommendations: [],
  },
  campaignStructure: [],
  firstWeekActions: [],
  warningFlags: [],
});

describe("StrategyEngineService", () => {
  let service: StrategyEngineService;
  let workspaceRepo: any;

  beforeEach(async () => {
    workspaceRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockCompleteJson.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyEngineService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === "OPENAI_API_KEY") return "sk-test-api-key";
              if (key === "OPENAI_BASE_URL") return "";
              return def ?? "";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StrategyEngineService>(StrategyEngineService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateForWorkspace", () => {
    it("should generate and save strategy for a workspace", async () => {
      const workspace = makeWorkspace();
      workspaceRepo.findOne.mockResolvedValue(workspace);
      workspaceRepo.update.mockResolvedValue({});
      mockCompleteJson.mockResolvedValue(makeStrategy());

      const result = await service.generateForWorkspace("ws-1");

      expect(result).toBeDefined();
      expect(result.summary).toBe("Strong potential in local e-commerce market");
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(workspaceRepo.update).toHaveBeenCalledWith(
        "ws-1",
        expect.objectContaining({ isOnboardingComplete: true }),
      );
    });

    it("should throw NotFoundException when workspace does not exist", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);

      await expect(service.generateForWorkspace("non-existent")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw InternalServerErrorException when AI call fails", async () => {
      workspaceRepo.findOne.mockResolvedValue(makeWorkspace());
      mockCompleteJson.mockRejectedValue(new Error("AI provider unavailable"));

      await expect(service.generateForWorkspace("ws-1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("generateStrategy", () => {
    it("should normalize budget allocation if it does not sum to 100%", async () => {
      const strategyWithBadBudget = {
        ...makeStrategy(),
        budgetAllocation: { meta: 50, google: 30, tiktok: 30 }, // sums to 110%
      };

      mockCompleteJson.mockResolvedValue(strategyWithBadBudget);

      const input: StrategyInput = {
        businessName: "Test",
        industry: "Retail",
        productDescription: "Product",
        targetAudience: "Adults",
        monthlyBudget: 500,
        goal: "sales",
        location: "Uzbekistan",
      };

      const result = await service.generateStrategy(input);

      const total = Object.values(result.budgetAllocation).reduce((a, b) => a + b, 0);
      expect(Math.abs(total - 100)).toBeLessThanOrEqual(3); // within rounding margin
    });

    it("should add generatedAt timestamp", async () => {
      mockCompleteJson.mockResolvedValue(makeStrategy());

      const input: StrategyInput = {
        businessName: "Test",
        industry: "Tech",
        productDescription: "Software",
        targetAudience: "Businesses",
        monthlyBudget: 1000,
        goal: "leads",
        location: "Uzbekistan",
      };

      const result = await service.generateStrategy(input);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });
});
