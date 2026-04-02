import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { TeamInvitesService } from "./team-invites.service";
import {
  AcceptTeamInviteDto,
  CreateTeamInviteDto,
  UpdateMemberAccountsDto,
  UpdateMemberRoleDto,
} from "./dto/team-invite.dto";

@Controller("team")
@UseGuards(AuthGuard("jwt"))
export class TeamInvitesController {
  constructor(private readonly service: TeamInvitesService) {}

  @Post("invites")
  createInvites(@Body() dto: CreateTeamInviteDto, @Req() req: Request) {
    return this.service.createInvites(dto, (req.user as any).id);
  }

  @Post("invites/accept")
  acceptInvite(@Body() dto: AcceptTeamInviteDto, @Req() req: Request) {
    return this.service.acceptInvite(dto, (req.user as any).id);
  }

  @Get("workspaces/:workspaceId/members")
  listMembers(@Param("workspaceId") workspaceId: string, @Req() req: Request) {
    return this.service.listWorkspaceMembers(workspaceId, (req.user as any).id);
  }

  @Patch("members/role")
  updateRole(@Body() dto: UpdateMemberRoleDto, @Req() req: Request) {
    return this.service.updateMemberRole(dto, (req.user as any).id);
  }

  @Patch("members/ad-accounts")
  updateAdAccounts(@Body() dto: UpdateMemberAccountsDto, @Req() req: Request) {
    return this.service.updateMemberAccounts(dto, (req.user as any).id);
  }

  @Delete("invites/:inviteId")
  revokeInvite(@Param("inviteId") inviteId: string, @Req() req: Request) {
    return this.service.revokeInvite(inviteId, (req.user as any).id);
  }
}
