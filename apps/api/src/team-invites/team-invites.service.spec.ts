import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { TeamInvitesService } from "./team-invites.service";
import { TeamInvite } from "./entities/team-invite.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";

const OWNER = "owner-1";
const ADMIN = "admin-2";
const ADVERTISER = "adv-3";
const OUTSIDER = "outsider-4";
const WORKSPACE_ID = "ws-1";

describe("TeamInvitesService", () => {
  let service: TeamInvitesService;
  let inviteRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let memberRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let workspaceRepo: { findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    inviteRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve(d)),
    };
    memberRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve(d)),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    workspaceRepo = { findOne: jest.fn() };
    userRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamInvitesService,
        { provide: getRepositoryToken(TeamInvite), useValue: inviteRepo },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: memberRepo,
        },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(TeamInvitesService);
  });

  // Helper: owner is the workspace.userId. Member lookups return null by
  // default, so the owner short-circuits the access check.
  const givenOwnerWorkspace = () =>
    workspaceRepo.findOne.mockResolvedValue({
      id: WORKSPACE_ID,
      userId: OWNER,
    });

  describe("createInvites — normalization & dedupe", () => {
    it("normalizes emails (trim + lowercase) and dedupes within the batch", async () => {
      givenOwnerWorkspace();
      inviteRepo.save.mockImplementation((arr: any[]) =>
        Promise.resolve(arr.map((i, idx) => ({ ...i, id: `inv-${idx}` }))),
      );

      const out = await service.createInvites(
        {
          workspaceId: WORKSPACE_ID,
          emails: ["  Alice@Example.com ", "alice@example.com", "BOB@x.com"],
        } as any,
        OWNER,
      );

      expect(out.invited).toBe(2);
      const saved = inviteRepo.save.mock.calls.at(-1)?.[0] as any[];
      const persistedEmails = saved.map((s) => s.email).sort();
      expect(persistedEmails).toEqual(["alice@example.com", "bob@x.com"]);
    });

    it("skips emails already pending and reports the count", async () => {
      givenOwnerWorkspace();
      inviteRepo.find.mockResolvedValue([
        { email: "alice@example.com", status: "pending" },
      ]);
      inviteRepo.save.mockImplementation((arr: any[]) => Promise.resolve(arr));

      const out = await service.createInvites(
        {
          workspaceId: WORKSPACE_ID,
          emails: ["alice@example.com", "bob@x.com"],
        } as any,
        OWNER,
      );

      expect(out.invited).toBe(1);
      expect(out.skippedExisting).toBe(1);
      const saved = inviteRepo.save.mock.calls.at(-1)?.[0] as any[];
      expect(saved.map((s) => s.email)).toEqual(["bob@x.com"]);
    });

    it("sets a ~14-day expiry on every fresh invite", async () => {
      givenOwnerWorkspace();
      const before = Date.now();
      inviteRepo.save.mockImplementation((arr: any[]) => Promise.resolve(arr));
      await service.createInvites(
        { workspaceId: WORKSPACE_ID, emails: ["bob@x.com"] } as any,
        OWNER,
      );
      const after = Date.now();
      const saved = inviteRepo.save.mock.calls.at(-1)?.[0] as any[];
      const expiresAt = saved[0].expiresAt as Date;
      // Should be between (before + 14d) and (after + 14d), inclusive.
      const fourteenDays = 1000 * 60 * 60 * 24 * 14;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + fourteenDays);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after + fourteenDays);
    });

    it("defaults role to 'advertiser' when omitted", async () => {
      givenOwnerWorkspace();
      inviteRepo.save.mockImplementation((arr: any[]) => Promise.resolve(arr));
      await service.createInvites(
        { workspaceId: WORKSPACE_ID, emails: ["bob@x.com"] } as any,
        OWNER,
      );
      const saved = inviteRepo.save.mock.calls.at(-1)?.[0] as any[];
      expect(saved[0].role).toBe("advertiser");
    });

    it("an outsider cannot invite (Forbidden) — no DB write", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue(null); // outsider has no membership
      await expect(
        service.createInvites(
          { workspaceId: WORKSPACE_ID, emails: ["x@y.com"] } as any,
          OUTSIDER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(inviteRepo.save).not.toHaveBeenCalled();
    });

    it("an advertiser member cannot invite (admin/owner only)", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      await expect(
        service.createInvites(
          { workspaceId: WORKSPACE_ID, emails: ["x@y.com"] } as any,
          ADVERTISER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("an admin member can invite", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADMIN,
        role: "admin",
      });
      inviteRepo.save.mockImplementation((arr: any[]) => Promise.resolve(arr));
      const out = await service.createInvites(
        { workspaceId: WORKSPACE_ID, emails: ["x@y.com"] } as any,
        ADMIN,
      );
      expect(out.invited).toBe(1);
    });
  });

  describe("acceptInvite", () => {
    // Factory: the service mutates the invite (status, acceptedByUserId), so
    // every test gets a fresh object — sharing one would let earlier tests
    // poison later ones.
    const makePending = () => ({
      id: "inv-1",
      workspaceId: WORKSPACE_ID,
      email: "alice@example.com",
      role: "advertiser" as const,
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      token: "tok",
    });

    it("404s when the token is unknown", async () => {
      inviteRepo.findOne.mockResolvedValue(null);
      await expect(
        service.acceptInvite({ token: "nope" } as any, "user-x"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects a non-pending invite with 400", async () => {
      inviteRepo.findOne.mockResolvedValue({
        ...makePending(),
        status: "accepted",
      });
      await expect(
        service.acceptInvite({ token: "tok" } as any, "user-x"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("marks an expired invite as expired and 400s", async () => {
      inviteRepo.findOne.mockResolvedValue({
        ...makePending(),
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.acceptInvite({ token: "tok" } as any, "user-x"),
      ).rejects.toBeInstanceOf(BadRequestException);
      // The invite save persists the new "expired" status.
      const saved = inviteRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.status).toBe("expired");
    });

    it("rejects when the authenticated user's email doesn't match", async () => {
      inviteRepo.findOne.mockResolvedValue(makePending());
      userRepo.findOne.mockResolvedValue({
        id: "user-x",
        email: "Eve@x.com",
      });
      await expect(
        service.acceptInvite({ token: "tok" } as any, "user-x"),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

    it("matches the user email case-insensitively and creates membership", async () => {
      inviteRepo.findOne.mockResolvedValue(makePending());
      userRepo.findOne.mockResolvedValue({
        id: "user-x",
        email: "Alice@Example.com  ",
      });
      memberRepo.findOne.mockResolvedValue(null); // not yet a member
      const out = await service.acceptInvite({ token: "tok" } as any, "user-x");
      expect(out).toEqual({ accepted: true, workspaceId: WORKSPACE_ID });
      const newMember = memberRepo.save.mock.calls[0]?.[0];
      expect(newMember).toEqual(
        expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          userId: "user-x",
          role: "advertiser",
          allowedAdAccountIds: [],
        }),
      );
      // The invite was then marked accepted.
      const invitePatch = inviteRepo.save.mock.calls.at(-1)?.[0];
      expect(invitePatch.status).toBe("accepted");
      expect(invitePatch.acceptedByUserId).toBe("user-x");
    });

    it("does not duplicate membership when the user is already a member", async () => {
      inviteRepo.findOne.mockResolvedValue(makePending());
      userRepo.findOne.mockResolvedValue({
        id: "user-x",
        email: "alice@example.com",
      });
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: "user-x",
        role: "advertiser",
      });
      await service.acceptInvite({ token: "tok" } as any, "user-x");
      // The only save call should be to flip the invite to accepted.
      expect(memberRepo.save).not.toHaveBeenCalled();
      const invitePatch = inviteRepo.save.mock.calls.at(-1)?.[0];
      expect(invitePatch.status).toBe("accepted");
    });
  });

  describe("listWorkspaceMembers", () => {
    it("returns members + pending invites for the owner", async () => {
      givenOwnerWorkspace();
      memberRepo.find.mockResolvedValue([{ id: "m-1" }]);
      inviteRepo.find.mockResolvedValue([{ id: "inv-1", status: "pending" }]);
      const out = await service.listWorkspaceMembers(WORKSPACE_ID, OWNER);
      expect(out.members).toHaveLength(1);
      expect(out.pendingInvites).toHaveLength(1);
    });

    it("a workspace member (any role) can read the list", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      memberRepo.find.mockResolvedValue([{ id: "m-1" }]);
      await expect(
        service.listWorkspaceMembers(WORKSPACE_ID, ADVERTISER),
      ).resolves.toBeDefined();
    });

    it("an outsider is Forbidden", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(
        service.listWorkspaceMembers(WORKSPACE_ID, OUTSIDER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("updateMemberRole / updateMemberAccounts", () => {
    it("owner can update role; persists the new role", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValueOnce({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      const out = await service.updateMemberRole(
        {
          workspaceId: WORKSPACE_ID,
          memberUserId: ADVERTISER,
          role: "admin",
        } as any,
        OWNER,
      );
      expect(out.role).toBe("admin");
    });

    it("404 when member doesn't exist", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateMemberRole(
          {
            workspaceId: WORKSPACE_ID,
            memberUserId: "ghost",
            role: "admin",
          } as any,
          OWNER,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("updateMemberAccounts replaces the allowedAdAccountIds list", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValueOnce({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        allowedAdAccountIds: ["old"],
      });
      const out = await service.updateMemberAccounts(
        {
          workspaceId: WORKSPACE_ID,
          memberUserId: ADVERTISER,
          allowedAdAccountIds: ["a", "b"],
        } as any,
        OWNER,
      );
      expect(out.allowedAdAccountIds).toEqual(["a", "b"]);
    });
  });

  describe("removeMember — guardrails", () => {
    it("400s when removing yourself", async () => {
      givenOwnerWorkspace();
      await expect(
        service.removeMember(
          { workspaceId: WORKSPACE_ID, memberUserId: OWNER } as any,
          OWNER,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(memberRepo.remove).not.toHaveBeenCalled();
    });

    it("Forbidden when removing the workspace creator", async () => {
      // creator (workspace.userId) === target user, but actor is a different admin
      workspaceRepo.findOne.mockResolvedValue({
        id: WORKSPACE_ID,
        userId: OWNER,
      });
      memberRepo.findOne.mockResolvedValueOnce({
        workspaceId: WORKSPACE_ID,
        userId: ADMIN,
        role: "admin",
      });
      await expect(
        service.removeMember(
          { workspaceId: WORKSPACE_ID, memberUserId: OWNER } as any,
          ADMIN,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(memberRepo.remove).not.toHaveBeenCalled();
    });

    it("owner can remove a regular member", async () => {
      givenOwnerWorkspace();
      const member = {
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      };
      // First findOne: assertInviteWriteAccess (owner short-circuits, won't
      // call this). Second findOne: the member to remove.
      memberRepo.findOne.mockResolvedValue(member);
      const out = await service.removeMember(
        { workspaceId: WORKSPACE_ID, memberUserId: ADVERTISER } as any,
        OWNER,
      );
      expect(out).toEqual({ removed: true });
      expect(memberRepo.remove).toHaveBeenCalledWith(member);
    });
  });

  describe("revokeInvite", () => {
    it("404s for unknown invite", async () => {
      inviteRepo.findOne.mockResolvedValue(null);
      await expect(service.revokeInvite("ghost", OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("owner flips the invite status to revoked", async () => {
      inviteRepo.findOne.mockResolvedValue({
        id: "inv-1",
        workspaceId: WORKSPACE_ID,
        status: "pending",
      });
      givenOwnerWorkspace();
      const out = await service.revokeInvite("inv-1", OWNER);
      expect(out).toEqual({ revoked: true });
      const saved = inviteRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.status).toBe("revoked");
    });

    it("non-admin member cannot revoke", async () => {
      inviteRepo.findOne.mockResolvedValue({
        id: "inv-1",
        workspaceId: WORKSPACE_ID,
        status: "pending",
      });
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      await expect(
        service.revokeInvite("inv-1", ADVERTISER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
