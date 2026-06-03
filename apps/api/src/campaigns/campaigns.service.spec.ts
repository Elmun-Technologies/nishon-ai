import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { Campaign } from "./entities/campaign.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { CampaignStatus, BudgetType, Platform } from "@adspectr/shared";

const OWNER = "owner-1";
const ATTACKER = "attacker-2";

describe("CampaignsService", () => {
  let service: CampaignsService;
  let campaignRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let workspaceRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    campaignRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: "c-1", ...d })),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    workspaceRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: getRepositoryToken(Campaign), useValue: campaignRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
      ],
    }).compile();

    service = module.get(CampaignsService);
  });

  describe("findAllByWorkspace — ownership", () => {
    it("returns campaigns to the owner DESC and pulls adSets relation", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      campaignRepo.find.mockResolvedValue([{ id: "c-1" }]);
      const out = await service.findAllByWorkspace("ws-1", OWNER);
      expect(out).toHaveLength(1);
      expect(campaignRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: "ws-1" },
          order: { createdAt: "DESC" },
          relations: ["adSets"],
        }),
      );
    });

    it("denies a non-owner with ForbiddenException and reads nothing", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.findAllByWorkspace("ws-1", ATTACKER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(campaignRepo.find).not.toHaveBeenCalled();
    });

    it("404s when the workspace does not exist", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findAllByWorkspace("ghost", OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findOne — ownership via the campaign's workspace", () => {
    it("returns the campaign with adSets, ads, and workspace relations", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        workspace: { id: "ws-1", userId: OWNER },
      });
      const out = await service.findOne("c-1", OWNER);
      expect(out.id).toBe("c-1");
      expect(campaignRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "c-1" },
          relations: ["adSets", "adSets.ads", "workspace"],
        }),
      );
    });

    it("denies someone who doesn't own the campaign's workspace", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        workspace: { id: "ws-1", userId: OWNER },
      });
      await expect(service.findOne("c-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("404s when the campaign id is unknown", async () => {
      campaignRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne("ghost", OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create — budget conversion", () => {
    it("daily budget maps 1:1 to dailyBudget", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await service.create("ws-1", OWNER, {
        name: "X",
        platform: Platform.META,
        budget: 70,
        budgetType: BudgetType.DAILY,
      } as any);
      const saved = campaignRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.dailyBudget).toBe(70);
      expect(saved.totalBudget).toBeNull();
      expect(saved.workspaceId).toBe("ws-1");
    });

    it("weekly budget is divided by 7 to derive dailyBudget", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await service.create("ws-1", OWNER, {
        name: "X",
        platform: Platform.META,
        budget: 70,
        budgetType: BudgetType.WEEKLY,
      } as any);
      const saved = campaignRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.dailyBudget).toBe(10);
    });

    it("missing budget defaults to 0 instead of NaN", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await service.create("ws-1", OWNER, {
        name: "X",
        platform: Platform.META,
        budgetType: BudgetType.DAILY,
      } as any);
      const saved = campaignRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.dailyBudget).toBe(0);
    });

    it("refuses creation for a non-owner before any write", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.create("ws-1", ATTACKER, {
          name: "X",
          platform: Platform.META,
          budget: 10,
          budgetType: BudgetType.DAILY,
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(campaignRepo.save).not.toHaveBeenCalled();
    });

    it("404s when workspace does not exist (no write)", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create("ghost", OWNER, {
          name: "X",
          platform: Platform.META,
          budget: 10,
          budgetType: BudgetType.DAILY,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(campaignRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("sets the status on the owner's campaign and persists", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        status: CampaignStatus.DRAFT,
        workspace: { id: "ws-1", userId: OWNER },
      });
      campaignRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.updateStatus(
        "c-1",
        OWNER,
        CampaignStatus.ACTIVE,
      );
      expect(out.status).toBe(CampaignStatus.ACTIVE);
      expect(campaignRepo.save).toHaveBeenCalledTimes(1);
    });

    it("a non-owner cannot update status", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        status: CampaignStatus.DRAFT,
        workspace: { id: "ws-1", userId: OWNER },
      });
      await expect(
        service.updateStatus("c-1", ATTACKER, CampaignStatus.PAUSED),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(campaignRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("updateBudget", () => {
    it("sets the dailyBudget on the owner's campaign and persists", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        dailyBudget: 10,
        workspace: { id: "ws-1", userId: OWNER },
      });
      campaignRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.updateBudget("c-1", OWNER, 25);
      expect(out.dailyBudget).toBe(25);
    });

    it("a non-owner cannot update budget", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        dailyBudget: 10,
        workspace: { id: "ws-1", userId: OWNER },
      });
      await expect(
        service.updateBudget("c-1", ATTACKER, 25),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(campaignRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("removes the owner's campaign", async () => {
      const campaign = {
        id: "c-1",
        workspace: { id: "ws-1", userId: OWNER },
      };
      campaignRepo.findOne.mockResolvedValue(campaign);
      await service.delete("c-1", OWNER);
      expect(campaignRepo.remove).toHaveBeenCalledWith(campaign);
    });

    it("refuses to delete someone else's campaign", async () => {
      campaignRepo.findOne.mockResolvedValue({
        id: "c-1",
        workspace: { id: "ws-1", userId: OWNER },
      });
      await expect(service.delete("c-1", ATTACKER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(campaignRepo.remove).not.toHaveBeenCalled();
    });
  });
});
