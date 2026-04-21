import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CrmClickDto {
  @ApiProperty({ example: "+998901234567" })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 299000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Masalan "Krossovka Nike"' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ description: "product_id bilan bir xil (alias)" })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;
}
