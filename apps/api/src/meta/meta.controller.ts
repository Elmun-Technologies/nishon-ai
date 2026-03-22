import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { MetaAdsService } from "./meta-ads.service";

@Controller("api/v1/meta")
export class MetaController {
  constructor(private readonly metaAdsService: MetaAdsService) {}

  @Get("ad-accounts")
  async getAdAccounts(
    @Headers("authorization") authorization?: string,
    @Req() req?: Request,
  ) {
    const accessToken =
      this.extractBearerToken(authorization) || this.extractMetaTokenFromCookie(req);

    if (!accessToken) {
      throw new UnauthorizedException("Meta access token is required");
    }

    const accounts = await this.metaAdsService.getAdAccounts(accessToken);

    return {
      success: true,
      accounts,
    };
  }

  @Get("campaigns")
  async getCampaigns(
    @Query("accountId") accountId: string | undefined,
    @Headers("authorization") authorization?: string,
    @Req() req?: Request,
  ) {
    if (!accountId) {
      throw new BadRequestException("accountId query parameter is required");
    }

    const accessToken =
      this.extractBearerToken(authorization) || this.extractMetaTokenFromCookie(req);
    if (!accessToken) {
      throw new UnauthorizedException("Meta access token is required");
    }

    const campaigns = await this.metaAdsService.getCampaigns(accessToken, accountId);

    return {
      success: true,
      campaigns,
    };
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return null;
    }

    return token;
  }

  private extractMetaTokenFromCookie(req?: Request): string | null {
    const cookieHeader = req?.headers?.cookie;
    if (!cookieHeader) {
      return null;
    }

    const pairs = cookieHeader.split(";").map((part) => part.trim());
    const metaPair = pairs.find((pair) => pair.startsWith("meta_access_token="));
    if (!metaPair) {
      return null;
    }

    const [, value] = metaPair.split("=");
    return value ? decodeURIComponent(value) : null;
  }
}
