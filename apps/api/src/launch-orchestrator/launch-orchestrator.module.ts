import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LaunchJob } from "./entities/launch-job.entity";
import { LaunchOrchestratorService } from "./launch-orchestrator.service";
import { LaunchOrchestratorController } from "./launch-orchestrator.controller";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { PlatformsModule } from "../platforms/platforms.module";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LaunchJob,
      ConnectedAccount,
      WorkspaceMember,
      Workspace,
    ]),
    PlatformsModule,
  ],
  providers: [LaunchOrchestratorService],
  controllers: [LaunchOrchestratorController],
  exports: [LaunchOrchestratorService],
})
export class LaunchOrchestratorModule {}
