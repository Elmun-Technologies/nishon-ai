import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AutoOptimizationController } from './auto-optimization.controller';
import { AutoOptimizationService } from './auto-optimization.service';
import { OptimizerAgentService } from './optimizer-agent.service';
import { OptimizationRun } from './entities/optimization-run.entity';

/**
 * AutoOptimizationModule
 *
 * Self-contained feature module for the auto-optimization engine.
 * Does NOT import AiAgentModule to stay decoupled — it uses the shared
 * NishonAiClient directly via OptimizerAgentService.
 *
 * Exposed services:
 * - AutoOptimizationService  — run pipeline + query history
 * - OptimizerAgentService    — AI analysis + creative refresh
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([OptimizationRun]),
  ],
  controllers: [AutoOptimizationController],
  providers: [
    AutoOptimizationService,
    OptimizerAgentService,
  ],
  exports: [
    AutoOptimizationService,
    OptimizerAgentService,
  ],
})
export class AutoOptimizationModule {}
