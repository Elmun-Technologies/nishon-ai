import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Free-text brief → structured Meta campaign proposal. The user describes what
 * they want in plain language ("sell these sneakers in Tashkent, $10/day") and
 * the agent extracts a full plan, seeded by the workspace's onboarding defaults.
 */
export class PlanCampaignDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  brief!: string;

  /** Optional product image (base64, no data: prefix) for context. */
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
