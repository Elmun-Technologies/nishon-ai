import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { TriggersetController } from "./triggersets.controller";
import { TriggersetService } from "./triggersets.service";
import { Triggerset, TriggerLog } from "./entities/triggerset.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";
import { MetaCampaignSync } from "../meta/entities/meta-campaign-sync.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Triggerset, TriggerLog, MetaInsight, MetaCampaignSync, Workspace]),
  ],
  controllers: [TriggersetController],
  providers: [TriggersetService],
  exports: [TriggersetService],
})
export class TriggersetModule {}
