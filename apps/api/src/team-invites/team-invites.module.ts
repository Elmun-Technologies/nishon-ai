import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TeamInvitesController } from "./team-invites.controller";
import { TeamInvitesService } from "./team-invites.service";
import { TeamInvite } from "./entities/team-invite.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamInvite, WorkspaceMember, Workspace, User]),
  ],
  controllers: [TeamInvitesController],
  providers: [TeamInvitesService],
  exports: [TeamInvitesService],
})
export class TeamInvitesModule {}
