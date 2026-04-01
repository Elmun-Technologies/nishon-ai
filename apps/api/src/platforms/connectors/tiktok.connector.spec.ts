import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { BadRequestException } from "@nestjs/common";
import { TiktokConnector } from "./tiktok.connector";

const makeConfig = (overrides: Record<string, string> = {}) => ({
  get: jest.fn((key: string, def?: any) => {
    const vals: Record<string, string> = {
      TIKTOK_APP_ID: "tiktok-app-id",
      TIKTOK_APP_SECRET: "tiktok-secret",
      API_BASE_URL: "https://api.test.com",
      ...overrides,
    };
    return vals[key] ?? def ?? "";
  }),
});

describe("TiktokConnector", () => {
  let connector: TiktokConnector;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const mockHttp = { get: jest.fn(), post: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiktokConnector,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: makeConfig() },
      ],
    }).compile();

    connector = module.get<TiktokConnector>(TiktokConnector);
    httpService = module.get(HttpService);
  });

  describe("getOAuthUrl", () => {
    it("should return TikTok OAuth URL with required params", () => {
      const url = connector.getOAuthUrl("workspace-1");
      expect(url).toContain("https://www.tiktok.com/v2/auth/authorize");
      expect(url).toContain("client_key=tiktok-app-id");
      expect(url).toContain("ad.campaign.write");
    });

    it("should encode workspaceId in state param", () => {
      const url = connector.getOAuthUrl("ws-xyz");
      const urlObj = new URL(url);
      const state = urlObj.searchParams.get("state")!;
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      expect(decoded.workspaceId).toBe("ws-xyz");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should return access token and advertiser ID", async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            code: 0,
            data: {
              access_token: "tt-token",
              advertiser_ids: ["adv-123"],
              expires_in: 86400,
            },
          },
        } as any),
      );

      const result = await connector.exchangeCodeForToken("auth-code");

      expect(result.accessToken).toBe("tt-token");
      expect(result.advertiserId).toBe("adv-123");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("should throw on non-zero response code", async () => {
      httpService.post.mockReturnValue(
        of({ data: { code: 40001, message: "Invalid app" } } as any),
      );

      await expect(connector.exchangeCodeForToken("code")).rejects.toThrow(BadRequestException);
    });
  });

  describe("createCampaign", () => {
    it("should create a campaign and return its ID", async () => {
      httpService.post.mockReturnValue(
        of({ data: { code: 0, data: { campaign_id: "camp-999" } } } as any),
      );

      const result = await connector.createCampaign("adv-123", "token", {
        name: "Test TT Campaign",
        objectiveType: "TRAFFIC",
        budgetMode: "BUDGET_MODE_DAY",
        budget: 50,
      });

      expect(result.id).toBe("camp-999");

      const callBody = httpService.post.mock.calls[0][1] as Record<string, any>;
      expect(callBody.operation_status).toBe("DISABLE"); // always start paused
    });
  });

  describe("pauseCampaign", () => {
    it("should send DISABLE status", async () => {
      httpService.post.mockReturnValue(
        of({ data: { code: 0, data: {} } } as any),
      );

      await connector.pauseCampaign("adv-123", "token", "camp-456");

      const body = httpService.post.mock.calls[0][1] as Record<string, any>;
      expect(body.opt_status).toBe("DISABLE");
      expect(body.campaign_ids).toContain("camp-456");
    });
  });

  describe("getInsights", () => {
    it("should parse TikTok report rows", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            code: 0,
            data: {
              list: [
                {
                  dimensions: { campaign_id: "999", stat_time_day: "2024-01-15" },
                  metrics: {
                    impressions: "8000",
                    clicks: "400",
                    spend: "30.50",
                    conversion: "15",
                    reach: "6000",
                    video_play_actions: "1200",
                  },
                },
              ],
            },
          },
        } as any),
      );

      const insights = await connector.getInsights("adv-123", "token", {
        since: "2024-01-01",
        until: "2024-01-31",
      });

      expect(insights).toHaveLength(1);
      expect(insights[0].campaignId).toBe("999");
      expect(insights[0].impressions).toBe(8000);
      expect(insights[0].clicks).toBe(400);
      expect(insights[0].spend).toBe(30.5);
      expect(insights[0].conversions).toBe(15);
    });

    it("should return empty array on API error", async () => {
      httpService.get.mockReturnValue(
        of({ data: { code: 40100, message: "No permission" } } as any),
      );

      const insights = await connector.getInsights("adv-123", "token", {
        since: "2024-01-01",
        until: "2024-01-31",
      });

      expect(insights).toEqual([]);
    });
  });
});
