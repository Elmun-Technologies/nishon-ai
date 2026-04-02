import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { BadRequestException } from "@nestjs/common";
import { YandexConnector } from "./yandex.connector";

describe("YandexConnector", () => {
  let connector: YandexConnector;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string, def?: string) => {
        const values: Record<string, string> = {
          YANDEX_CLIENT_ID: "yandex-client-id",
          YANDEX_CLIENT_SECRET: "yandex-client-secret",
          API_BASE_URL: "https://api.test.com",
        };

        return values[key] ?? def ?? "";
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexConnector,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    connector = module.get<YandexConnector>(YandexConnector);
    httpService = module.get(HttpService);
  });

  describe("getOAuthUrl", () => {
    it("builds a Yandex OAuth URL including workspace state", () => {
      const url = connector.getOAuthUrl("workspace-42");
      const parsed = new URL(url);

      expect(url).toContain("https://oauth.yandex.ru/authorize");
      expect(parsed.searchParams.get("client_id")).toBe("yandex-client-id");
      expect(parsed.searchParams.get("scope")).toBe("direct");

      const encodedState = parsed.searchParams.get("state")!;
      const decodedState = JSON.parse(
        Buffer.from(encodedState, "base64").toString("utf8"),
      );
      expect(decodedState.workspaceId).toBe("workspace-42");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("exchanges authorization code and returns access/refresh tokens", async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            access_token: "access-123",
            refresh_token: "refresh-456",
            expires_in: 3600,
          },
        } as any),
      );

      const result = await connector.exchangeCodeForToken("test-code");

      expect(result.accessToken).toBe("access-123");
      expect(result.refreshToken).toBe("refresh-456");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("createCampaign", () => {
    it("creates a campaign and converts daily budget to micros", async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            result: {
              AddResults: [{ Id: 777 }],
            },
          },
        } as any),
      );

      const result = await connector.createCampaign("token-1", {
        name: "Test campaign",
        startDate: "2026-03-31",
        dailyBudget: 25,
      });

      expect(result.id).toBe("777");

      const body = httpService.post.mock.calls[0][1] as {
        method: string;
        params: { Campaigns: Array<{ DailyBudget: { Amount: number } }> };
      };

      expect(body.method).toBe("add");
      expect(body.params.Campaigns[0].DailyBudget.Amount).toBe(25_000_000);
    });

    it("throws BadRequestException when Yandex returns campaign-level error", async () => {
      httpService.post.mockReturnValue(
        of({
          data: {
            result: {
              AddResults: [{ Errors: [{ Message: "Invalid campaign" }] }],
            },
          },
        } as any),
      );

      await expect(
        connector.createCampaign("token-1", {
          name: "Bad campaign",
          startDate: "2026-03-31",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getInsights", () => {
    it("parses TSV report rows into normalized insight records", async () => {
      const tsv = [
        "ReportName",
        "Date\tCampaignId\tImpressions\tClicks\tCost\tConversions\tCtr",
        "2026-03-30\t123\t1000\t55\t92.15\t4\t5.5",
        "Total\tTotal\t1000\t55\t92.15\t4\t5.5",
      ].join("\n");

      httpService.post.mockReturnValue(
        of({ status: 200, data: tsv } as any),
      );

      const results = await connector.getInsights("token-1", "login-1", {
        since: "2026-03-01",
        until: "2026-03-31",
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        campaignId: "123",
        date: "2026-03-30",
        impressions: 1000,
        clicks: 55,
        cost: 92.15,
        conversions: 4,
        ctr: 5.5,
      });
    });

    it("returns an empty array when reports API request fails", async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error("timeout")),
      );

      const results = await connector.getInsights("token-1", "login-1");

      expect(results).toEqual([]);
    });
  });
});
