import { ConfigService } from "@nestjs/config";

/**
 * FRONTEND_URL is a comma-separated allowlist used for CORS. For OAuth redirects
 * we need a single well-formed URL — pick the first https:// (or http://) entry
 * and strip a trailing slash. Silently ignores typos like `https//example.com`
 * (missing colon) that would otherwise DNS-fail in the browser after redirect.
 */
export function pickPrimaryFrontendUrl(raw: string, fallback: string): string {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const https = parts.find((p) => p.startsWith("https://"));
  const http = parts.find((p) => p.startsWith("http://"));
  const pick = https ?? http ?? fallback;
  return pick.replace(/\/$/, "");
}

export function resolveFrontendUrl(config: ConfigService): string {
  const raw = config.get<string>("FRONTEND_URL", "http://localhost:3000");
  return pickPrimaryFrontendUrl(raw, "http://localhost:3000");
}

const has = (config: ConfigService, key: string): boolean =>
  Boolean(config.get<string>(key)?.trim());

/** Google Sign-In needs its own OAuth client id + secret. */
export function isGoogleConfigured(config: ConfigService): boolean {
  return has(config, "GOOGLE_CLIENT_ID") && has(config, "GOOGLE_CLIENT_SECRET");
}

/**
 * Facebook login reuses the Meta app when FACEBOOK_* is unset (same developer
 * app powers Marketing API + social login), so either pair activates it.
 */
export function isFacebookConfigured(config: ConfigService): boolean {
  const id = has(config, "FACEBOOK_APP_ID") || has(config, "META_APP_ID");
  const secret =
    has(config, "FACEBOOK_APP_SECRET") || has(config, "META_APP_SECRET");
  return id && secret;
}
