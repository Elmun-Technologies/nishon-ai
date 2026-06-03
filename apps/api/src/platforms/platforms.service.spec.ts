import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PlatformsService } from "./platforms.service";
import { ConnectedAccount } from "./entities/connected-account.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { MetaConnector } from "./connectors/meta.connector";
import { GoogleConnector } from "./connectors/google.connector";
import { TiktokConnector } from "./connectors/tiktok.connector";
import { YandexConnector } from "./connectors/yandex.connector";

/**
 * Authorization (IDOR) tests: a user may only read or mutate platform
 * connections for a workspace they own.
 */
describe("PlatformsService — workspace ownership", () => {
  let service: PlatformsService;
  let workspaceRepo: { findOne: jest.Mock };
  let accountRepo: { find: jest.Mock; findOne: jest.Mock; remove: jest.Mock };
  let metaConnector: { getPages: jest.Mock };

  const OWNER = "owner-1";
  const ATTACKER = "attacker-2";

  beforeEach(async () => {
    workspaceRepo = { findOne: jest.fn() };
    accountRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: "acc-1", workspaceId: "ws-1" }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    metaConnector = {
      getPages: jest.fn().mockResolvedValue([{ id: "p1", name: "Page" }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformsService,
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: accountRepo,
        },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: MetaConnector, useValue: metaConnector },
        { provide: GoogleConnector, useValue: {} },
        { provide: TiktokConnector, useValue: {} },
        { provide: YandexConnector, useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => "0".repeat(32)) },
        },
      ],
    }).compile();

    service = module.get(PlatformsService);
  });

  describe("getConnectedAccounts", () => {
    it("returns accounts for the workspace owner", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.getConnectedAccounts("ws-1", OWNER),
      ).resolves.toEqual([]);
      expect(accountRepo.find).toHaveBeenCalled();
    });

    it("denies a non-owner (IDOR)", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.getConnectedAccounts("ws-1", ATTACKER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(accountRepo.find).not.toHaveBeenCalled();
    });

    it("404s for a missing workspace", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getConnectedAccounts("ghost", OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("getMetaPages", () => {
    it("denies a non-owner before touching the Meta API", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.getMetaPages("ws-1", ATTACKER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(metaConnector.getPages).not.toHaveBeenCalled();
    });
  });

  describe("disconnectAccount", () => {
    it("denies a non-owner before removing anything", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.disconnectAccount("ws-1", "acc-1", ATTACKER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(accountRepo.remove).not.toHaveBeenCalled();
    });

    it("lets the owner disconnect", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await service.disconnectAccount("ws-1", "acc-1", OWNER);
      expect(accountRepo.remove).toHaveBeenCalled();
    });
  });
});
