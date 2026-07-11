import { ServiceUnavailableException } from "@nestjs/common";
import { of, throwError } from "rxjs";

const mockAiClient = { completeJson: jest.fn() };
const mockAiConfigured = { value: false };

jest.mock("@adspectr/ai-sdk", () => ({
  createAdSpectrAiClientFromEnv: jest.fn(() => mockAiClient),
  isAiClientConfigured: jest.fn(() => mockAiConfigured.value),
}));

import { TgStatService } from "./tgstat.service";

describe("TgStatService", () => {
  let service: TgStatService;
  let http: { get: jest.Mock };
  let key: string | undefined;

  const build = () => {
    const config = {
      get: jest.fn((k: string) => (k === "TGSTAT_API_KEY" ? key : undefined)),
    };
    return new TgStatService(http as any, config as any);
  };

  beforeEach(() => {
    mockAiConfigured.value = false;
    mockAiClient.completeJson.mockReset();
    http = { get: jest.fn() };
    key = "tg-key";
    service = build();
  });

  it("reports configured based on TGSTAT_API_KEY", () => {
    expect(service.isConfigured()).toBe(true);
    key = "";
    service = build();
    expect(service.isConfigured()).toBe(false);
  });

  it("throws ServiceUnavailable when not configured", async () => {
    key = "";
    service = build();
    await expect(
      service.recommend({ niche: "krossovka" } as any),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(http.get).not.toHaveBeenCalled();
  });

  it("normalises, filters tiny channels, ranks, and estimates price", async () => {
    http.get.mockReturnValue(
      of({
        data: {
          status: "ok",
          response: {
            items: [
              {
                id: 1,
                username: "big",
                title: "Big Sneakers",
                category: "shopping",
                country: "uz",
                participants_count: 100000,
                avg_post_reach: 20000,
                err_percent: 8,
              },
              // nested under `.channel`
              {
                channel: {
                  id: 2,
                  username: "small",
                  title: "Small Shop",
                  participants_count: 3000,
                  avg_post_reach: 800,
                  err_percent: 5,
                },
              },
              // too tiny → dropped
              {
                id: 3,
                title: "Dead",
                participants_count: 100,
              },
            ],
          },
        },
      }),
    );

    const out = await service.recommend({
      niche: "krossovka",
      country: "UZ",
    } as any);

    expect(out.aiAnnotated).toBe(false); // AI not configured → no fabricated why
    expect(out.channels).toHaveLength(2); // 100-sub channel filtered out
    // Ranked: bigger + higher ER first
    expect(out.channels[0].id).toBe("1");
    expect(out.channels[0].estPricePerPostUsd).toBe(30); // 20000/1000 * 1.5
    expect(out.channels[0].fitScore).toBeGreaterThan(out.channels[1].fitScore);
    // TGStat call used the token + lowercased country
    const [, opts] = http.get.mock.calls[0];
    expect(opts.params.token).toBe("tg-key");
    expect(opts.params.country).toBe("uz");
    expect(opts.params.q).toBe("krossovka");
  });

  it("annotates each channel with an AI 'why' when AI is configured", async () => {
    mockAiConfigured.value = true;
    mockAiClient.completeJson.mockResolvedValue({
      items: [{ index: 0, why: "Krossovka auditoriyasi mos" }],
    });
    http.get.mockReturnValue(
      of({
        data: {
          response: {
            items: [
              {
                id: 1,
                title: "Sneaker Hub",
                participants_count: 50000,
                avg_post_reach: 10000,
                err_percent: 6,
              },
            ],
          },
        },
      }),
    );

    const out = await service.recommend({ niche: "krossovka" } as any);
    expect(out.aiAnnotated).toBe(true);
    expect(out.channels[0].why).toBe("Krossovka auditoriyasi mos");
  });

  it("surfaces upstream errors as BadGateway", async () => {
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 403, data: "forbidden" } })),
    );
    await expect(
      service.recommend({ niche: "x" } as any),
    ).rejects.toMatchObject({ status: 502 });
  });
});
