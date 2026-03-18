import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiDecision } from './entities/ai-decision.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AiDecision])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class AiDecisionsModule {}