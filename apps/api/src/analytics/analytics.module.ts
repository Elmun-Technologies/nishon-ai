import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PerformanceMetric } from "./entities/performance-metric.entity";
import { ConversionAnalyticsService } from "./conversion-analytics.service";
import { MetaInsight } from "../meta/entities/meta-insight.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceMetric, MetaInsight])],
  controllers: [],
  providers: [ConversionAnalyticsService],
  exports: [ConversionAnalyticsService, TypeOrmModule],
})
export class AnalyticsModule {}
