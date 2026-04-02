import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreatePaymentMethodDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @MaxLength(10)
  brand: string;

  @IsString()
  @MaxLength(4)
  last4: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateInvoiceDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  invoiceNo: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  pdfUrl?: string;
}
