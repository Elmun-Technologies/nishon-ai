import { ConfigService } from "@nestjs/config";

const OAUTH_CALLBACK_PATHS = {
  meta: "/platforms/meta/callback",
  google: "/platforms/google/callback",
  tiktok: "/platforms/tiktok/callback",
} as const;

type OAuthProvider = keyof typeof OAUTH_CALLBACK_PATHS;

export function getOAuthCallbackUrl(
  config: ConfigService,
  provider: OAuthProvider,
): string {
  const apiBaseUrl = config.get<string>("API_BASE_URL", "").trim();
  if (!apiBaseUrl) {
    return "";
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}${OAUTH_CALLBACK_PATHS[provider]}`;
}
