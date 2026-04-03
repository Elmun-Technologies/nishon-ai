import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { AutoOptimizationService } from "./auto-optimization.service";
import { OptimizerAgentService } from "./optimizer-agent.service";
import { OptimizationRun } from "./entities/optimization-run.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

const mockCompleteJsonOpt = jest.fn();

jest.mock("@performa/ai-sdk", () => ({
  PerformaAiClient: jest.fn().mockImplementation(() => ({
    completeJson: mockCompleteJsonOpt,
  })),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoOptimizationService,
        OptimizerAgentService,
        {
          provide: getRepositoryToken(OptimizationRun),
          useValue: mockRepo(),
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockRepo(),
        },
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
});
