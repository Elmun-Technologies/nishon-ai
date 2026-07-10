import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { DecisionLoopService } from "./decision-loop.service";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { MetaCampaignSync } from "../meta/entities/meta-campaign-sync.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import * as cryptoUtil from "../common/crypto.util";
import { AutopilotMode, AiDecisionAction } from "@adspectr/shared";

const mockCompleteJson = jest.fn();
const mockDecisionAiClient = { completeJson: mockCompleteJson };

jest.mock("@adspectr/ai-sdk", () => ({
  AdSpectrAiClient: jest.fn().mockImplementation(() => mockDecisionAiClient),
  createAdSpectrAiClientFromEnv: jest.fn(() => mockDecisionAiClient),
  isAiClientConfigured: jest.fn(() => true),
  OPTIMIZATION_SYSTEM_PROMPT: "mock prompt",
}));

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn((data: any) => Promise.resolve({ ...data, id: "decision-1" })),
  update: jest.fn().mockResolvedValue({}),
});

/** Returns a query-builder mock whose getRawMany resolves to `rows`. */
function insightQb(rows: any[]) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
}

const ACTIVE_CAMPAIGN = { id: "meta-camp-1", name: "Summer", status: "ACTIVE" };
const INSIGHT_ROW = {
  campaignid: "meta-camp-1",
  spend: "140",
  clicks: "70",
  impressions: "2000",
  conversions: "4",
  revenue: "120",
};

