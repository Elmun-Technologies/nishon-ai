import { ForbiddenException } from "@nestjs/common";
import { AiAgentController } from "./ai-agent.controller";

/**
 * Controller-level authorization: the competitor-analysis endpoints are
 * workspace-scoped (their body carries a workspaceId) but historically ran
 * with only a JWT guard — any authenticated user could analyze against another
 * tenant's workspace and burn paid AI. These lock in the owner check.
 */
describe("AiAgentController — competitor-analysis authz", () => {
  const OWNER = "user-owner";
  const req = { user: { id: OWNER } } as any;

  let assertWorkspaceOwner: jest.Mock;
  let analyzeCompetitor: jest.Mock;
  let analyzeCompetitorsBatch: jest.Mock;
  let controller: AiAgentController;

  beforeEach(() => {
    assertWorkspaceOwner = jest.fn().mockResolvedValue(undefined);
    analyzeCompetitor = jest.fn().mockResolvedValue({ ok: true });
    analyzeCompetitorsBatch = jest.fn().mockResolvedValue({ ok: true });

    const aiAgentService = {
      assertWorkspaceOwner,
      analyzeCompetitor,
      analyzeCompetitorsBatch,
    } as any;

    controller = new AiAgentController(aiAgentService, {} as any, {} as any);
  });

  it("checks ownership before analyzing a single competitor", async () => {
    await controller.analyzeCompetitor(req, {
      workspaceId: "ws-1",
    } as any);
    expect(assertWorkspaceOwner).toHaveBeenCalledWith("ws-1", OWNER);
    expect(analyzeCompetitor).toHaveBeenCalled();
  });

  it("checks ownership before batch analysis", async () => {
    await controller.analyzeCompetitorsBatch(req, {
      workspaceId: "ws-2",
    } as any);
    expect(assertWorkspaceOwner).toHaveBeenCalledWith("ws-2", OWNER);
    expect(analyzeCompetitorsBatch).toHaveBeenCalled();
  });

  it("does not analyze when the owner check fails (cross-tenant)", async () => {
    assertWorkspaceOwner.mockRejectedValue(new ForbiddenException());
    await expect(
      controller.analyzeCompetitor(req, { workspaceId: "ws-other" } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(analyzeCompetitor).not.toHaveBeenCalled();
  });

  it("does not run batch analysis when the owner check fails", async () => {
    assertWorkspaceOwner.mockRejectedValue(new ForbiddenException());
    await expect(
      controller.analyzeCompetitorsBatch(req, {
        workspaceId: "ws-other",
      } as any),
    ).rejects.toThrow(ForbiddenException);
    expect(analyzeCompetitorsBatch).not.toHaveBeenCalled();
  });
});
