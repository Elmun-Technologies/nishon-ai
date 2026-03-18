import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator'
import { Platform } from '../enums/platform.enum'
import { CampaignObjective } from '../enums/campaign-status.enum'

export class CreateCampaignDto {
  @IsString()
  name: string

  @IsEnum(Platform)
  platform: Platform

  @IsEnum(CampaignObjective)
  objective: CampaignObjective

  @IsNumber()
  @Min(1)
  dailyBudget: number

  @IsNumber()
  @Min(1)
  totalBudget: number

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class UpdateCampaignBudgetDto {
  @IsNumber()
  @Min(1)
  dailyBudget: number

  @IsNumber()
  @Min(1)
  totalBudget: number
}