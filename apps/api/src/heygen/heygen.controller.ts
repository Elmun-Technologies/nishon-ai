import { Controller, Get, Param, Post, Body, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { HeygenService } from "./heygen.service";
import { GeneratePhotoAvatarDto } from "./dtos/generate-photo-avatar.dto";

/**
 * Proxies HeyGen photo-avatar APIs with the server-side API key.
 * Workspace is optional on the request (same pattern as creatives).
 */
@Controller("heygen")
@UseGuards(AuthGuard("jwt"))
export class HeygenController {
  constructor(private readonly heygen: HeygenService) {}

  @Post("photo-avatar/generate")
  async generate(@Body() dto: GeneratePhotoAvatarDto, @Req() _req: any) {
    return this.heygen.generatePhotoAvatar(dto);
  }

  @Get("photo-avatar/generation/:generationId")
  async status(@Param("generationId") generationId: string) {
    return this.heygen.getPhotoGenerationStatus(generationId);
  }
}
