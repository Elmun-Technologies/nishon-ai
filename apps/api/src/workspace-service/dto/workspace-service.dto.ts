import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from "class-validator";

export class CreateWorkspaceSetupDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  businessType: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @IsEmail({}, { each: true })
  initialTeamEmails?: string[];
}
