import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AiAgentService } from "./ai-agent.service";

/**
 * Authorization tests for the AI Agent surface. These lock in the cross-tenant
 * (BOLA) fix: every workspace/decision-scoped action must verify the caller
 * owns the workspace.
 */
describe("AiAgentService — authorization", () => {
  const OWNER = "user-owner";
  const OTHER = "user-attacker";

  let workspaceRepo: { findOne: jest.Mock };
  let decisionRepo: { findOne: jest.Mock };
  let service: AiAgentService;

  beforeEach(() => {
    workspaceRepo = { findOne: jest.fn() };
    decisionRepo = { findOne: jest.fn() };

    const config = { get: jest.fn(() => "sk-test") };
    const noop = {} as any;

    service = new AiAgentService(
      noop, // strategyEngine
      noop, // decisionLoop
      config as any,
      noop, // metaConnector
      decisionRepo as any,
      workspaceRepo as any,
    );
  });

  describe("assertWorkspaceOwner", () => {
    it("resolves for the workspace owner", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.assertWorkspaceOwner("ws-1", OWNER),
      ).resolves.toBeUndefined();
    });

    it("throws Forbidden for a different user (cross-tenant)", async () => {
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(service.assertWorkspaceOwner("ws-1", OTHER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws NotFound when the workspace does not exist", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assertWorkspaceOwner("ghost", OWNER),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws Forbidden when userId is missing", async () => {
      await expect(service.assertWorkspaceOwner("ws-1", "")).rejects.toThrow(
        ForbiddenException,
      );
      expect(workspaceRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe("assertDecisionAccess", () => {
    it("returns the decision for the owning user", async () => {
      decisionRepo.findOne.mockResolvedValue({
        id: "d-1",
        workspaceId: "ws-1",
      });
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(
        service.assertDecisionAccess("d-1", OWNER),
      ).resolves.toMatchObject({ id: "d-1" });
    });

    it("throws Forbidden when the decision belongs to another tenant", async () => {
      decisionRepo.findOne.mockResolvedValue({
        id: "d-1",
        workspaceId: "ws-1",
      });
      workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
      await expect(service.assertDecisionAccess("d-1", OTHER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("throws NotFound for an unknown decision id", async () => {
      decisionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assertDecisionAccess("ghost", OWNER),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
