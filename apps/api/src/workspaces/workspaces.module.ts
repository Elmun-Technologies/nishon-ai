import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkspacesService } from './workspaces.service'
import { WorkspacesController } from './workspaces.controller'
import { Workspace } from './entities/workspace.entity'
import { Budget } from '../budget/entities/budget.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, Budget])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService, TypeOrmModule],
})
export class WorkspacesModule {}