describe("DecisionLoopService", () => {
  let service: DecisionLoopService;
  let workspaceRepo: any;
  let decisionRepo: any;
  let accountRepo: any;
  let metaCampaignRepo: any;
  let metaInsightRepo: any;
  let metaConnector: jest.Mocked<Partial<MetaConnector>>;

  beforeEach(async () => {
    mockCompleteJson.mockReset();
    workspaceRepo = mockRepo();
    decisionRepo = mockRepo();
    accountRepo = mockRepo();
    metaCampaignRepo = mockRepo();
    metaInsightRepo = mockRepo();
    metaInsightRepo.createQueryBuilder = jest.fn(() =>
      insightQb([INSIGHT_ROW]),
    );

    metaConnector = {
      pauseCampaign: jest.fn().mockResolvedValue(undefined),
      updateCampaignBudget: jest.fn().mockResolvedValue(undefined),
      getCampaign: jest.fn().mockResolvedValue({
        id: "meta-camp-1",
        name: "Summer",
        status: "ACTIVE",
        dailyBudget: 20,
      }),
    };

    // The connected account token is decrypted before use — stub it.
    jest.spyOn(cryptoUtil, "decrypt").mockReturnValue("plain-token");
    jest
      .spyOn(cryptoUtil, "resolveEncryptionKey")
      .mockReturnValue("0".repeat(32));
    accountRepo.findOne.mockResolvedValue({
      accessToken: "enc",
      externalAccountId: "act_1",
      isActive: true,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionLoopService,
        { provide: getRepositoryToken(AiDecision), useValue: decisionRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: accountRepo,
        },
        {
          provide: getRepositoryToken(MetaCampaignSync),
          useValue: metaCampaignRepo,
        },
        { provide: getRepositoryToken(MetaInsight), useValue: metaInsightRepo },
        { provide: MetaConnector, useValue: metaConnector },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === "OPENAI_API_KEY") return "sk-test-key";
              if (key === "ENCRYPTION_KEY") return "0".repeat(32);
              return def ?? "";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DecisionLoopService>(DecisionLoopService);
  });

  const ws = (autopilotMode: AutopilotMode) => ({ id: "ws-1", autopilotMode });

  const respondWith = (action: string, extra: Record<string, any> = {}) =>
    mockCompleteJson.mockResolvedValue({
      decisions: [
        {
          action,
          targetId: "meta-camp-1",
          targetType: "campaign",
          reason: "reason",
          estimatedImpact: "$50 saved",
          urgency: "high",
          ...extra,
        },
      ],
      overallAssessment: "ok",
      nextReviewIn: "2h",
    });

  it("is defined", () => expect(service).toBeDefined());

  it("returns [] when the workspace is missing", async () => {
    workspaceRepo.findOne.mockResolvedValue(null);
    expect(await service.runForWorkspace("nope")).toEqual([]);
  });

  it("returns [] when there are no active synced Meta campaigns", async () => {
    workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.ASSISTED));
    metaCampaignRepo.find.mockResolvedValue([]);
    expect(await service.runForWorkspace("ws-1")).toEqual([]);
    expect(mockCompleteJson).not.toHaveBeenCalled();
  });

  it("reads real Meta data and stamps the decision with target + confidence + impact", async () => {
    workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.ASSISTED));
    metaCampaignRepo.find.mockResolvedValue([ACTIVE_CAMPAIGN]);
    respondWith(AiDecisionAction.PAUSE_AD);

    await service.runForWorkspace("ws-1");

    const saved = decisionRepo.save.mock.calls[0][0];
    expect(saved.targetExternalId).toBe("meta-camp-1");
    expect(saved.targetPlatform).toBe("meta");
    expect(typeof saved.confidence).toBe("number");
    // PAUSE impact = last-7d spend / 7 = 140 / 7 = 20
    expect(saved.impactUsd).toBe(20);
  });

  describe("governance gating by autopilot mode", () => {
    beforeEach(() => {
      metaCampaignRepo.find.mockResolvedValue([ACTIVE_CAMPAIGN]);
    });

    it("MANUAL: proposes only, never executes", async () => {
      workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.MANUAL));
      respondWith(AiDecisionAction.PAUSE_AD);
      const [d] = await service.runForWorkspace("ws-1");
      expect(d.isApproved).toBeNull();
      expect(metaConnector.pauseCampaign).not.toHaveBeenCalled();
    });

    it("ASSISTED: queues HIGH-risk (budget/pause) for approval, does not execute", async () => {
      workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.ASSISTED));
      respondWith(AiDecisionAction.SCALE_BUDGET);
      const [d] = await service.runForWorkspace("ws-1");
      expect(d.isApproved).toBeNull();
      expect(metaConnector.updateCampaignBudget).not.toHaveBeenCalled();
    });

    it("ASSISTED: auto-applies LOW-risk actions", async () => {
      workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.ASSISTED));
      respondWith(AiDecisionAction.GENERATE_STRATEGY);
      await service.runForWorkspace("ws-1");
      // low-risk auto-applied → decision executed (no platform call for strategy)
      expect(decisionRepo.update).toHaveBeenCalledWith(
        "decision-1",
        expect.objectContaining({ isExecuted: true }),
      );
    });

    it("FULL_AUTO: executes a pause on the real Meta campaign", async () => {
      workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.FULL_AUTO));
      respondWith(AiDecisionAction.PAUSE_AD);
      await service.runForWorkspace("ws-1");
      expect(metaConnector.pauseCampaign).toHaveBeenCalledWith(
        "meta-camp-1",
        "plain-token",
      );
    });

    it("FULL_AUTO: scales budget off the current Meta value (+30%)", async () => {
      workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.FULL_AUTO));
      respondWith(AiDecisionAction.SCALE_BUDGET);
      await service.runForWorkspace("ws-1");
      expect(metaConnector.getCampaign).toHaveBeenCalled();
      // current 20 × 1.3 = 26
      expect(metaConnector.updateCampaignBudget).toHaveBeenCalledWith(
        "meta-camp-1",
        "plain-token",
        26,
      );
    });
  });

  it("skips no_action decisions", async () => {
    workspaceRepo.findOne.mockResolvedValue(ws(AutopilotMode.ASSISTED));
    metaCampaignRepo.find.mockResolvedValue([ACTIVE_CAMPAIGN]);
    respondWith("no_action");
    await service.runForWorkspace("ws-1");
    expect(decisionRepo.save).not.toHaveBeenCalled();
  });
});
