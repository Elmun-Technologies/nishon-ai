import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Redirect,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { PlatformsService } from "./platforms.service";

@ApiTags("Platform Integrations")
@Controller("platforms")
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  // ─── META OAUTH ───────────────────────────────────────────────────────────

  @Get("meta/connect/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Start Meta OAuth flow — redirects user to Facebook",
  })
  @Redirect()
  connectMeta(@Param("workspaceId") workspaceId: string) {
    const url = this.platformsService.getMetaOAuthUrl(workspaceId);
    return { url, statusCode: 302 };
  }

  @Get("meta/callback")
  @ApiOperation({
    summary:
      "Meta OAuth callback — handles code exchange (called by Facebook, not frontend)",
  })
  @ApiQuery({
    name: "code",
    description: "Temporary authorization code from Meta",
  })
  @ApiQuery({ name: "state", description: "Base64-encoded workspace ID" })
  async metaCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
  ) {
    if (error) {
      // User denied permission on Facebook
      return { success: false, error: "User denied Meta permissions" };
    }

    const result = await this.platformsService.handleMetaCallback(code, state);

    // In production, redirect to frontend with the account list
    // For now return JSON so we can test in Swagger
    return {
      success: true,
      workspaceId: result.workspaceId,
      accounts: result.accounts,
      message: "Select an ad account using POST /platforms/meta/select-account",
    };
  }

  @Post("meta/select-account")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Select which Meta ad account to use after OAuth" })
  async selectMetaAccount(
    @Request() req: any,
    @Body()
    body: { workspaceId: string; adAccountId: string; adAccountName: string },
  ) {
    return this.platformsService.selectMetaAdAccount(
      body.workspaceId,
      body.adAccountId,
      body.adAccountName,
    );
  }

  // ─── GOOGLE ADS OAUTH ─────────────────────────────────────────────────────

  @Get("google/connect/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start Google Ads OAuth flow — redirects user to Google" })
  @Redirect()
  connectGoogle(@Param("workspaceId") workspaceId: string) {
    const url = this.platformsService.getGoogleOAuthUrl(workspaceId);
    return { url, statusCode: 302 };
  }

  @Get("google/callback")
  @ApiOperation({ summary: "Google Ads OAuth callback (called by Google)" })
  @ApiQuery({ name: "code", description: "Authorization code from Google" })
  @ApiQuery({ name: "state", description: "Base64-encoded workspace ID" })
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
  ) {
    if (error) {
      return { success: false, error: "User denied Google Ads permissions" };
    }

    const result = await this.platformsService.handleGoogleCallback(code, state);

    return {
      success: true,
      workspaceId: result.workspaceId,
      accounts: result.accounts,
      message: "Select a customer account using POST /platforms/google/select-account",
    };
  }

  @Post("google/select-account")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Select which Google Ads customer account to use after OAuth" })
  async selectGoogleAccount(
    @Body() body: { workspaceId: string; customerId: string; customerName: string },
  ) {
    return this.platformsService.selectGoogleCustomer(
      body.workspaceId,
      body.customerId,
      body.customerName,
    );
  }

  // ─── TIKTOK ADS OAUTH ─────────────────────────────────────────────────────

  @Get("tiktok/connect/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start TikTok Ads OAuth flow — redirects user to TikTok" })
  @Redirect()
  connectTiktok(@Param("workspaceId") workspaceId: string) {
    const url = this.platformsService.getTiktokOAuthUrl(workspaceId);
    return { url, statusCode: 302 };
  }

  @Get("tiktok/callback")
  @ApiOperation({ summary: "TikTok Ads OAuth callback (called by TikTok)" })
  @ApiQuery({ name: "code", description: "Authorization code from TikTok" })
  @ApiQuery({ name: "state", description: "Base64-encoded workspace ID" })
  async tiktokCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
  ) {
    if (error) {
      return { success: false, error: "User denied TikTok Ads permissions" };
    }

    const result = await this.platformsService.handleTiktokCallback(code, state);

    return {
      success: true,
      workspaceId: result.workspaceId,
      accounts: result.accounts,
      message: "TikTok Ads account connected successfully",
    };
  }

  // ─── YANDEX DIRECT OAUTH ──────────────────────────────────────────────────

  @Get("yandex/connect/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Start Yandex Direct OAuth flow — redirects user to Yandex",
  })
  @Redirect()
  connectYandex(@Param("workspaceId") workspaceId: string) {
    const url = this.platformsService.getYandexOAuthUrl(workspaceId);
    return { url, statusCode: 302 };
  }

  @Get("yandex/callback")
  @ApiOperation({
    summary:
      "Yandex Direct OAuth callback — handles code exchange (called by Yandex, not frontend)",
  })
  @ApiQuery({
    name: "code",
    description: "Temporary authorization code from Yandex",
  })
  @ApiQuery({ name: "state", description: "Base64-encoded workspace ID" })
  async yandexCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
  ) {
    if (error) {
      return { success: false, error: "User denied Yandex permissions" };
    }

    const result = await this.platformsService.handleYandexCallback(
      code,
      state,
    );

    return {
      success: true,
      workspaceId: result.workspaceId,
      accounts: result.accounts,
      message: "Yandex Direct account connected successfully",
    };
  }

  // ─── CONNECTED ACCOUNTS ───────────────────────────────────────────────────

  @Get("accounts/:workspaceId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all connected platform accounts for a workspace",
  })
  async getConnectedAccounts(@Param("workspaceId") workspaceId: string) {
    return this.platformsService.getConnectedAccounts(workspaceId);
  }

  @Delete("accounts/:workspaceId/:accountId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Disconnect a platform account" })
  async disconnectAccount(
    @Param("workspaceId") workspaceId: string,
    @Param("accountId") accountId: string,
  ) {
    return this.platformsService.disconnectAccount(workspaceId, accountId);
  }
}
