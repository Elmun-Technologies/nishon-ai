import { HttpService } from "@nestjs/axios";
import {
  BadGatewayException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { firstValueFrom } from "rxjs";

type MetaGraphError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type MetaAdAccountsResponse = {
  data?: Array<{
    id: string;
    name: string;
    account_status: number;
    currency?: string;
  }>;
};

type MetaCampaignsResponse = {
  data?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
};

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  constructor(private readonly http: HttpService) {}

  async getAdAccounts(accessToken: string): Promise<
    Array<{
      id: string;
      name: string;
      account_status: number;
      currency: string | null;
    }>
  > {
    this.logger.log({ message: "Meta ad accounts request started" });

    try {
      const response = await firstValueFrom(
        this.http.get<MetaAdAccountsResponse>(
          "https://graph.facebook.com/v19.0/me/adaccounts",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              fields: "id,name,account_status,currency",
            },
          },
        ),
      );

      const accounts = response.data?.data ?? [];

      this.logger.log({
        message: "Meta ad accounts request completed",
        accountCount: accounts.length,
      });

      return accounts.map((account) => ({
        id: account.id,
        name: account.name,
        account_status: account.account_status,
        currency: account.currency || null,
      }));
    } catch (error: any) {
      this.handleMetaError(error, "Meta ad accounts request failed");
    }
  }

  async getCampaigns(
    accessToken: string,
    accountId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      status: string;
    }>
  > {
    this.logger.log({
      message: "Meta campaigns request started",
      accountId,
    });

    try {
      const response = await firstValueFrom(
        this.http.get<MetaCampaignsResponse>(
          `https://graph.facebook.com/v19.0/${encodeURIComponent(accountId)}/campaigns`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              fields: "id,name,status",
            },
          },
        ),
      );

      const campaigns = response.data?.data ?? [];

      this.logger.log({
        message: "Meta campaigns request completed",
        accountId,
        campaignCount: campaigns.length,
      });

      return campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
      }));
    } catch (error: any) {
      this.handleMetaError(error, "Meta campaigns request failed", accountId);
    }
  }

  private handleMetaError(error: any, message: string, accountId?: string): never {
    const status = error?.response?.status;
    const graphError = (error?.response?.data?.error || {}) as MetaGraphError;
    const graphCode = graphError.code;

    this.logger.error({
      message,
      status,
      graphCode,
      graphType: graphError.type,
      graphSubCode: graphError.error_subcode,
      fbTraceId: graphError.fbtrace_id,
      accountId,
    });

    if (status === 401 || graphCode === 190) {
      throw new UnauthorizedException("Invalid or expired Meta access token");
    }

    throw new BadGatewayException("Meta API request failed");
  }
}
