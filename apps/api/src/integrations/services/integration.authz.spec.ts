import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { IntegrationService } from "./integration.service";

/**
 * IDOR regression tests: a connection may only be read/mutated by a user who
 * owns the workspace it belongs to. Before this fix, handlers relied on the
 * never-populated `req.workspace?.id`, so any user could reach any tenant's
 * connection (including its encrypted OAuth tokens).
 */
describe("IntegrationService — connection ownership", () => {
  const OWNER = "user-owner";
  const OTHER = "user-attacker";

  let connectionRepo: { findOne: jest.Mock; find: jest.Mock };
  let workspaceRepo: { findOne: jest.Mock; find: jest.Mock };
  let service: IntegrationService;

  beforeEach(() => {
    connectionRepo = { findOne: jest.fn(), find: jest.fn() };
    workspaceRepo = { findOne: jest.fn(), find: jest.fn() };
    const noop = {} as any;

    service = new IntegrationService(
      connectionRepo as any,
      noop, // configRepository
      noop, // syncLogRepository
      noop, // encryptionService
      noop, // amoCrmConnector
      noop, // conversionToLeadSync
      noop, // dealPullSync
      workspaceRepo as any,
    );
  });

  describe("assertConnectionOwner", () => {
    it("returns the connection for the owning user", async () => {
      connectionRepo.findOne.mockResolvedValue({
        id: "c-1",
        workspaceId: "ws-1",
      });
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.assertConnectionOwner("c-1", OWNER),
      ).resolves.toMatchObject({ id: "c-1" });
    });

    it("throws Forbidden for a different tenant", async () => {
      connectionRepo.findOne.mockResolvedValue({
        id: "c-1",
        workspaceId: "ws-1",
      });
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(service.assertConnectionOwner("c-1", OTHER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws NotFound when the connection does not exist", async () => {
      connectionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assertConnectionOwner("ghost", OWNER),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws Forbidden when the workspace is missing or unowned", async () => {
      connectionRepo.findOne.mockResolvedValue({
        id: "c-1",
        workspaceId: "ws-x",
      });
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(service.assertConnectionOwner("c-1", OWNER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws Forbidden when userId is missing", async () => {
      await expect(service.assertConnectionOwner("c-1", "")).rejects.toThrow(
        ForbiddenException,
      );
      expect(connectionRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe("listConnectionsForUser", () => {
    it("returns [] when the user owns no workspaces (no cross-tenant leak)", async () => {
      workspaceRepo.find.mockResolvedValue([]);
      await expect(service.listConnectionsForUser(OWNER)).resolves.toEqual([]);
      expect(connectionRepo.find).not.toHaveBeenCalled();
    });

    it("scopes the query to the user's workspace ids", async () => {
      workspaceRepo.find.mockResolvedValue([{ id: "ws-1" }, { id: "ws-2" }]);
      connectionRepo.find.mockResolvedValue([{ id: "c-1" }]);
      await service.listConnectionsForUser(OWNER);
      const arg = connectionRepo.find.mock.calls[0][0];
      // where.workspaceId is an In([...]) operator over the owned ids.
      expect(JSON.stringify(arg.where.workspaceId)).toContain("ws-1");
      expect(JSON.stringify(arg.where.workspaceId)).toContain("ws-2");
    });
  });
});
