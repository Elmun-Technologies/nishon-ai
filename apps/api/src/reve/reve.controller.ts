import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ReveService } from "./reve.service";
import { GenerateImageAdDto } from "./dtos/generate-image-ad.dto";

/**
 * Proxies Reve image generation with the server-side API key. Auth-guarded so
 * only signed-in users can spend generation credits.
 */
@ApiTags("Reve image ads")
@Controller("reve")
@UseGuards(AuthGuard("jwt"))
export class ReveController {
  constructor(private readonly reve: ReveService) {}

  @Get("status")
  @ApiOperation({ summary: "Whether image generation is configured" })
  status(): { configured: boolean } {
    return { configured: this.reve.isConfigured() };
  }

  @Post("image-ads/generate")
  @ApiOperation({ summary: "Generate static image ads from a prompt (Reve)" })
  async generate(
    @Body() dto: GenerateImageAdDto,
  ): Promise<{ images: string[]; seed: number | null }> {
    return this.reve.generateImageAd(dto);
  }
}
