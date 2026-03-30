import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LandingPage } from "./entities/landing-page.entity";
import { LandingPagesService } from "./landing-pages.service";
import { LandingPagesController } from "./landing-pages.controller";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [TypeOrmModule.forFeature([LandingPage, Workspace])],
  controllers: [LandingPagesController],
  providers: [LandingPagesService],
  exports: [LandingPagesService],
})
export class LandingPagesModule {}
