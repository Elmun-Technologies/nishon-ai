import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * Pre-flight synthetic focus-group test for a creative. At least one of
 * adCopy / headline / imageBase64 should be present; the service tolerates
 * partial input.
 */
export class FocusGroupDto {
  @IsString()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  adCopy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cta?: string;

  /** Base64 image (no data: prefix) for a visual creative. */
  @IsOptional()
  @IsString()
  @MinLength(16)
  imageBase64?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsIn(["meta", "instagram", "telegram", "google", "tiktok"])
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  goal?: string;
}
