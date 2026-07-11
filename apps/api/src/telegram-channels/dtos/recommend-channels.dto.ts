import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

/**
 * Discover Telegram channels for hyper-local ad placement. The actual ad buy is
 * a manual admin negotiation (out of MVP scope) — this only surfaces and ranks
 * candidate channels with a fit-score so the buyer knows WHERE to spend.
 */
export class RecommendChannelsDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  /** Free-text niche / product ("qishki krossovka", "IT kurslari"). */
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  niche!: string;

  /** ISO country code for reach filtering (default UZ). */
  @IsOptional()
  @IsString()
  country?: string;

  /** TGStat category slug ("business", "education", ...) if the caller knows it. */
  @IsOptional()
  @IsString()
  category?: string;

  /** Monthly budget in USD — used to estimate how many placements are affordable. */
  @IsOptional()
  @IsInt()
  @Min(1)
  monthlyBudgetUsd?: number;
}
