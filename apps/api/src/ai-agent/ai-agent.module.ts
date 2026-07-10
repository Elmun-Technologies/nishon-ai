import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { AiAgentService } from "./ai-agent.service";
import { AiAgentController } from "./ai-agent.controller";
import { StrategyEngineService } from "./strategy-engine.service";
import { DecisionLoopService } from "./decision-loop.service";
import { CampaignOrchestratorService } from "./campaign-orchestrator.service";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { AiDecision } from "../ai-decisions/entities/ai-decision.entity";
import { Campaign } from "../campaigns/entities/campaign.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { MetaCampaignSync } from "../meta/entities/meta-campaign-sync.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { PlatformsModule } from "../platforms/platforms.module";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Workspace,
      AiDecision,
      Campaign,
      ConnectedAccount,
      MetaCampaignSync,
      MetaInsight,
    ]),
    // AiDecision is needed by AiAgentService (approveDecision/rejectDecision)
    WorkspacesModule,
    PlatformsModule,
  ],
  controllers: [AiAgentController],
  providers: [
    AiAgentService,
    StrategyEngineService,
    DecisionLoopService,
    CampaignOrchestratorService,
  ],
  exports: [
    AiAgentService,
    StrategyEngineService,
    DecisionLoopService,
    CampaignOrchestratorService,
  ],
})
export class AiAgentModule {}
