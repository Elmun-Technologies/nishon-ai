import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { randomUUID } from "crypto";
import { TeamInvite } from "./entities/team-invite.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import {
  CreateTeamInviteDto,
  AcceptTeamInviteDto,
  UpdateMemberAccountsDto,
  UpdateMemberRoleDto,
} from "./dto/team-invite.dto";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";

@Injectable()
export class TeamInvitesService {
  constructor(
    @InjectRepository(TeamInvite)
    private readonly inviteRepo: Repository<TeamInvite>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createInvites(dto: CreateTeamInviteDto, invitedByUserId: string) {
    await this.assertInviteWriteAccess(dto.workspaceId, invitedByUserId);

    const workspace = await this.workspaceRepo.findOne({
      where: { id: dto.workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const normalized = [
      ...new Set(dto.emails.map((e) => e.trim().toLowerCase())),
    ];
    const existing = await this.inviteRepo.find({
      where: {
        workspaceId: dto.workspaceId,
        email: In(normalized),
        status: "pending",
      },
    });
    const existingEmails = new Set(existing.map((i) => i.email));

    const toCreate = normalized
      .filter((email) => !existingEmails.has(email))
      .map((email) =>
        this.inviteRepo.create({
          workspaceId: dto.workspaceId,
          token: randomUUID(),
          email,
          role: dto.role ?? "advertiser",
          invitedByUserId,
          status: "pending",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        }),
      );

    const created = await this.inviteRepo.save(toCreate);
    return {
      invited: created.length,
      skippedExisting: existing.length,
      invites: created.map((i) => ({
        id: i.id,
        email: i.email,
        token: i.token,
        expiresAt: i.expiresAt,
      })),
    };
  }

  async acceptInvite(dto: AcceptTeamInviteDto, userId: string) {
    const invite = await this.inviteRepo.findOne({
      where: { token: dto.token },
    });
    if (!invite) throw new NotFoundException("Invite not found");
    if (invite.status !== "pending")
      throw new BadRequestException("Invite is no longer active");
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      invite.status = "expired";
      await this.inviteRepo.save(invite);
      throw new BadRequestException("Invite expired");
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.email.trim().toLowerCase() !== invite.email) {
      throw new ForbiddenException(
        "Invite email does not match the authenticated user",
      );
    }

    const existing = await this.memberRepo.findOne({
      where: { workspaceId: invite.workspaceId, userId },
    });
    if (!existing) {
      await this.memberRepo.save(
        this.memberRepo.create({
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
          allowedAdAccountIds: [],
        }),
      );
    }

    invite.status = "accepted";
    invite.acceptedByUserId = userId;
    await this.inviteRepo.save(invite);
    return { accepted: true, workspaceId: invite.workspaceId };
  }

  async listWorkspaceMembers(workspaceId: string, actorUserId: string) {
    await this.assertWorkspaceReadAccess(workspaceId, actorUserId);

    const members = await this.memberRepo.find({
      where: { workspaceId },
      relations: ["user"],
    });
    const pendingInvites = await this.inviteRepo.find({
      where: { workspaceId, status: "pending" },
    });
    return { members, pendingInvites };
  }

  async updateMemberRole(dto: UpdateMemberRoleDto, actorUserId: string) {
    await this.assertInviteWriteAccess(dto.workspaceId, actorUserId);

    const member = await this.memberRepo.findOne({
      where: { workspaceId: dto.workspaceId, userId: dto.memberUserId },
    });
    if (!member) throw new NotFoundException("Member not found");
    member.role = dto.role;
    await this.memberRepo.save(member);
    return member;
  }

  async updateMemberAccounts(
    dto: UpdateMemberAccountsDto,
    actorUserId: string,
  ) {
    await this.assertInviteWriteAccess(dto.workspaceId, actorUserId);

    const member = await this.memberRepo.findOne({
      where: { workspaceId: dto.workspaceId, userId: dto.memberUserId },
    });
    if (!member) throw new NotFoundException("Member not found");
    member.allowedAdAccountIds = dto.allowedAdAccountIds;
    await this.memberRepo.save(member);
    return member;
  }

  async revokeInvite(inviteId: string, actorUserId: string) {
    const invite = await this.inviteRepo.findOne({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException("Invite not found");
    await this.assertInviteWriteAccess(invite.workspaceId, actorUserId);
    invite.status = "revoked";
    await this.inviteRepo.save(invite);
    return { revoked: true };
  }

  private async assertWorkspaceReadAccess(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;

    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new ForbiddenException("You do not have access to this workspace");
    }
  }

  private async assertInviteWriteAccess(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.userId === userId) return;

    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ForbiddenException("Owner or admin access is required");
    }
  }
}
