import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  Platform,
  OptimizationMode,
  CampaignPerformance,
  OptimizationGoal,
  OptimizationConstraints,
} from '../types/optimization.types';

export class RunOptimizationDto {
  @ApiProperty({ enum: ['meta', 'tiktok', 'google', 'youtube'] })
  @IsEnum(['meta', 'tiktok', 'google', 'youtube'])
  platform: Platform;

  @ApiPropertyOptional({ description: 'Campaign ID — leave empty to analyze all active campaigns' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty({
    enum: ['recommend', 'auto_apply'],
    description:
      'recommend: suggestions only, no mutations. ' +
      'auto_apply: low-risk content actions are applied automatically.',
  })
  @IsEnum(['recommend', 'auto_apply'])
  mode: OptimizationMode;

  @ApiProperty({ description: 'Campaign + adset + ad level performance data' })
  @IsObject()
  @IsNotEmpty()
  performance: CampaignPerformance;

  @ApiPropertyOptional({
    description: 'Business goal — drives thresholds and action priorities',
  })
  @IsOptional()
  @IsObject()
  goal?: OptimizationGoal;

  @ApiPropertyOptional({
    description: 'Hard constraints — budget limits, IDs that must not be paused',
  })
  @IsOptional()
  @IsObject()
  constraints?: OptimizationConstraints;
}
