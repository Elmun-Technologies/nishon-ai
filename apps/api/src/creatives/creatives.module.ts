import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Creative, CreativePerformance } from './entities'
import { CreativeService } from './services/creative.service'
import { CreativeController } from './controllers/creative.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Creative, CreativePerformance])],
  controllers: [CreativeController],
  providers: [CreativeService],
  exports: [CreativeService],
})
export class CreativesModule {}
