import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, MinLength } from 'class-validator'
import { CampaignObjective } from '../enums/campaign-status.enum'
import { AutopilotMode } from '../enums/autopilot-mode.enum'

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsString()
  industry: string

  @IsString()
  @MinLength(20, { message: 'Please describe your product in at least 20 characters' })
  productDescription: string

  @IsString()
  @MinLength(10)
  targetAudience: string

  @IsNumber()
  @Min(50, { message: 'Minimum budget is $50' })
  monthlyBudget: number

  @IsEnum(CampaignObjective)
  goal: CampaignObjective
}

export class UpdateAutopilotDto {
  @IsEnum(AutopilotMode)
  mode: AutopilotMode
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  industry?: string

  @IsOptional()
  @IsString()
  productDescription?: string

  @IsOptional()
  @IsString()
  targetAudience?: string

  @IsOptional()
  @IsString()
  targetLocation?: string

  @IsOptional()
  @IsNumber()
  @Min(50)
  monthlyBudget?: number

  @IsOptional()
  @IsString()
  telegramChatId?: string | null
}