import { GoogleOAuthGuard, FacebookOAuthGuard } from "./oauth.guard";

const cfg = (env: Record<string, string | undefined>) =>
  ({ get: (k: string, d?: string) => env[k] ?? d }) as any;

const contextWith = (redirect: jest.Mock) =>
  ({
    switchToHttp: () => ({ getResponse: () => ({ redirect }) }),
  }) as any;

describe("OAuth guards — honest not-configured redirect", () => {
  it("GoogleOAuthGuard redirects to the frontend callback when unconfigured", () => {
    const redirect = jest.fn();
    const guard = new GoogleOAuthGuard(cfg({ FRONTEND_URL: "https://app.uz" }));
    const result = guard.canActivate(contextWith(redirect));
    expect(result).toBe(false);
    expect(redirect).toHaveBeenCalledTimes(1);
    const url = redirect.mock.calls[0][0] as string;
    expect(url).toContain("https://app.uz/auth/google/callback");
    expect(url).toContain("error=not_configured");
  });

  it("FacebookOAuthGuard redirects (shared google callback UI) when unconfigured", () => {
    const redirect = jest.fn();
    const guard = new FacebookOAuthGuard(
      cfg({ FRONTEND_URL: "https://app.uz" }),
    );
    const result = guard.canActivate(contextWith(redirect));
    expect(result).toBe(false);
    expect(redirect.mock.calls[0][0]).toContain(
      "/auth/google/callback?error=not_configured",
    );
  });

  it("delegates to passport when Google is configured", () => {
    const guard = new GoogleOAuthGuard(
      cfg({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }),
    );
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), "canActivate")
      .mockReturnValue(true as any);
    const redirect = jest.fn();
    const result = guard.canActivate(contextWith(redirect));
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBe(true);
    superSpy.mockRestore();
  });
});
