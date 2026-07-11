import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

/** Aspect ratios the ad wizard offers, mapped to Reve's supported values. */
export type ImageAdAspect = "1:1" | "4:5" | "9:16" | "16:9";

/**
 * Client-facing request to generate static image ads with Reve (via fal.ai).
 * The prompt is assembled on the web side from the product details + creative
 * instructions; the backend only forwards it with the server-held API key.
 */
export class GenerateImageAdDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  prompt!: string;

  @IsOptional()
  @IsIn(["1:1", "4:5", "9:16", "16:9"])
  aspectRatio?: ImageAdAspect;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  numImages?: number;
}
