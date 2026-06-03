import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AiDecisionsService } from "./ai-decisions.service";
import { AiDecision } from "./entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { AiDecisionAction } from "@adspectr/shared";

const OWNER = "owner-1";
const ATTACKER = "attacker-2";

describe("AiDecisionsService", () => {
  let service: AiDecisionsService;
  let decisionRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let workspaceRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    decisionRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: "d-1", ...d })),
    };
    workspaceRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiDecisionsService,
        { provide: getRepositoryToken(AiDecision), useValue: decisionRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
      ],
    }).compile();

    service = module.get(AiDecisionsService);
  });

  describe("findAllByWorkspace — ownership", () => {
    it("returns decisions to the owner ordered by createdAt DESC", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      decisionRepo.find.mockResolvedValue([{ id: "d-1" }]);
      const out = await service.findAllByWorkspace("ws-1", OWNER);
      expect(out).toHaveLength(1);
      expect(decisionRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: "ws-1" },
          order: { createdAt: "DESC" },
        }),
      );
    });

    it("denies a non-owner with ForbiddenException and reads nothing", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.findAllByWorkspace("ws-1", ATTACKER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(decisionRepo.find).not.toHaveBeenCalled();
    });

    it("404s when the workspace does not exist", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findAllByWorkspace("ghost", OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findOne — ownership via the decision's workspace", () => {
    it("returns the decision to its workspace owner", async () => {
      decisionRepo.findOne.mockResolvedValue({
        id: "d-1",
        workspace: { id: "ws-1", userId: OWNER },
      });
      const out = await service.findOne("d-1", OWNER);
      expect(out.id).toBe("d-1");
    });

    it("denies someone who doesn't own the decision's workspace", async () => {
      decisionRepo.findOne.mockResolvedValue({
        id: "d-1",
        workspace: { id: "ws-1", userId: OWNER },
      });
      await expect(service.findOne("d-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("404s when the decision id is unknown", async () => {
      decisionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne("ghost", OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("persists a new decision as pending (isApproved null, isExecuted false)", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await service.create(
        "ws-1",
        OWNER,
        AiDecisionAction.PAUSE_AD,
        "ctr dropped",
      );
      expect(decisionRepo.save).toHaveBeenCalled();
      const saved = decisionRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.isApproved).toBeNull();
      expect(saved.isExecuted).toBe(false);
      expect(saved.actionType).toBe(AiDecisionAction.PAUSE_AD);
      expect(saved.reason).toBe("ctr dropped");
    });

    it("refuses creation for a non-owner before any write", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.create("ws-1", ATTACKER, AiDecisionAction.PAUSE_AD, "x"),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(decisionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("approve / reject", () => {
    it("approve marks isApproved=true and isExecuted=true", async () => {
      const base = {
        id: "d-1",
        isApproved: null,
        isExecuted: false,
        workspace: { id: "ws-1", userId: OWNER },
      };
      decisionRepo.findOne.mockResolvedValue(base);
      decisionRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.approve("d-1", OWNER);
      expect(out.isApproved).toBe(true);
      expect(out.isExecuted).toBe(true);
    });

    it("reject marks isApproved=false and leaves isExecuted untouched", async () => {
      const base = {
        id: "d-1",
        isApproved: null,
        isExecuted: false,
        workspace: { id: "ws-1", userId: OWNER },
      };
      decisionRepo.findOne.mockResolvedValue(base);
      decisionRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.reject("d-1", OWNER);
      expect(out.isApproved).toBe(false);
      expect(out.isExecuted).toBe(false);
    });

    it("non-owner cannot approve or reject", async () => {
      decisionRepo.findOne.mockResolvedValue({
        id: "d-1",
        workspace: { id: "ws-1", userId: OWNER },
      });
      await expect(service.approve("d-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.reject("d-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
