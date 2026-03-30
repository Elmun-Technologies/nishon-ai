import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgentProfile } from "./entities/agent-profile.entity";
import { ServiceEngagement } from "./entities/service-engagement.entity";
import { AgentReview } from "./entities/agent-review.entity";
import { AgentsService } from "./agents.service";
import { AgentsController } from "./agents.controller";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AgentProfile, ServiceEngagement, AgentReview, Workspace])],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
