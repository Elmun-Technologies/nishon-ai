import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiDecisionsService } from "./ai-decisions.service";
import { AiDecisionsController } from "./ai-decisions.controller";
import { AiDecision } from "./entities/ai-decision.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AiDecision, Workspace])],
  controllers: [AiDecisionsController],
  providers: [AiDecisionsService],
  exports: [AiDecisionsService, TypeOrmModule],
})
export class AiDecisionsModule {}
