import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsIn,
  IsUUID,
} from "class-validator";

export class CreateTeamInviteDto {
  @IsUUID()
  workspaceId: string;

  @IsArray()
  @ArrayMaxSize(60)
  @IsEmail({}, { each: true })
  emails: string[];

  @IsOptional()
  @IsIn(["admin", "advertiser"])
  role?: "admin" | "advertiser";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class AcceptTeamInviteDto {
  @IsString()
  token: string;
}

export class UpdateMemberRoleDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  memberUserId: string;

  @IsIn(["owner", "admin", "advertiser"])
  role: "owner" | "admin" | "advertiser";
}

export class UpdateMemberAccountsDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  memberUserId: string;

  @IsArray()
  @IsString({ each: true })
  allowedAdAccountIds: string[];
}

export class RemoveMemberDto {
  @IsUUID()
  workspaceId: string;

  @IsUUID()
  memberUserId: string;
}
