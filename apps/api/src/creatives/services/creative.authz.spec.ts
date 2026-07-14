import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CreativeService } from "./creative.service";

/**
 * IDOR regression tests: a creative may only be read/updated/deleted by a user
 * who owns the workspace it belongs to. Before this fix, handlers looked a
 * creative up by id alone, so any authenticated user could act on any tenant's
 * creative.
 */
describe("CreativeService — ownership", () => {
  const OWNER = "user-owner";
  const OTHER = "user-attacker";

  let creativeRepo: { findOne: jest.Mock; find: jest.Mock };
  let workspaceRepo: { findOne: jest.Mock; find: jest.Mock };
  let service: CreativeService;

  beforeEach(() => {
    creativeRepo = { findOne: jest.fn(), find: jest.fn() };
    workspaceRepo = { findOne: jest.fn(), find: jest.fn() };
    const noop = {} as any;
    // config.get returns undefined → no OpenAI client (fine for authz tests).
    const config = { get: jest.fn(() => undefined) };

    service = new CreativeService(
      creativeRepo as any,
      noop, // performanceRepository
      workspaceRepo as any,
      config as any,
    );
  });

  it("returns the creative for the owning user", async () => {
    creativeRepo.findOne.mockResolvedValue({ id: "cr-1", workspaceId: "ws-1" });
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
    await expect(
      service.assertCreativeOwner("cr-1", OWNER),
    ).resolves.toMatchObject({ id: "cr-1" });
  });

  it("throws Forbidden for a different tenant", async () => {
    creativeRepo.findOne.mockResolvedValue({ id: "cr-1", workspaceId: "ws-1" });
    workspaceRepo.findOne.mockResolvedValue({ id: "ws-1", userId: OWNER });
    await expect(service.assertCreativeOwner("cr-1", OTHER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("throws NotFound when the creative does not exist", async () => {
    creativeRepo.findOne.mockResolvedValue(null);
    await expect(service.assertCreativeOwner("ghost", OWNER)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws Forbidden when userId is missing", async () => {
    await expect(service.assertCreativeOwner("cr-1", "")).rejects.toThrow(
      ForbiddenException,
    );
    expect(creativeRepo.findOne).not.toHaveBeenCalled();
  });

  it("listCreatives returns empty for a user with no workspaces", async () => {
    await expect(service.listCreatives([])).resolves.toEqual({
      creatives: [],
      total: 0,
    });
  });
});
