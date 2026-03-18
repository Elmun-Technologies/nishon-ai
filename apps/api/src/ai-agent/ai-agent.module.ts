import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { AiAgentService } from './ai-agent.service'
import { AiAgentController } from './ai-agent.controller'
import { StrategyEngineService } from './strategy-engine.service'
import { DecisionLoopService } from './decision-loop.service'
import { Workspace } from '../workspaces/entities/workspace.entity'
import { AiDecision } from '../ai-decisions/entities/ai-decision.entity'
import { Campaign } from '../campaigns/entities/campaign.entity'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Workspace, AiDecision, Campaign]),
    WorkspacesModule,
  ],
  controllers: [AiAgentController],
  providers: [AiAgentService, StrategyEngineService, DecisionLoopService],
  exports: [AiAgentService, StrategyEngineService, DecisionLoopService],
})
export class AiAgentModule {}
