import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { BadGatewayException, UnauthorizedException } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { MetaAdsService } from "./meta-ads.service";

const TOKEN = "fake-access-token";

describe("MetaAdsService", () => {
  let service: MetaAdsService;
  let http: { get: jest.Mock };

  beforeEach(async () => {
    http = { get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetaAdsService, { provide: HttpService, useValue: http }],
    }).compile();
    service = module.get(MetaAdsService);
  });

  // Helper: stage one HTTP 200 response.
  const ok = (body: any) => of({ data: body });

  describe("getAdAccounts", () => {
    it("maps Graph response into the public MetaAdAccount shape", async () => {
      http.get.mockReturnValueOnce(
        ok({
          data: [
            {
              id: "act_1",
              name: "Acc A",
              account_status: 1,
              currency: "USD",
              timezone_name: "Asia/Tashkent",
            },
            {
              id: "act_2",
              name: "Acc B",
              account_status: 2,
              // currency + timezone missing — should default to null
            },
          ],
        }),
      );
      const out = await service.getAdAccounts(TOKEN);
      expect(out).toEqual([
        {
          id: "act_1",
          name: "Acc A",
          account_status: 1,
          currency: "USD",
          timezone_name: "Asia/Tashkent",
        },
        {
          id: "act_2",
          name: "Acc B",
          account_status: 2,
          currency: null,
          timezone_name: null,
        },
      ]);
      // Bearer token must be sent in the Authorization header.
      const callArgs = http.get.mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe(`Bearer ${TOKEN}`);
    });

    it("follows paging.next transparently to the end", async () => {
      http.get
        .mockReturnValueOnce(
          ok({
            data: [{ id: "act_1", name: "A", account_status: 1 }],
            paging: { next: "https://graph.facebook.com/v20.0/page2" },
          }),
        )
        .mockReturnValueOnce(
          ok({
            data: [{ id: "act_2", name: "B", account_status: 1 }],
            // no paging.next -> last page
          }),
        );
      const out = await service.getAdAccounts(TOKEN);
      expect(out).toHaveLength(2);
      expect(http.get).toHaveBeenCalledTimes(2);
      // Second call should be to the pre-built `next` URL with no extra params.
      expect(http.get.mock.calls[1][0]).toBe(
        "https://graph.facebook.com/v20.0/page2",
      );
      expect(http.get.mock.calls[1][1].params).toBeUndefined();
    });
  });

  describe("getCampaigns — act_ prefix wrapping", () => {
    it("prefixes a raw account id with act_ on the URL path", async () => {
      http.get.mockReturnValueOnce(ok({ data: [] }));
      await service.getCampaigns("1234567890", TOKEN);
      const url = http.get.mock.calls[0][0] as string;
      expect(url).toContain("/act_1234567890/campaigns");
    });

    it("does NOT double-prefix an id that already starts with act_", async () => {
      http.get.mockReturnValueOnce(ok({ data: [] }));
      await service.getCampaigns("act_1234567890", TOKEN);
      const url = http.get.mock.calls[0][0] as string;
      expect(url).toContain("/act_1234567890/campaigns");
      expect(url).not.toContain("act_act_");
    });

    it("requests ACTIVE+PAUSED+ARCHIVED so the dashboard isn't missing rows", async () => {
      http.get.mockReturnValueOnce(ok({ data: [] }));
      await service.getCampaigns("act_1", TOKEN);
      const params = http.get.mock.calls[0][1].params;
      expect(JSON.parse(params.effective_status)).toEqual([
        "ACTIVE",
        "PAUSED",
        "ARCHIVED",
      ]);
    });

    it("maps the response with objective falling back to null", async () => {
      http.get.mockReturnValueOnce(
        ok({
          data: [
            { id: "c1", name: "C1", status: "ACTIVE", objective: "LEADS" },
            { id: "c2", name: "C2", status: "PAUSED" },
          ],
        }),
      );
      const out = await service.getCampaigns("act_1", TOKEN);
      expect(out[0].objective).toBe("LEADS");
      expect(out[1].objective).toBeNull();
    });
  });

  describe("getInsights — purchase extraction + numeric parsing", () => {
    it("extracts conversions from the purchase action_type", async () => {
      http.get.mockReturnValueOnce(
        ok({
          data: [
            {
              campaign_id: "c1",
              date_start: "2026-06-01",
              spend: "12.34",
              impressions: "1000",
              clicks: "50",
              ctr: "5.0",
              cpc: "0.25",
              actions: [
                { action_type: "link_click", value: "50" },
                { action_type: "purchase", value: "7" },
              ],
              action_value: "210.50",
            },
          ],
        }),
      );
      const [row] = await service.getInsights("act_1", TOKEN);
      expect(row.conversions).toBe(7);
      expect(row.conversionValue).toBe(210.5);
      expect(row.spend).toBe(12.34);
      expect(row.impressions).toBe(1000);
      expect(row.clicks).toBe(50);
    });

    it("also accepts offsite_conversion.fb_pixel_purchase as purchase", async () => {
      http.get.mockReturnValueOnce(
        ok({
          data: [
            {
              campaign_id: "c1",
              date_start: "2026-06-01",
              spend: "0",
              impressions: "0",
              clicks: "0",
              ctr: "0",
              cpc: "0",
              actions: [
                {
                  action_type: "offsite_conversion.fb_pixel_purchase",
                  value: "3",
                },
              ],
            },
          ],
        }),
      );
      const [row] = await service.getInsights("act_1", TOKEN);
      expect(row.conversions).toBe(3);
    });

    it("no purchase actions -> conversions=0, conversionValue=0", async () => {
      http.get.mockReturnValueOnce(
        ok({
          data: [
            {
              campaign_id: "c1",
              date_start: "2026-06-01",
              spend: "0",
              impressions: "0",
              clicks: "0",
              ctr: "0",
              cpc: "0",
              actions: [{ action_type: "link_click", value: "5" }],
            },
          ],
        }),
      );
      const [row] = await service.getInsights("act_1", TOKEN);
      expect(row.conversions).toBe(0);
      expect(row.conversionValue).toBe(0);
    });

    it("requests level=campaign and time_increment=1 for daily breakdown", async () => {
      http.get.mockReturnValueOnce(ok({ data: [] }));
      await service.getInsights("act_1", TOKEN);
      const params = http.get.mock.calls[0][1].params;
      expect(params.level).toBe("campaign");
      expect(params.time_increment).toBe(1);
      expect(params.date_preset).toBe("last_30d");
    });

    it("passes a custom datePreset through to Graph", async () => {
      http.get.mockReturnValueOnce(ok({ data: [] }));
      await service.getInsights("act_1", TOKEN, "last_7d");
      const params = http.get.mock.calls[0][1].params;
      expect(params.date_preset).toBe("last_7d");
    });
  });

  describe("error handling — expired token vs rate limit vs other", () => {
    it("HTTP 401 -> UnauthorizedException with re-auth message", async () => {
      http.get.mockReturnValueOnce(
        throwError(() => ({
          response: { status: 401, data: { error: { code: 190 } } },
        })),
      );
      await expect(service.getAdAccounts(TOKEN)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("graphError.code=190 inside a 200 body -> UnauthorizedException", async () => {
      http.get.mockReturnValueOnce(
        ok({ error: { code: 190, message: "expired" } }),
      );
      await expect(service.getAdAccounts(TOKEN)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("graphError.code=17 (rate limit) -> BadGatewayException with retry hint", async () => {
      http.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 400,
            data: { error: { code: 17, message: "API too many calls" } },
          },
        })),
      );
      const err = await service.getAdAccounts(TOKEN).catch((e) => e);
      expect(err).toBeInstanceOf(BadGatewayException);
      expect(err.message).toMatch(/rate limit/i);
    });

    it("graphError.code=613 (per-account rate limit) -> BadGatewayException", async () => {
      http.get.mockReturnValueOnce(
        throwError(() => ({
          response: { status: 400, data: { error: { code: 613 } } },
        })),
      );
      await expect(service.getAdAccounts(TOKEN)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it("unknown error -> BadGatewayException that surfaces the Graph code", async () => {
      http.get.mockReturnValueOnce(
        throwError(() => ({
          response: {
            status: 500,
            data: { error: { code: 999, message: "boom" } },
          },
        })),
      );
      const err = await service.getAdAccounts(TOKEN).catch((e) => e);
      expect(err).toBeInstanceOf(BadGatewayException);
      expect(err.message).toContain("999");
    });
  });
});
