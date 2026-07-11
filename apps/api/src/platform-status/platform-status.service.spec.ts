const mockAiConfigured = { value: false };

jest.mock("@adspectr/ai-sdk", () => ({
  isAiClientConfigured: jest.fn(() => mockAiConfigured.value),
}));

import { PlatformStatusService } from "./platform-status.service";
import { Platform } from "@adspectr/shared";

describe("PlatformStatusService", () => {
  let service: PlatformStatusService;
  let env: Record<string, string>;
  let reve: { isConfigured: jest.Mock };
  let tgstat: { isConfigured: jest.Mock };
  let platforms: { getConnectedAccounts: jest.Mock };

  const build = () => {
    const config = { get: (k: string) => env[k] };
    return new PlatformStatusService(
      config as any,
      reve as any,
      tgstat as any,
      platforms as any,
    );
  };

  beforeEach(() => {
    mockAiConfigured.value = false;
    env = {};
    reve = { isConfigured: jest.fn(() => false) };
    tgstat = { isConfigured: jest.fn(() => false) };
    platforms = { getConnectedAccounts: jest.fn() };
    service = build();
  });

  it("reports everything off when no keys are set", async () => {
    const caps = await service.getCapabilities();
    const live = caps.filter((c) => c.live);
    expect(live).toHaveLength(0);
    // Never leaks a key value — only booleans + hints.
    expect(caps.every((c) => typeof c.live === "boolean")).toBe(true);
    expect(JSON.stringify(caps)).not.toContain("sk-");
  });

  it("lights up server capabilities from their own signals / env keys", async () => {
    mockAiConfigured.value = true;
    reve.isConfigured.mockReturnValue(true);
    tgstat.isConfigured.mockReturnValue(true);
    env = {
      PAYME_MERCHANT_ID: "m",
      PAYME_MERCHANT_KEY: "k",
      TELEGRAM_BOT_TOKEN: "t",
      HEYGEN_API_KEY: "h",
    };
    const caps = await service.getCapabilities();
    const by = Object.fromEntries(caps.map((c) => [c.key, c.live]));
    expect(by.ai).toBe(true);
    expect(by.reve).toBe(true);
    expect(by.telegramChannels).toBe(true);
    expect(by.payme).toBe(true);
    expect(by.telegramBot).toBe(true);
    expect(by.heygen).toBe(true);
    expect(by.higgsfield).toBe(false);
  });

  it("payme needs BOTH id and key", async () => {
    env = { PAYME_MERCHANT_ID: "m" };
    const caps = await service.getCapabilities();
    expect(caps.find((c) => c.key === "payme")?.live).toBe(false);
  });

  it("meta stays off without server app credentials (no account lookup)", async () => {
    const caps = await service.getCapabilities("w1", "u1");
    expect(caps.find((c) => c.key === "meta")?.live).toBe(false);
    expect(platforms.getConnectedAccounts).not.toHaveBeenCalled();
  });

  it("meta is live when app creds set AND an active Meta account exists", async () => {
    env = { META_APP_ID: "a", META_APP_SECRET: "s" };
    platforms.getConnectedAccounts.mockResolvedValue([
      { platform: Platform.META, isActive: true },
    ]);
    const caps = await service.getCapabilities("w1", "u1");
    expect(caps.find((c) => c.key === "meta")?.live).toBe(true);
    expect(platforms.getConnectedAccounts).toHaveBeenCalledWith("w1", "u1");
  });

  it("meta stays off (never throws) when the account lookup is forbidden", async () => {
    env = { META_APP_ID: "a", META_APP_SECRET: "s" };
    platforms.getConnectedAccounts.mockRejectedValue(
      new Error("Access denied"),
    );
    const caps = await service.getCapabilities("w1", "attacker");
    expect(caps.find((c) => c.key === "meta")?.live).toBe(false);
  });
});
