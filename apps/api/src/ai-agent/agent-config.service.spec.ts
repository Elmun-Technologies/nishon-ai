import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { AgentConfigService } from "./agent-config.service";
import { AgentConfig } from "./entities/agent-config.entity";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

const mockConfigRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn((data: any) => Promise.resolve({ id: "cfg-1", ...data })),
});

const mockWorkspaceRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn((data: any) => Promise.resolve(data)),
});

const mockDecisionRepo = () => ({
  create: jest.fn((data: any) => data),
  save: jest.fn((data: any) => Promise.resolve({ id: "dec-1", ...data })),
});

describe("AgentConfigService", () => {
  let service: AgentConfigService;
  let configRepo: ReturnType<typeof mockConfigRepo>;
  let workspaceRepo: ReturnType<typeof mockWorkspaceRepo>;
  let decisionRepo: ReturnType<typeof mockDecisionRepo>;

  beforeEach(async () => {
    configRepo = mockConfigRepo();
    workspaceRepo = mockWorkspaceRepo();
    decisionRepo = mockDecisionRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentConfigService,
        { provide: getRepositoryToken(AgentConfig), useValue: configRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(AiDecision), useValue: decisionRepo },
      ],
    }).compile();

    service = module.get(AgentConfigService);
  });

  it("rejects saving against a non-existent workspace", async () => {
    workspaceRepo.findOne.mockResolvedValue(null);
    await expect(
      service.saveConfig("ws-missing", { goal: "sales", budget: 2000 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("computes and snapshots the funnel allocation from goal + budget", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1" });
    configRepo.findOne.mockResolvedValue(null);

    const saved = await service.saveConfig("ws-1", {
      goal: "sales",
      budget: 2000,
      link: " https://shop.uz/x ",
      stopLossUsd: 40,
    });

    expect(saved.goal).toBe("sales");
    expect(saved.budget).toBe(2000);
    expect(saved.stopLossUsd).toBe(40);
    // link is trimmed
    expect(saved.link).toBe("https://shop.uz/x");
    // allocation reconciles exactly to the budget
    const total = saved.allocation!.stages.reduce((s, st) => s + st.amount, 0);
    expect(total).toBe(2000);
    expect(saved.activatedAt).toBeInstanceOf(Date);
  });

  it("syncs stop-loss + budget into the workspace optimization policy", async () => {
    const workspace: Partial<Workspace> = {
      id: "ws-1",
      monthlyBudget: null,
      optimizationPolicy: null,
    };
    workspaceRepo.findOne.mockResolvedValue(workspace);
    configRepo.findOne.mockResolvedValue(null);

    await service.saveConfig("ws-1", {
      goal: "brand",
      budget: 5000,
      stopLossUsd: 25,
    });

    expect(workspaceRepo.save).toHaveBeenCalledTimes(1);
    const savedWs = workspaceRepo.save.mock.calls[0][0] as Workspace;
    expect(savedWs.monthlyBudget).toBe(5000);
    expect(savedWs.optimizationPolicy?.stopLossMinSpendUsd).toBe(25);
    expect(savedWs.optimizationPolicy?.allowAutoStopLossPause).toBe(true);
    expect(savedWs.optimizationPolicy?.allowAutoPauseCreative).toBe(true);
  });

  it("preserves existing policy fields (e.g. protected campaigns) on update", async () => {
    const workspace: Partial<Workspace> = {
      id: "ws-1",
      optimizationPolicy: {
        allowAutoBudgetChange: true,
        maxAutoBudgetChangePct: 20,
        allowAutoCreativeRefresh: true,
        allowAutoPauseCreative: false,
        allowAutoStopLossPause: false,
        allowAudienceChanges: false,
        protectedCampaignIds: ["camp-keep"],
        protectedAdSetIds: [],
      },
    };
    workspaceRepo.findOne.mockResolvedValue(workspace);
    configRepo.findOne.mockResolvedValue(null);

    await service.saveConfig("ws-1", { goal: "sales", budget: 1000 });

    const savedWs = workspaceRepo.save.mock.calls[0][0] as Workspace;
    expect(savedWs.optimizationPolicy?.protectedCampaignIds).toEqual([
      "camp-keep",
    ]);
    // the user's existing autonomous budget-change preference is kept
    expect(savedWs.optimizationPolicy?.allowAutoBudgetChange).toBe(true);
    expect(savedWs.optimizationPolicy?.maxAutoBudgetChangePct).toBe(20);
    // default stop-loss applied when omitted
    expect(savedWs.optimizationPolicy?.stopLossMinSpendUsd).toBe(30);
  });

  it("upserts — an existing config keeps its original activatedAt", async () => {
    const original = new Date("2026-01-01T00:00:00.000Z");
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1" });
    configRepo.findOne.mockResolvedValue({
      id: "cfg-1",
      workspaceId: "ws-1",
      activatedAt: original,
    });

    const saved = await service.saveConfig("ws-1", {
      goal: "sales",
      budget: 3000,
    });

    expect(saved.activatedAt).toEqual(original);
  });

  it("getConfig returns null when the agent was never set up", async () => {
    configRepo.findOne.mockResolvedValue(null);
    await expect(service.getConfig("ws-1")).resolves.toBeNull();
  });

  it("records an AI decision on first activation", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1" });
    configRepo.findOne.mockResolvedValue(null);

    await service.saveConfig("ws-1", { goal: "sales", budget: 2000 });

    expect(decisionRepo.save).toHaveBeenCalledTimes(1);
    const decision = decisionRepo.save.mock.calls[0][0];
    expect(decision.workspaceId).toBe("ws-1");
    expect(decision.isExecuted).toBe(true);
    expect(decision.reason).toContain("faollashtirildi");
    expect(decision.afterState.allocation).toBeDefined();
  });

  it("records a decision when the plan materially changes", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1" });
    configRepo.findOne.mockResolvedValue({
      id: "cfg-1",
      workspaceId: "ws-1",
      goal: "sales",
      budget: 2000,
      stopLossUsd: 30,
      activatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await service.saveConfig("ws-1", { goal: "brand", budget: 5000 });

    expect(decisionRepo.save).toHaveBeenCalledTimes(1);
    expect(decisionRepo.save.mock.calls[0][0].reason).toContain(
      "rejasi yangilandi",
    );
  });

  it("does not record a decision on a no-op re-save", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1" });
    configRepo.findOne.mockResolvedValue({
      id: "cfg-1",
      workspaceId: "ws-1",
      goal: "sales",
      budget: 2000,
      stopLossUsd: 30,
      activatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await service.saveConfig("ws-1", {
      goal: "sales",
      budget: 2000,
      stopLossUsd: 30,
    });

    expect(decisionRepo.save).not.toHaveBeenCalled();
  });

  it("still saves the config if decision logging throws", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1" });
    configRepo.findOne.mockResolvedValue(null);
    decisionRepo.save.mockRejectedValue(new Error("db down"));

    const saved = await service.saveConfig("ws-1", {
      goal: "sales",
      budget: 1000,
    });
    expect(saved.budget).toBe(1000);
  });
});
