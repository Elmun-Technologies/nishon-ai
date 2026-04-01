import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { BadRequestException } from "@nestjs/common";
import { MetaConnector } from "./meta.connector";

describe("MetaConnector", () => {
  let connector: MetaConnector;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string, def?: any) => {
        const vals: Record<string, string> = {
          META_APP_ID: "test-app-id",
          META_APP_SECRET: "test-app-secret",
          API_BASE_URL: "https://api.test.com",
        };
        return vals[key] ?? def ?? "";
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaConnector,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    connector = module.get<MetaConnector>(MetaConnector);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  describe("getOAuthUrl", () => {
    it("should return a Facebook OAuth URL with correct params", () => {
      const url = connector.getOAuthUrl("workspace-123");

      expect(url).toContain("https://www.facebook.com/dialog/oauth");
      expect(url).toContain("ads_management");
      expect(url).toContain("ads_read");
      expect(url).toContain("client_id=test-app-id");
    });

    it("should encode workspaceId in state param", () => {
      const url = connector.getOAuthUrl("workspace-abc");
      const urlObj = new URL(url);
      const state = urlObj.searchParams.get("state")!;
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));

      expect(decoded.workspaceId).toBe("workspace-abc");
    });

    it("should throw if META_APP_ID and callbackUrl are missing", () => {
      // When callbackUrl is empty, connector throws BadRequestException
      // Re-create connector with empty callbackUrl to trigger the check
      const badConfigMock = {
        get: jest.fn((key: string, def?: any) => {
          if (key === "META_APP_ID") return "some-app-id";
          if (key === "META_APP_SECRET") return "some-secret";
          if (key === "API_BASE_URL") return ""; // Missing base URL → empty callbackUrl
          return def ?? "";
        }),
      };

      const badConnector = new (MetaConnector as any)(badConfigMock, httpService);

      expect(() => badConnector.getOAuthUrl("ws-1")).toThrow(BadRequestException);
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange code for access token", async () => {
      const mockResponse = {
        data: {
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 5184000,
        },
      };

      httpService.get.mockReturnValue(of(mockResponse as any));

      const result = await connector.exchangeCodeForToken("test-code");

      expect(result.accessToken).toBe("mock-token");
      expect(result.tokenType).toBe("bearer");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("should return null expiresAt when expires_in is missing", async () => {
      httpService.get.mockReturnValue(
        of({ data: { access_token: "token", token_type: "bearer" } } as any),
      );

      const result = await connector.exchangeCodeForToken("code");
      expect(result.expiresAt).toBeNull();
    });

    it("should throw BadRequestException on API error", async () => {
      httpService.get.mockReturnValue(
        throwError(() => ({
          response: { data: { error: { message: "Invalid code" } } },
        })),
      );

      await expect(connector.exchangeCodeForToken("bad-code")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getAdAccounts", () => {
    it("should return formatted ad accounts list", async () => {
      const mockData = {
        data: {
          data: [
            { id: "act_123", name: "My Business", currency: "USD", account_status: 1 },
            { id: "act_456", name: "Client Account", currency: "EUR", account_status: 1 },
          ],
        },
      };

      httpService.get.mockReturnValue(of(mockData as any));

      const accounts = await connector.getAdAccounts("token-123");

      expect(accounts).toHaveLength(2);
      expect(accounts[0]).toEqual({
        id: "act_123",
        name: "My Business",
        currency: "USD",
        status: 1,
      });
    });
  });

  describe("createCampaign", () => {
    it("should create a campaign and return its ID", async () => {
      httpService.post.mockReturnValue(of({ data: { id: "camp-123" } } as any));

      const result = await connector.createCampaign("act_123", "token", {
        name: "Test Campaign",
        objective: "OUTCOME_LEADS",
        status: "PAUSED",
        dailyBudget: 10,
        specialAdCategories: [],
      });

      expect(result.id).toBe("camp-123");

      // Verify budget was converted to cents
      const callArgs = httpService.post.mock.calls[0];
      expect(callArgs[2].params.daily_budget).toBe(1000); // $10 = 1000 cents
    });
  });

  describe("pauseCampaign / resumeCampaign", () => {
    beforeEach(() => {
      httpService.post.mockReturnValue(of({ data: {} } as any));
    });

    it("should post PAUSED status", async () => {
      await connector.pauseCampaign("camp-123", "token");
      expect(httpService.post.mock.calls[0][2].params.status).toBe("PAUSED");
    });

    it("should post ACTIVE status on resume", async () => {
      await connector.resumeCampaign("camp-123", "token");
      expect(httpService.post.mock.calls[0][2].params.status).toBe("ACTIVE");
    });
  });

  describe("getInsights", () => {
    it("should return parsed insights with numeric types", async () => {
      const mockData = {
        data: {
          data: [
            {
              impressions: "5000",
              clicks: "250",
              spend: "12.50",
              actions: [{ action_type: "link_click", value: "200" }],
              date_start: "2024-01-01",
            },
          ],
        },
      };

      httpService.get.mockReturnValue(of(mockData as any));

      const insights = await connector.getInsights("camp-123", "token", {
        since: "2024-01-01",
        until: "2024-01-07",
        level: "campaign",
        fields: ["impressions", "clicks", "spend"],
      });

      expect(insights).toHaveLength(1);
      expect(insights[0].impressions).toBe(5000);
      expect(insights[0].clicks).toBe(250);
      expect(insights[0].spend).toBe(12.5);
    });
  });
});
