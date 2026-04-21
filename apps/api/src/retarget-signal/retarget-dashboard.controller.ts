import { Body, Controller, Get, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PublishAdsetDto } from "./dto/publish-adset.dto";
import { PublishTelegramDto } from "./dto/publish-telegram.dto";
import { RetargetStartDto } from "./dto/retarget-start.dto";
import { RetargetOrchestrationService } from "./retarget-orchestration.service";

@ApiTags("Retarget / Signal Bridge")
@Controller("api/retarget")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class RetargetDashboardController {
  constructor(private readonly orchestration: RetargetOrchestrationService) {}

  @Get("signals")
  @ApiOperation({ summary: "Redis retarget signallari va statistikasi" })
  async signals() {
    return this.orchestration.getDashboardPayload();
  }

  @Post("start")
  @ApiOperation({ summary: "7 kun kutmasdan retargetni qo‘lda ishga tushirish" })
  async start(@Body() body: RetargetStartDto) {
    await this.orchestration.runPostPurchaseRetarget(body.phone);
    return { ok: true };
  }

  @Post("publish-adset")
  @ApiOperation({
    summary: "Mapping + Meta: Custom Audience, Campaign, AdSet, Creative, Ad (bir bosish)",
    description:
      "Meta token: Authorization: Bearer <meta_token> yoki meta_access_token cookie. " +
      "Test uchun RETARGET_META_DRY_RUN=true.",
  })
  async publishAdset(
    @Body() body: PublishAdsetDto,
    @Headers("authorization") authorization: string | undefined,
    @Req() req: Request,
  ) {
    return this.orchestration.publishMetaAdset(body, authorization, req);
  }

  @Post("publish-telegram")
  @ApiOperation({
    summary: "Faqat Telegram retarget xabari (Meta siz)",
    description: "Avval bot orqali /start phone=998… — Redis da chat_id bo‘lishi kerak.",
  })
  async publishTelegram(@Body() body: PublishTelegramDto) {
    return this.orchestration.publishTelegramRetarget(body);
  }
}
