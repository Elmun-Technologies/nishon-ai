import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { BadRequestException } from "@nestjs/common";
import { GoogleConnector } from "./google.connector";

describe("GoogleConnector", () => {
  let connector: GoogleConnector;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string, def?: any) => {
        const vals: Record<string, string> = {
          GOOGLE_CLIENT_ID: "google-client-id",
          GOOGLE_CLIENT_SECRET: "google-client-secret",
          GOOGLE_DEVELOPER_TOKEN: "dev-token",
          API_BASE_URL: "https://api.test.com",
        };
        return vals[key] ?? def ?? "";
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleConnector,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    connector = module.get<GoogleConnector>(GoogleConnector);
    httpService = module.get(HttpService);
  });

  describe("getOAuthUrl", () => {
    it("should return a Google OAuth URL with required params", () => {
      const url = connector.getOAuthUrl("workspace-1");

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("access_type=offline");
      expect(url).toContain("adwords");
      expect(url).toContain("client_id=google-client-id");
    });

    it("should encode workspaceId in state param", () => {
      const url = connector.getOAuthUrl("ws-abc");
      const urlObj = new URL(url);
      const state = urlObj.searchParams.get("state")!;
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      expect(decoded.workspaceId).toBe("ws-abc");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange code and return tokens", async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            access_token: "access-123",
            refresh_token: "refresh-456",
            expires_in: 3600,
          },
        } as any),
      );

      const result = await connector.exchangeCodeForToken("auth-code");

      expect(result.accessToken).toBe("access-123");
      expect(result.refreshToken).toBe("refresh-456");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("should throw BadRequestException on failure", async () => {
      httpService.post.mockReturnValue(
        throwError(() => ({
          response: { data: { error_description: "invalid_grant" } },
        })),
      );

      await expect(connector.exchangeCodeForToken("bad-code")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("should return new access token and expiry", async () => {
      httpService.post.mockReturnValue(
        of({ data: { access_token: "new-token", expires_in: 3600 } } as any),
      );

      const result = await connector.refreshAccessToken("refresh-token");

      expect(result.accessToken).toBe("new-token");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("createCampaign", () => {
    it("should create budget and campaign, returning IDs", async () => {
      // First call: create budget → returns resource name
      httpService.post
        .mockReturnValueOnce(
          of({
            data: {
              results: [{ resourceName: "customers/123/campaignBudgets/456" }],
            },
          } as any),
        )
        // Second call: create campaign → returns resource name
        .mockReturnValueOnce(
          of({
            data: {
              results: [{ resourceName: "customers/123/campaigns/789" }],
            },
          } as any),
        );

      const result = await connector.createCampaign("123", "token", {
        name: "Test Campaign",
        advertisingChannelType: "SEARCH",
        dailyBudgetUsd: 20,
      });

      expect(result.id).toBe("789");
      expect(result.budgetId).toBe("456");
      expect(httpService.post).toHaveBeenCalledTimes(2);

      // Verify budget was converted to micros
      const budgetCallBody = httpService.post.mock.calls[0][1] as any;
      expect(budgetCallBody.operations[0].create.amountMicros).toBe(20_000_000);
    });

    it("should throw BadRequestException if budget creation fails", async () => {
      httpService.post.mockReturnValue(
        throwError(() => ({
          response: { data: { error: { message: "Budget limit exceeded" } } },
        })),
      );

      await expect(
        connector.createCampaign("123", "token", {
          name: "Test",
          advertisingChannelType: "SEARCH",
          dailyBudgetUsd: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateCampaignStatus", () => {
    it("should send PAUSED status mutation", async () => {
      httpService.post.mockReturnValue(of({ data: { results: [] } } as any));

      await connector.updateCampaignStatus("123", "token", "456", "PAUSED");

      const callBody = httpService.post.mock.calls[0][1] as any;
      expect(callBody.operations[0].update.status).toBe("PAUSED");
    });
  });

  describe("getInsights", () => {
    it("should parse GAQL stream response into insights", async () => {
      const mockStreamData = [
        {
          results: [
            {
              campaign: { id: "789", name: "Test Camp" },
              segments: { date: "2024-01-15" },
              metrics: {
                impressions: "10000",
                clicks: "500",
                cost_micros: "25000000",
                conversions: "12",
              },
            },
          ],
        },
      ];

      httpService.post.mockReturnValue(of({ data: mockStreamData } as any));

      const insights = await connector.getInsights("123", "token", {
        since: "2024-01-01",
        until: "2024-01-31",
      });

      expect(insights).toHaveLength(1);
      expect(insights[0].impressions).toBe(10000);
      expect(insights[0].clicks).toBe(500);
      expect(insights[0].costMicros).toBe(25000000);
      expect(insights[0].conversions).toBe(12);
      expect(insights[0].campaignName).toBe("Test Camp");
    });
  });
});
