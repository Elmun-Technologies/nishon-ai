import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { WorkspaceServiceService } from "./workspace-service.service";
import { WorkspaceServiceController } from "./workspace-service.controller";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember])],
  providers: [WorkspaceServiceService],
  controllers: [WorkspaceServiceController],
  exports: [WorkspaceServiceService],
})
export class WorkspaceServiceModule {}
