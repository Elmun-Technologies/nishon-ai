import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MetaAuditService } from "./meta-audit.service";
import { MetaInsight } from "./entities/meta-insight.entity";
import { MetaCampaignSync } from "./entities/meta-campaign-sync.entity";
import { MetaAdAccount } from "./entities/meta-ad-account.entity";

/**
 * These tests pin the audit rules. They run the service against a
 * synthetic insight/campaign fixture and assert that the detection
 * rules produce the expected findings.
 */
describe("MetaAuditService", () => {
  let service: MetaAuditService;
  let insightRepo: any;
  let campaignRepo: any;

  beforeEach(async () => {
    const insightQB = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      }),
    };
    insightRepo = {
      createQueryBuilder: jest.fn(() => insightQB),
    };
    campaignRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaAuditService,
        { provide: getRepositoryToken(MetaInsight), useValue: insightRepo },
        {
          provide: getRepositoryToken(MetaCampaignSync),
          useValue: campaignRepo,
        },
        { provide: getRepositoryToken(MetaAdAccount), useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => undefined) },
        },
      ],
    }).compile();

    service = module.get(MetaAuditService);
  });

  function withFixture(
    campaigns: Array<Partial<MetaCampaignSync>>,
    insights: Array<{
      campaignId: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>,
  ) {
    campaignRepo.find.mockResolvedValue(campaigns);
    const qb = insightRepo.createQueryBuilder();
    qb.getRawMany.mockResolvedValue(insights);
  }

  it("flags ZERO_CLICKS on $50+ campaigns and surfaces it as critical", async () => {
    withFixture(
      [
        {
          id: "c1",
          name: "Cold Sales",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "act_1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "c1",
          spend: 80,
          impressions: 5000,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        },
      ],
    );

    const r = await service.runAudit("ws", 30);
    const camp = r.campaigns[0];
    expect(camp.flags).toContain("ZERO_CLICKS");
    expect(r.findings.find((f) => f.id === "zero_clicks")).toBeTruthy();
    expect(r.findings.find((f) => f.id === "zero_clicks")?.severity).toBe(
      "critical",
    );
  });

  it("flags LOSING_ROAS when spend > 200 and roas < 1", async () => {
    withFixture(
      [
        {
          id: "c1",
          name: "Bad",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "act_1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "c1",
          spend: 300,
          impressions: 10000,
          clicks: 100,
          conversions: 1,
          revenue: 50,
        },
      ],
    );
    const r = await service.runAudit("ws", 30);
    expect(r.campaigns[0].flags).toContain("LOSING_ROAS");
    expect(r.findings.some((f) => f.id === "losing_roas")).toBe(true);
  });

  it("flags HEALTHY_ROAS as a positive 'good' finding", async () => {
    withFixture(
      [
        {
          id: "c1",
          name: "Winner",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "act_1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "c1",
          spend: 100,
          impressions: 5000,
          clicks: 200,
          conversions: 10,
          revenue: 400,
        },
      ],
    );
    const r = await service.runAudit("ws", 30);
    expect(r.campaigns[0].flags).toContain("HEALTHY_ROAS");
    const good = r.findings.find((f) => f.id === "healthy_winners");
    expect(good?.severity).toBe("good");
  });

  it("flags ACTIVE campaigns that produced zero spend (delivery problem)", async () => {
    withFixture(
      [
        {
          id: "c1",
          name: "Stalled 1",
          status: "ACTIVE",
          objective: "OUTCOME_LEADS",
          adAccountId: "a",
          workspaceId: "ws",
        } as any,
        {
          id: "c2",
          name: "Stalled 2",
          status: "ACTIVE",
          objective: "OUTCOME_LEADS",
          adAccountId: "a",
          workspaceId: "ws",
        } as any,
      ],
      [], // no insights at all
    );
    const r = await service.runAudit("ws", 30);
    expect(r.campaigns.every((c) => c.flags.includes("ACTIVE_NO_SPEND"))).toBe(
      true,
    );
    const f = r.findings.find((x) => x.id === "active_no_spend");
    expect(f).toBeTruthy();
    expect(f?.detail).toMatch(/Stalled 1/);
  });

  it("detects spend concentration when one campaign is ≥ 60% of total", async () => {
    withFixture(
      [
        {
          id: "a",
          name: "Whale",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "1",
          workspaceId: "ws",
        } as any,
        {
          id: "b",
          name: "Minnow",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "a",
          spend: 800,
          impressions: 10000,
          clicks: 200,
          conversions: 5,
          revenue: 1000,
        },
        {
          campaignId: "b",
          spend: 100,
          impressions: 2000,
          clicks: 30,
          conversions: 1,
          revenue: 80,
        },
      ],
    );
    const r = await service.runAudit("ws", 30);
    const f = r.findings.find((x) => x.id === "spend_concentration");
    expect(f).toBeTruthy();
    expect(f?.campaignId).toBe("a");
  });

  it("computes period-over-period deltas from prior-period insights", async () => {
    withFixture(
      [
        {
          id: "c1",
          name: "X",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "c1",
          spend: 200,
          impressions: 4000,
          clicks: 80,
          conversions: 10,
          revenue: 600,
        },
      ],
    );
    // Mock prior-period totals
    const qb = insightRepo.createQueryBuilder();
    qb.getRawOne.mockResolvedValue({
      spend: 100,
      impressions: 2000,
      clicks: 30,
      conversions: 5,
      revenue: 200,
    });

    const r = await service.runAudit("ws", 30);
    expect(r.priorTotals.spend).toBe(100);
    expect(r.priorTotals.revenue).toBe(200);
    expect(r.deltas.spendPct).toBe(100); // doubled
    expect(r.deltas.revenuePct).toBe(200); // tripled
  });

  it("returns priorTotals.spend = 0 and deltas.spendPct = null when no prior data exists", async () => {
    withFixture(
      [
        {
          id: "c1",
          name: "X",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "c1",
          spend: 50,
          impressions: 1000,
          clicks: 20,
          conversions: 0,
          revenue: 0,
        },
      ],
    );
    const r = await service.runAudit("ws", 30);
    expect(r.priorTotals.spend).toBe(0);
    expect(r.deltas.spendPct).toBeNull();
  });

  it("yields a low score and 'poor' label when critical issues stack up", async () => {
    withFixture(
      [
        {
          id: "a",
          name: "Disaster",
          status: "ACTIVE",
          objective: "OUTCOME_SALES",
          adAccountId: "1",
          workspaceId: "ws",
        } as any,
      ],
      [
        {
          campaignId: "a",
          spend: 500,
          impressions: 100000,
          clicks: 100,
          conversions: 0,
          revenue: 0,
        },
      ],
    );
    const r = await service.runAudit("ws", 30);
    expect(r.score).toBeLessThan(50);
    expect(r.scoreLabel).toBe("poor");
  });
});
