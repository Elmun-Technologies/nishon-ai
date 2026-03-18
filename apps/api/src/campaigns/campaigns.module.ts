import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CampaignsService } from "./campaigns.service";
import { CampaignsController } from "./campaigns.controller";
import { Campaign } from "./entities/campaign.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Workspace])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService, TypeOrmModule],
})
export class CampaignsModule {}
