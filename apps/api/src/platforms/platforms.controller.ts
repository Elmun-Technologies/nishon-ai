import {
  Controller, Get, Post, Delete,
  Param, Query, Body, Redirect,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common'
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiResponse, ApiQuery,
} from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { PlatformsService } from './platforms.service'

@ApiTags('Platform Integrations')
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  // ─── META OAUTH ───────────────────────────────────────────────────────────

  @Get('meta/connect/:workspaceId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Meta OAuth flow — redirects user to Facebook' })
  @Redirect()
  connectMeta(@Param('workspaceId') workspaceId: string) {
    const url = this.platformsService.getMetaOAuthUrl(workspaceId)
    return { url, statusCode: 302 }
  }

  @Get('meta/callback')
  @ApiOperation({
    summary: 'Meta OAuth callback — handles code exchange (called by Facebook, not frontend)',
  })
  @ApiQuery({ name: 'code', description: 'Temporary authorization code from Meta' })
  @ApiQuery({ name: 'state', description: 'Base64-encoded workspace ID' })
  async metaCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      // User denied permission on Facebook
      return { success: false, error: 'User denied Meta permissions' }
    }

    const result = await this.platformsService.handleMetaCallback(code, state)

    // In production, redirect to frontend with the account list
    // For now return JSON so we can test in Swagger
    return {
      success: true,
      workspaceId: result.workspaceId,
      accounts: result.accounts,
      message: 'Select an ad account using POST /platforms/meta/select-account',
    }
  }

  @Post('meta/select-account')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select which Meta ad account to use after OAuth' })
  async selectMetaAccount(
    @Request() req: any,
    @Body() body: { workspaceId: string; adAccountId: string; adAccountName: string },
  ) {
    return this.platformsService.selectMetaAdAccount(
      body.workspaceId,
      body.adAccountId,
      body.adAccountName,
    )
  }

  // ─── CONNECTED ACCOUNTS ───────────────────────────────────────────────────

  @Get('accounts/:workspaceId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all connected platform accounts for a workspace' })
  async getConnectedAccounts(
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.platformsService.getConnectedAccounts(workspaceId)
  }

  @Delete('accounts/:workspaceId/:accountId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect a platform account' })
  async disconnectAccount(
    @Param('workspaceId') workspaceId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.platformsService.disconnectAccount(workspaceId, accountId)
  }
}