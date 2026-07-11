import {
  isFacebookConfigured,
  isGoogleConfigured,
  pickPrimaryFrontendUrl,
  resolveFrontendUrl,
} from "./oauth.util";

const cfg = (env: Record<string, string | undefined>) =>
  ({ get: (k: string, d?: string) => env[k] ?? d }) as any;

describe("oauth.util", () => {
  describe("pickPrimaryFrontendUrl", () => {
    it("prefers the first https entry and strips trailing slash", () => {
      expect(
        pickPrimaryFrontendUrl(
          "http://a.com, https://b.com/, https://c.com",
          "http://fallback",
        ),
      ).toBe("https://b.com");
    });
    it("falls back when no valid entry", () => {
      expect(pickPrimaryFrontendUrl("https//broken", "http://fallback")).toBe(
        "http://fallback",
      );
    });
  });

  describe("resolveFrontendUrl", () => {
    it("reads FRONTEND_URL", () => {
      expect(resolveFrontendUrl(cfg({ FRONTEND_URL: "https://app.uz/" }))).toBe(
        "https://app.uz",
      );
    });
    it("defaults to localhost", () => {
      expect(resolveFrontendUrl(cfg({}))).toBe("http://localhost:3000");
    });
  });

  describe("isGoogleConfigured", () => {
    it("true only when both id and secret are set", () => {
      expect(
        isGoogleConfigured(
          cfg({ GOOGLE_CLIENT_ID: "x", GOOGLE_CLIENT_SECRET: "y" }),
        ),
      ).toBe(true);
      expect(isGoogleConfigured(cfg({ GOOGLE_CLIENT_ID: "x" }))).toBe(false);
      expect(isGoogleConfigured(cfg({}))).toBe(false);
    });
  });

  describe("isFacebookConfigured", () => {
    it("true via FACEBOOK_* pair", () => {
      expect(
        isFacebookConfigured(
          cfg({ FACEBOOK_APP_ID: "x", FACEBOOK_APP_SECRET: "y" }),
        ),
      ).toBe(true);
    });
    it("true via META_* fallback", () => {
      expect(
        isFacebookConfigured(cfg({ META_APP_ID: "x", META_APP_SECRET: "y" })),
      ).toBe(true);
    });
    it("false when only one side is present", () => {
      expect(isFacebookConfigured(cfg({ META_APP_ID: "x" }))).toBe(false);
      expect(isFacebookConfigured(cfg({}))).toBe(false);
    });
  });
});
