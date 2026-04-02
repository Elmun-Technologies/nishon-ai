import { IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
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

export class CreateLaunchJobDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  platform: string;

  @IsString()
  objective: string;

  @IsIn(["ABO", "CBO"])
  budgetType: "ABO" | "CBO";

  @IsOptional()
  @IsBoolean()
  splitByFunnelStage?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AudienceConfigDto)
  audiences: AudienceConfigDto[];
}
