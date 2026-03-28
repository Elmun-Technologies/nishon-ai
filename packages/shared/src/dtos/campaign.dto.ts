import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsObject, Min } from 'class-validator'
import { Platform } from '../enums/platform.enum'
import { CampaignObjective, BudgetType, CampaignCurrency } from '../enums/campaign-status.enum'

/**
 * Schedule structure for ad display hours.
 * { always: true } means show at all times.
 * { always: false, hours: [9,10,11,...,20] } means show only during listed hours (0-23).
 */
export interface CampaignSchedule {
  always: boolean
  hours?: number[]  // active hours (0–23), used when always=false
}

export class CreateCampaignDto {
  @IsString()
  name: string

  @IsEnum(Platform)
  platform: Platform

  @IsEnum(CampaignObjective)
  objective: CampaignObjective

  @IsNumber()
  @Min(1)
  budget: number

  @IsOptional()
  @IsEnum(BudgetType)
  budgetType?: BudgetType

  @IsOptional()
  @IsEnum(CampaignCurrency)
  currency?: CampaignCurrency

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsObject()
  schedule?: CampaignSchedule
}

export class UpdateCampaignBudgetDto {
  @IsNumber()
  @Min(1)
  dailyBudget: number

  @IsNumber()
  @Min(1)
  totalBudget: number
}