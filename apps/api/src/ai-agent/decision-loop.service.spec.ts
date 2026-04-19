import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { DecisionLoopService } from "./decision-loop.service";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Campaign } from "../campaigns/entities/campaign.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import { GoogleConnector } from "../platforms/connectors/google.connector";
import { TiktokConnector } from "../platforms/connectors/tiktok.connector";
import { AutopilotMode, AiDecisionAction, Platform, CampaignStatus } from "@adspectr/shared";

const mockCompleteJson = jest.fn();

jest.mock("@adspectr/ai-sdk", () => ({
  AdSpectrAiClient: jest.fn().mockImplementation(() => ({
    completeJson: mockCompleteJson,
  })),
  OPTIMIZATION_SYSTEM_PROMPT: "mock prompt",
}));

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn((data: any) => Promise.resolve({ ...data, id: "decision-1" })),
  update: jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe("DecisionLoopService", () => {
  let service: DecisionLoopService;
  let campaignRepo: any;
  let workspaceRepo: any;
  let decisionRepo: any;
  let accountRepo: any;
  let metaConnector: jest.Mocked<Partial<MetaConnector>>;

  beforeEach(async () => {
    mockCompleteJson.mockReset();
    campaignRepo = mockRepo();
    workspaceRepo = mockRepo();
    decisionRepo = mockRepo();
    accountRepo = mockRepo();

    metaConnector = {
      pauseCampaign: jest.fn().mockResolvedValue(undefined),
      resumeCampaign: jest.fn().mockResolvedValue(undefined),
      updateCampaignBudget: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionLoopService,
        { provide: getRepositoryToken(AiDecision), useValue: decisionRepo },
        { provide: getRepositoryToken(Campaign), useValue: campaignRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(ConnectedAccount), useValue: accountRepo },
        { provide: MetaConnector, useValue: metaConnector },
        {
          provide: GoogleConnector,
          useValue: { updateCampaignStatus: jest.fn(), updateCampaignBudget: jest.fn() },
        },
        {
          provide: TiktokConnector,
          useValue: { pauseCampaign: jest.fn(), updateCampaignBudget: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === "OPENAI_API_KEY") return "sk-test-key";
              if (key === "OPENAI_BASE_URL") return "";
              if (key === "ENCRYPTION_KEY") return "00000000000000000000000000000000";
              return def ?? "";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DecisionLoopService>(DecisionLoopService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("runForWorkspace", () => {
    it("should return empty array when workspace not found", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);

      const result = await service.runForWorkspace("non-existent");
      expect(result).toEqual([]);
    });

    it("should return empty array when no active campaigns", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", autopilotMode: AutopilotMode.ASSISTED });
      campaignRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.runForWorkspace("ws-1");
      expect(result).toEqual([]);
    });

    it("should skip decisions with no_action type", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        autopilotMode: AutopilotMode.ASSISTED,
      });

      campaignRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: "camp-1",
            name: "Test",
            platform: Platform.META,
            dailyBudget: 10,
            adSets: [],
          },
        ]),
      });

      mockCompleteJson.mockResolvedValue({
        decisions: [
          { action: "no_action", targetId: "camp-1", targetType: "campaign", reason: "All good", estimatedImpact: "None", urgency: "low" },
        ],
        overallAssessment: "Healthy",
        nextReviewIn: "2h",
      });

      const result = await service.runForWorkspace("ws-1");
      // no_action decisions are skipped
      expect(decisionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("executeDecision", () => {
    it("should mark decision as executed even without campaign", async () => {
      const decision: any = {
        id: "decision-1",
        actionType: AiDecisionAction.PAUSE_AD,
        campaignId: null,
        reason: "Test",
      };

      campaignRepo.findOne.mockResolvedValue(null);

      await service.executeDecision(decision);

      expect(decisionRepo.update).toHaveBeenCalledWith(
        "decision-1",
        expect.objectContaining({ isExecuted: true, isApproved: true }),
      );
    });
  });
});
