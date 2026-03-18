import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Budget } from './entities/budget.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Budget])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class BudgetModule {}