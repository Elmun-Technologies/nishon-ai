import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class PublishTelegramDto {
  @ApiProperty({ example: "998901234567" })
  @IsString()
  @MinLength(9)
  phoneDigits!: string;

  @ApiPropertyOptional({ description: "Buyurtma tugmasi URL" })
  @IsOptional()
  @IsString()
  shopButtonUrl?: string;

  @ApiPropertyOptional({ example: "Buyurtma berish" })
  @IsOptional()
  @IsString()
  shopButtonText?: string;
}
