import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IntegrationConfigEntity } from "../integrations/entities/integration-config.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntegrationConfigEntity,
      Workspace,
      WorkspaceMember,
    ]),
  ],
  controllers: [McpController],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
