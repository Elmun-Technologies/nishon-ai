import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AutoOptimizationService } from "./auto-optimization.service";
import { OptimizerAgentService } from "./optimizer-agent.service";
import { OptimizationRun } from "./entities/optimization-run.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

const mockCompleteJsonOpt = jest.fn();

const mockOptimizerAiClient = { completeJson: mockCompleteJsonOpt };

jest.mock("@adspectr/ai-sdk", () => ({
  AdSpectrAiClient: jest.fn().mockImplementation(() => mockOptimizerAiClient),
  createAdSpectrAiClientFromEnv: jest.fn(() => mockOptimizerAiClient),
  isAiClientConfigured: jest.fn(() => true),
}));

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((d: any) => d),
  save: jest.fn((d: any) => Promise.resolve({ ...d, id: "run-1" })),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  })),
});

describe("AutoOptimizationService", () => {
  let service: AutoOptimizationService;
  let workspaceRepoMock: ReturnType<typeof mockRepo>;
  let runRepoMock: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    workspaceRepoMock = mockRepo();
    runRepoMock = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoOptimizationService,
        OptimizerAgentService,
        { provide: getRepositoryToken(OptimizationRun), useValue: runRepoMock },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepoMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === "OPENAI_API_KEY") return "sk-test-key";
              if (key === "OPENAI_BASE_URL") return "";
              return def ?? "";
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AutoOptimizationService>(AutoOptimizationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ─── IDOR guard (fixed in PR #128) ──────────────────────────────────────
  // Both runOptimization (paid AI call) and getHistory must refuse a caller
  // who doesn't own the workspace, BEFORE touching the run repository.
  describe("workspace ownership", () => {
    const OWNER = "owner-1";
    const ATTACKER = "attacker-2";
    const minimalDto = {
      platform: "meta" as any,
      performance: { spend: 0, roas: 0, ctr: 0 } as any,
      mode: "manual" as any,
      goal: "roas" as any,
      constraints: {} as any,
    };

    it("runOptimization denies a non-owner with ForbiddenException", async () => {
      workspaceRepoMock.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
      });
      await expect(
        service.runOptimization("ws-1", minimalDto, ATTACKER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      // No optimization run was persisted.
      expect(runRepoMock.save).not.toHaveBeenCalled();
    });

    it("runOptimization 404s for a missing workspace", async () => {
      workspaceRepoMock.findOne.mockResolvedValue(null);
      await expect(
        service.runOptimization("ghost", minimalDto, OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("getHistory denies a non-owner before any history read", async () => {
      workspaceRepoMock.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
      });
      await expect(service.getHistory("ws-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(runRepoMock.find).not.toHaveBeenCalled();
    });

    it("getHistory lets the owner read", async () => {
      workspaceRepoMock.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
      });
      runRepoMock.find.mockResolvedValue([]);
      await expect(service.getHistory("ws-1", OWNER)).resolves.toEqual([]);
      expect(runRepoMock.find).toHaveBeenCalled();
    });
  });
});
