import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IntegrationConfigEntity } from "../integrations/entities/integration-config.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";
import { McpServerController } from "./mcp-server.controller";
import { McpToolsService } from "./mcp-tools.service";
import { McpAuthGuard } from "./mcp-auth.guard";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { CampaignsModule } from "../campaigns/campaigns.module";
import { AiDecisionsModule } from "../ai-decisions/ai-decisions.module";
import { AiAgentModule } from "../ai-agent/ai-agent.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntegrationConfigEntity,
      Workspace,
      WorkspaceMember,
    ]),
    WorkspacesModule,
    CampaignsModule,
    AiDecisionsModule,
    AiAgentModule,
  ],
  controllers: [McpController, McpServerController],
  providers: [McpService, McpToolsService, McpAuthGuard],
  exports: [McpService],
})
export class McpModule {}
