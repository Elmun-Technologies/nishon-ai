import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/** One creative variant in an A/B focus-group comparison (text-only). */
export class FocusGroupVariantDto {
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
}

/**
 * A/B pre-test: run two creatives through the same synthetic panel and pick a
 * winner. Reuses the single-creative focus group per variant; the winner + lift
 * are computed in code so the comparison is verifiable.
 */
export class CompareFocusGroupDto {
  @IsString()
  workspaceId!: string;

  @ValidateNested()
  @Type(() => FocusGroupVariantDto)
  variantA!: FocusGroupVariantDto;

  @ValidateNested()
  @Type(() => FocusGroupVariantDto)
  variantB!: FocusGroupVariantDto;

  @IsOptional()
  @IsIn(["meta", "instagram", "telegram", "google", "tiktok"])
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  goal?: string;
}
