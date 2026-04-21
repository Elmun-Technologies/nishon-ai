import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class PublishAdsetDto {
  @ApiProperty({ example: "998901234567" })
  @IsString()
  @MinLength(9)
  phoneDigits!: string;

  @ApiProperty({ example: "act_1234567890" })
  @IsString()
  @MinLength(6)
  adAccountId!: string;

  @ApiProperty({ description: "Facebook Page ID (creative uchun majburiy)" })
  @IsString()
  @MinLength(3)
  pageId!: string;

  @ApiPropertyOptional({ description: "Creative link (default mappingdan)" })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: "Kunlik byudjet (akkaunt valyutasi, Meta talabiga mos)" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  dailyBudget?: number;

  @ApiPropertyOptional({ description: "Meta dan keyin Telegram xabar yuborish (default: true)" })
  @IsOptional()
  @Transform(({ value }) => (value === false || value === "false" ? false : true))
  @IsBoolean()
  sendTelegram?: boolean;

  @ApiPropertyOptional({ description: "Tugma URL — default RETARGET_TELEGRAM_SHOP_URL" })
  @IsOptional()
  @IsString()
  shopButtonUrl?: string;
}
