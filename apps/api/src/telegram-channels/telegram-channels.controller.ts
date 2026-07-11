import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TgStatService, RankedChannel } from "./tgstat.service";
import { RecommendChannelsDto } from "./dtos/recommend-channels.dto";

/**
 * Telegram channel discovery for hyper-local placement. Auth-guarded; the ad buy
 * itself is a manual admin negotiation, so this only surfaces + ranks channels.
 */
@ApiTags("Telegram channels")
@Controller("telegram-channels")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class TelegramChannelsController {
  constructor(private readonly tgstat: TgStatService) {}

  @Get("status")
  @ApiOperation({ summary: "Whether Telegram channel discovery is configured" })
  status(): { configured: boolean } {
    return { configured: this.tgstat.isConfigured() };
  }

  @Post("recommend")
  @ApiOperation({
    summary:
      "Discover + rank Telegram channels for a niche/geo/budget (TGStat + AI fit-score)",
  })
  async recommend(
    @Body() dto: RecommendChannelsDto,
  ): Promise<{ channels: RankedChannel[]; aiAnnotated: boolean }> {
    return this.tgstat.recommend(dto);
  }
}
