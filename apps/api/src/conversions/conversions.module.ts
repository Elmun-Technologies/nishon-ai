import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConversionEvent } from "./entities/conversion-event.entity";
import { ConversionTrackingService } from "./conversion-tracking.service";
import { ConversionTrackingController } from "./conversion-tracking.controller";
import { WorkspacesModule } from "../workspaces/workspaces.module";

@Module({
  imports: [TypeOrmModule.forFeature([ConversionEvent]), WorkspacesModule],
  controllers: [ConversionTrackingController],
  providers: [ConversionTrackingService],
  exports: [ConversionTrackingService, TypeOrmModule],
})
export class ConversionsModule {}
