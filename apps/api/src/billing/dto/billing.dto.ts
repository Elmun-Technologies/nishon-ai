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

export class UpdateBillingContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  yourName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  workEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxId?: string;
}
