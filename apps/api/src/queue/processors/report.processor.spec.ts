import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Job } from "bull";
import { ReportProcessor } from "./report.processor";
import { Workspace } from "../../workspaces/entities/workspace.entity";
import { AiDecision } from "../../ai-decisions/entities/ai-decision.entity";
import { MetaCampaignSync } from "../../meta/entities/meta-campaign-sync.entity";
import { MetaInsight } from "../../meta/entities/meta-insight.entity";

/**
 * Returns a createQueryBuilder factory. Each builder is chainable; successive
 * getRawOne calls (across successive createQueryBuilder invocations) resolve to
 * the queued rows in order — mirroring the metrics-then-top query sequence.
 */
function queuedBuilderFactory(responses: any[]) {
  let i = 0;
  return jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(() => Promise.resolve(responses[i++])),
  }));
}

describe("ReportProcessor", () => {
  let processor: ReportProcessor;
  let workspaceRepo: any;
  let decisionRepo: any;
  let metaCampaignRepo: any;
  let metaInsightRepo: any;
  let fetchMock: jest.Mock;

  const WS = {
    id: "ws-1",
    name: "Test biznes",
    telegramChatId: "chat-123",
  };

  beforeEach(async () => {
    workspaceRepo = { findOne: jest.fn().mockResolvedValue(WS) };
    decisionRepo = { find: jest.fn(), count: jest.fn() };
    metaCampaignRepo = { count: jest.fn().mockResolvedValue(3) };
    metaInsightRepo = {
      createQueryBuilder: queuedBuilderFactory([
        { spend: "120.50", conversions: "8", revenue: "480.00" }, // metrics agg
        { name: "Summer Sale", spend: "80.00" }, // top campaign
      ]),
    };

    fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => "" });
    (global as any).fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportProcessor,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(AiDecision), useValue: decisionRepo },
        {
          provide: getRepositoryToken(MetaCampaignSync),
          useValue: metaCampaignRepo,
        },
        { provide: getRepositoryToken(MetaInsight), useValue: metaInsightRepo },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((k: string) =>
              k === "TELEGRAM_BOT_TOKEN" ? "bot-token" : undefined,
            ),
          },
        },
      ],
    }).compile();

    processor = module.get(ReportProcessor);
  });

  const job = { data: { workspaceId: "ws-1" } } as Job<{ workspaceId: string }>;
  const sentText = () => JSON.parse(fetchMock.mock.calls[0][1].body).text;

  it("skips when Telegram is not configured", async () => {
    workspaceRepo.findOne.mockResolvedValue({ ...WS, telegramChatId: null });
    decisionRepo.find.mockResolvedValue([]);
    await processor.handleDailyReport(job);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders spend/ROAS from meta insights and the top campaign name", async () => {
    decisionRepo.find.mockResolvedValue([]);
    await processor.handleDailyReport(job);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const text = sentText();
    expect(text).toContain("$120.50");
    expect(text).toContain("$480.00");
    // ROAS = 480 / 120.5 = 3.98x
    expect(text).toContain("3.98x");
    expect(text).toContain("Summer Sale");
    expect(text).toContain("3 ta"); // active campaigns
  });

  it("narrates what the agent executed and what needs approval", async () => {
    decisionRepo.find.mockResolvedValue([
      {
        isExecuted: true,
        isApproved: true,
        reason: "Auto scaled",
        impactUsd: "12",
      },
      {
        isExecuted: false,
        isApproved: null,
        reason: "Pause underperforming ad. CTR dropped",
        impactUsd: "20",
      },
    ]);

    await processor.handleDailyReport(job);
    const text = sentText();

    expect(text).toContain("1 ta"); // executed count
    expect(text).toContain("tasdiqingizni kutmoqda");
    expect(text).toContain("Pause underperforming ad"); // pending highlight (trimmed at the period)
    expect(text).not.toContain("CTR dropped"); // reason trimmed to first sentence
    expect(text).toContain("~$32"); // projected impact 12 + 20
    expect(text).toContain("ai-decisions"); // approval CTA
  });

  it("shows the calm state when the agent did nothing", async () => {
    decisionRepo.find.mockResolvedValue([]);
    await processor.handleDailyReport(job);
    expect(sentText()).toContain("aralashuv shart bo'lmadi");
  });
});
