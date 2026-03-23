import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WorkspacesService } from "./workspaces.service";
import { WorkspacesController } from "./workspaces.controller";
import { Workspace } from "./entities/workspace.entity";
import { Budget } from "../budget/entities/budget.entity";
import { MetaInsight } from "../meta/entities/meta-insight.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, Budget, MetaInsight])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService, TypeOrmModule],
})
export class WorkspacesModule {}
