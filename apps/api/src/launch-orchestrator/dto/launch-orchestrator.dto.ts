import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class AudienceConfigDto {
  @IsString()
  name: string;

  @IsIn(["acquisition_prospecting", "acquisition_reengagement", "retargeting", "retention"])
  funnelStage: "acquisition_prospecting" | "acquisition_reengagement" | "retargeting" | "retention";

  @IsOptional()
  @IsString()
  location?: string;
}

class TargetingDto {
  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsInt()
  @Min(13)
  @Max(65)
  ageMin: number;

  @IsInt()
  @Min(13)
  @Max(65)
  ageMax: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  genders?: number[];
}

export class CreateLaunchJobDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  platform: string;

  @IsString()
  objective: string;

  @IsIn(["ABO", "CBO"])
  budgetType: "ABO" | "CBO";

  /**
   * Optional for backward compatibility with older clients; the orchestrator
   * falls back to a safe default ($20) when missing.
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyBudget?: number;

  @IsOptional()
  @IsBoolean()
  splitByFunnelStage?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceCampaignIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AudienceConfigDto)
  audiences: AudienceConfigDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TargetingDto)
  targeting?: TargetingDto;

  @IsOptional()
  @IsBoolean()
  copyCreatives?: boolean;
}
