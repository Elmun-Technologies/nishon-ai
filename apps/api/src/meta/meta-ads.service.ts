import { HttpService } from "@nestjs/axios";
import {
  BadGatewayException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { firstValueFrom } from "rxjs";

// ─── Graph API response types ─────────────────────────────────────────────────

type MetaGraphError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type Paging = {
  cursors?: { before: string; after: string };
  next?: string;
};

type PagedResponse<T> = {
  data?: T[];
  paging?: Paging;
  error?: MetaGraphError;
};

// ─── Public data types ────────────────────────────────────────────────────────

export type MetaAdAccount = {
  id: string;
  name: string;
  account_status: number;
  currency: string | null;
  timezone_name: string | null;
};

export type MetaCampaign = {
  id: string;
  name: string;
  status: string;
  objective: string | null;
};

export type MetaInsightRow = {
  campaignId: string;
  date: string;          // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  conversionValue: number;
};

const GRAPH_BASE = "https://graph.facebook.com/v20.0";
const DEFAULT_DATE_PRESET = "last_30d";
const PAGE_LIMIT = 200;

/**
 * Reusable client for the Meta Graph API.
 *
 * Design rules:
 * - All public methods are pure (no DB access) — they fetch and return data.
 * - Pagination is handled transparently via fetchAllPages().
 * - Token expiry (code 190) and rate limits (code 17/613) are surfaced as
 *   typed exceptions so callers can handle them without string-matching.
 * - Every method logs start/end with structured metadata for observability.
 */
@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  constructor(private readonly http: HttpService) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns all ad accounts the token owner has access to.
   * Uses /me/adaccounts with cursor-based pagination.
   */
  async getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    this.logger.log("Fetching ad accounts");

    const items = await this.fetchAllPages<{
      id: string;
      name: string;
      account_status: number;
      currency?: string;
      timezone_name?: string;
    }>(
      `${GRAPH_BASE}/me/adaccounts`,
      { fields: "id,name,account_status,currency,timezone_name" },
      accessToken,
    );

    this.logger.log({ message: "Ad accounts fetched", count: items.length });

    return items.map((a) => ({
      id: a.id,
      name: a.name,
      account_status: a.account_status,
      currency: a.currency ?? null,
      timezone_name: a.timezone_name ?? null,
    }));
  }

  /**
   * Returns all campaigns for a given ad account.
   * Includes ACTIVE, PAUSED, and ARCHIVED campaigns so the dashboard is complete.
   */
  async getCampaigns(
    adAccountId: string,
    accessToken: string,
  ): Promise<MetaCampaign[]> {
    this.logger.log({ message: "Fetching campaigns", adAccountId });

    const accountPath = this.toActId(adAccountId);
    const items = await this.fetchAllPages<{
      id: string;
      name: string;
      status: string;
      objective?: string;
    }>(
      `${GRAPH_BASE}/${accountPath}/campaigns`,
      {
        fields: "id,name,status,objective",
        effective_status: JSON.stringify(["ACTIVE", "PAUSED", "ARCHIVED"]),
      },
      accessToken,
    );

    this.logger.log({
      message: "Campaigns fetched",
      adAccountId,
      count: items.length,
    });

    return items.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective ?? null,
    }));
  }

  /**
   * Returns aggregated daily insights for every campaign in an ad account.
   * Uses the account-level insights edge with breakdown by campaign, which is
   * more efficient than querying each campaign individually.
   *
   * The `datePreset` parameter defaults to "last_30d" so callers don't need
   * to manage date ranges for normal syncs, but can override for backfills.
   */
  async getInsights(
    adAccountId: string,
    accessToken: string,
    datePreset: string = DEFAULT_DATE_PRESET,
  ): Promise<MetaInsightRow[]> {
    this.logger.log({ message: "Fetching insights", adAccountId, datePreset });

    const accountPath = this.toActId(adAccountId);
    const items = await this.fetchAllPages<{
      campaign_id: string;
      date_start: string;
      spend: string;
      impressions: string;
      clicks: string;
      ctr: string;
      cpc: string;
      actions?: Array<{ action_type: string; value: string }>;
      action_value?: string;
    }>(
      `${GRAPH_BASE}/${accountPath}/insights`,
      {
        fields: "campaign_id,date_start,spend,impressions,clicks,ctr,cpc,actions,action_value",
        level: "campaign",
        date_preset: datePreset,
        time_increment: 1, // daily breakdown — one row per campaign per day
        limit: PAGE_LIMIT,
      },
      accessToken,
    );

    this.logger.log({
      message: "Insights fetched",
      adAccountId,
      rows: items.length,
    });

    return items.map((row) => {
      // Extract conversions from actions array (if present)
      let conversions = 0;
      if (row.actions && Array.isArray(row.actions)) {
        const purchaseAction = row.actions.find(
          (a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase",
        );
        if (purchaseAction) {
          conversions = parseInt(purchaseAction.value, 10) || 0;
        }
      }

      return {
        campaignId: row.campaign_id,
        date: row.date_start,
        spend: parseFloat(row.spend) || 0,
        impressions: parseInt(row.impressions, 10) || 0,
        clicks: parseInt(row.clicks, 10) || 0,
        ctr: parseFloat(row.ctr) || 0,
        cpc: parseFloat(row.cpc) || 0,
        conversions: conversions,
        conversionValue: parseFloat(row.action_value) || 0,
      };
    });
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────

  /**
   * Transparently follows Meta's cursor-based pagination until there are no
   * more pages. Returns all items concatenated into a single array.
   *
   * Meta paginates via `paging.next` (a full URL) or `paging.cursors.after`.
   * We use `paging.next` because it already encodes all params including `after`.
   */
  private async fetchAllPages<T>(
    url: string,
    params: Record<string, any>,
    accessToken: string,
  ): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;
    let nextParams: Record<string, any> | null = {
      ...params,
      limit: params.limit ?? PAGE_LIMIT,
    };

    while (nextUrl) {
      const response = await firstValueFrom(
        this.http.get<PagedResponse<T>>(nextUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: nextParams ?? undefined,
        }),
      ).catch((error: any) => {
        this.handleMetaError(error, "Graph API request failed");
      });

      const page = response.data;

      if (page.error) {
        // Graph API returned HTTP 200 but with an error block (rare but happens)
        this.handleInlineError(page.error);
      }

      results.push(...(page.data ?? []));

      // Follow paging.next if present — it's a pre-built URL with cursor baked in.
      // Clear nextParams so we don't double-send them on subsequent pages.
      if (page.paging?.next) {
        nextUrl = page.paging.next;
        nextParams = null;
      } else {
        nextUrl = null;
      }
    }

    return results;
  }

  // ─── Error handling ──────────────────────────────────────────────────────────

  private handleMetaError(error: any, context: string): never {
    const status: number | undefined = error?.response?.status;
    const graphError = (error?.response?.data?.error ?? {}) as MetaGraphError;

    this.logger.error({
      message: context,
      httpStatus: status,
      graphCode: graphError.code,
      graphType: graphError.type,
      graphSubCode: graphError.error_subcode,
      fbTraceId: graphError.fbtrace_id,
      detail: graphError.message,
    });

    if (status === 401 || graphError.code === 190) {
      throw new UnauthorizedException(
        "Invalid or expired Meta access token. Please re-authorise the integration.",
      );
    }

    // Rate limit: code 17 = API calls limit, 613 = calls limit per ad account
    if (graphError.code === 17 || graphError.code === 613) {
      throw new BadGatewayException(
        "Meta API rate limit reached. Sync will be retried automatically.",
      );
    }

    throw new BadGatewayException(
      `Meta API error (code ${graphError.code ?? status ?? "unknown"}): ${graphError.message ?? "request failed"}`,
    );
  }

  private handleInlineError(graphError: MetaGraphError): never {
    this.logger.error({
      message: "Meta inline error in response body",
      graphCode: graphError.code,
      detail: graphError.message,
    });

    if (graphError.code === 190) {
      throw new UnauthorizedException(
        "Invalid or expired Meta access token. Please re-authorise the integration.",
      );
    }

    throw new BadGatewayException(
      `Meta API inline error: ${graphError.message ?? "unknown error"}`,
    );
  }

  /** Ensures the account ID has the act_ prefix required by the Graph API. */
  private toActId(id: string): string {
    return id.startsWith("act_") ? id : `act_${id}`;
  }
}
