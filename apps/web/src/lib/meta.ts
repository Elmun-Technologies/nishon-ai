import { env } from "@/lib/env";

type MetaAdAccount = {
  id: string;
  name: string;
  account_status: number;
  currency: string | null;
};

/**
 * Redirects the browser to the backend OAuth connect route.
 *
 * IMPORTANT: this must be a full browser redirect (window.location.href), NOT a
 * fetch() call. Meta's OAuth dialog requires a real page navigation.
 *
 * workspaceId MUST be provided — the backend encodes it in the OAuth `state` so
 * the callback knows which tenant to associate the token with.
 *
 * Flow:
 *   1. Browser → GET /meta/connect?workspaceId=<id>&redirectTo=<url>
 *   2. Backend → redirects to Meta OAuth dialog
 *   3. Meta → user grants access → GET /meta/callback?code=...&state=...
 *   4. Backend → saves token to connected_accounts for this workspace
 *   5. Backend → redirects to frontend /settings/meta?connected=1&workspaceId=<id>
 */
export function connectMeta(workspaceId: string): void {
  if (!workspaceId) {
    console.error("[Nishon AI] connectMeta: workspaceId is required");
    return;
  }

  const backendUrl =
    env.apiBaseUrl ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "");

  const frontendUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const redirectTo = frontendUrl ? `${frontendUrl}/settings/meta` : undefined;

  const connectUrl = new URL(`${backendUrl}/meta/connect`);
  connectUrl.searchParams.set("workspaceId", workspaceId);
  if (redirectTo) {
    connectUrl.searchParams.set("redirectTo", redirectTo);
  }

  window.location.href = connectUrl.toString();
}

export async function fetchMetaAdAccounts(): Promise<MetaAdAccount[]> {
  const response = await fetch(`${env.apiBaseUrl}/api/v1/meta/ad-accounts`, {
    method: "GET",
    credentials: "include",
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to fetch Meta ad accounts");
  }

  return payload.accounts || [];
}
