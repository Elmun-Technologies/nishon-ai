import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PerformanceMetric } from "./entities/performance-metric.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceMetric])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class AnalyticsModule {}
