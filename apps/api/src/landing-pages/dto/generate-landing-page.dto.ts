import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class LandingPageImagePartDto {
  @IsString()
  @MaxLength(8_000_000)
  base64!: string;

  @IsString()
  @IsIn(["image/jpeg", "image/png", "image/webp", "image/gif"])
  mimeType!: string;
}

export class GenerateLandingPageDto {
  @IsOptional()
  @IsString()
  @IsIn(["local_service", "product_store", "saas_b2b", "promo_event"])
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  creativeBrief?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => LandingPageImagePartDto)
  images?: LandingPageImagePartDto[];
}
