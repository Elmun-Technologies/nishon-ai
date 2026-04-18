import { IsUUID } from "class-validator";

export class CreateMcpCredentialsDto {
  @IsUUID()
  workspaceId: string;
}

export class ListMcpCredentialsQueryDto {
  @IsUUID()
  workspaceId: string;
}
