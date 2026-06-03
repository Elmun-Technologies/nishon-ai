import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";
import { Workspace } from "./entities/workspace.entity";
import { Budget, BudgetPeriod } from "../budget/entities/budget.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import { User, UserPlan } from "../users/entities/user.entity";

const OWNER = "owner-1";
const ATTACKER = "attacker-2";

describe("WorkspacesService", () => {
  let service: WorkspacesService;
  let workspaceRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    remove: jest.Mock;
  };
  let budgetRepo: { create: jest.Mock; save: jest.Mock };
  let metaInsightRepo: { createQueryBuilder: jest.Mock };
  let userRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    workspaceRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: "ws-new", ...d })),
      count: jest.fn().mockResolvedValue(0),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    budgetRepo = {
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve(d)),
    };
    metaInsightRepo = { createQueryBuilder: jest.fn() };
    userRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(Budget), useValue: budgetRepo },
        { provide: getRepositoryToken(MetaInsight), useValue: metaInsightRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(WorkspacesService);
  });

  describe("create — plan-limit enforcement", () => {
    it("free user is blocked after hitting the 1-workspace cap", async () => {
      userRepo.findOne.mockResolvedValue({ id: OWNER, plan: UserPlan.FREE });
      workspaceRepo.count.mockResolvedValue(1);
      await expect(
        service.create(OWNER, { name: "B", monthlyBudget: 100 } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(workspaceRepo.save).not.toHaveBeenCalled();
    });

    it("free user can create their first workspace and a default budget", async () => {
      userRepo.findOne.mockResolvedValue({ id: OWNER, plan: UserPlan.FREE });
      workspaceRepo.count.mockResolvedValue(0);
      await service.create(OWNER, { name: "A", monthlyBudget: 500 } as any);

      const savedWs = workspaceRepo.save.mock.calls.at(-1)?.[0];
      expect(savedWs.userId).toBe(OWNER);
      expect(savedWs.isOnboardingComplete).toBe(false);

      const savedBudget = budgetRepo.save.mock.calls.at(-1)?.[0];
      expect(savedBudget.totalBudget).toBe(500);
      expect(savedBudget.period).toBe(BudgetPeriod.MONTHLY);
      expect(savedBudget.platformSplit).toEqual({ meta: 60, google: 40 });
      expect(savedBudget.autoRebalance).toBe(true);
    });

    it("agency user (maxWorkspaces=-1) bypasses the cap check", async () => {
      userRepo.findOne.mockResolvedValue({ id: OWNER, plan: UserPlan.AGENCY });
      // Even with a huge existing count, the unlimited branch never asks.
      await service.create(OWNER, { name: "A", monthlyBudget: 100 } as any);
      expect(workspaceRepo.count).not.toHaveBeenCalled();
      expect(workspaceRepo.save).toHaveBeenCalled();
    });

    it("works even when the user row is missing (no limits applied)", async () => {
      userRepo.findOne.mockResolvedValue(null);
      await service.create(OWNER, { name: "A", monthlyBudget: 100 } as any);
      expect(workspaceRepo.count).not.toHaveBeenCalled();
      expect(workspaceRepo.save).toHaveBeenCalled();
    });
  });

  describe("findAllByUser", () => {
    it("only loads the caller's workspaces, DESC, with relations", async () => {
      workspaceRepo.find.mockResolvedValue([{ id: "ws-1" }]);
      await service.findAllByUser(OWNER);
      expect(workspaceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: OWNER },
          relations: ["connectedAccounts", "budgets"],
          order: { createdAt: "DESC" },
        }),
      );
    });
  });

  describe("findOne — ownership", () => {
    it("returns the workspace to its owner with relations", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
      });
      const out = await service.findOne("ws-1", OWNER);
      expect(out.id).toBe("ws-1");
      expect(workspaceRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ws-1" },
          relations: ["connectedAccounts", "budgets", "campaigns"],
        }),
      );
    });

    it("Forbidden for someone who doesn't own it", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
      });
      await expect(service.findOne("ws-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("404 when the id is unknown", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne("ghost", OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update — inherits ownership from findOne", () => {
    it("patches only the dto fields and persists for owner", async () => {
      const existing = {
        id: "ws-1",
        userId: OWNER,
        name: "Old",
        isOnboardingComplete: true,
      };
      workspaceRepo.findOne.mockResolvedValue(existing);
      workspaceRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.update("ws-1", OWNER, { name: "New" } as any);
      expect(out.name).toBe("New");
      // Other fields untouched.
      expect(out.isOnboardingComplete).toBe(true);
    });

    it("non-owner cannot update", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.update("ws-1", ATTACKER, { name: "X" } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("completeOnboarding", () => {
    it("flips the flag and stores the AI strategy", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
        isOnboardingComplete: false,
      });
      workspaceRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const strategy = { vertical: "ecom", channels: ["meta"] };
      const out = await service.completeOnboarding("ws-1", OWNER, strategy);
      expect(out.isOnboardingComplete).toBe(true);
      expect(out.aiStrategy).toEqual(strategy);
    });
  });

  describe("updateAutopilotMode", () => {
    it("sets the new mode for the owner", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
        autopilotMode: "MANUAL",
      });
      workspaceRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.updateAutopilotMode("ws-1", OWNER, {
        mode: "FULL_AUTO",
      } as any);
      expect(out.autopilotMode).toBe("FULL_AUTO");
    });

    it("non-owner cannot flip autopilot", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.updateAutopilotMode("ws-1", ATTACKER, {
          mode: "FULL_AUTO",
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("getPolicy / updatePolicy", () => {
    it("getPolicy returns null when the workspace has no stored policy", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
        optimizationPolicy: null,
      });
      const out = await service.getPolicy("ws-1", OWNER);
      expect(out).toBeNull();
    });

    it("updatePolicy starts from a safe-default baseline when none exists", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
        optimizationPolicy: null,
      });
      const out = await service.updatePolicy("ws-1", OWNER, {
        allowAutoBudgetChange: true,
        maxAutoBudgetChangePct: 20,
      } as any);
      // Defaults are conservative; only the patch fields were lifted.
      expect(out.allowAutoBudgetChange).toBe(true);
      expect(out.maxAutoBudgetChangePct).toBe(20);
      expect(out.allowAutoPauseCreative).toBe(false);
      expect(out.allowAudienceChanges).toBe(false);
      expect(out.protectedCampaignIds).toEqual([]);
    });

    it("updatePolicy merges over an existing policy without overwriting unrelated keys", async () => {
      workspaceRepo.findOne.mockResolvedValue({
        id: "ws-1",
        userId: OWNER,
        optimizationPolicy: {
          allowAutoBudgetChange: true,
          maxAutoBudgetChangePct: 5,
          allowAutoCreativeRefresh: true,
          allowAutoPauseCreative: false,
          allowAudienceChanges: false,
          protectedCampaignIds: ["c-vip"],
          protectedAdSetIds: [],
        },
      });
      const out = await service.updatePolicy("ws-1", OWNER, {
        maxAutoBudgetChangePct: 25,
      } as any);
      expect(out.allowAutoBudgetChange).toBe(true);
      expect(out.maxAutoBudgetChangePct).toBe(25);
      // VIP protection is preserved across the partial patch.
      expect(out.protectedCampaignIds).toEqual(["c-vip"]);
    });

    it("non-owner cannot read or write policy", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(service.getPolicy("ws-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(
        service.updatePolicy("ws-1", ATTACKER, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("delete", () => {
    it("owner can remove their workspace", async () => {
      const workspace = { id: "ws-1", userId: OWNER };
      workspaceRepo.findOne.mockResolvedValue(workspace);
      await service.delete("ws-1", OWNER);
      expect(workspaceRepo.remove).toHaveBeenCalledWith(workspace);
    });

    it("non-owner cannot remove a workspace", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(service.delete("ws-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(workspaceRepo.remove).not.toHaveBeenCalled();
    });
  });
});
