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
 * The backend route GET /meta/connect will:
 *   1. Build the Meta OAuth dialog URL
 *   2. Redirect the user to Meta for permission grant
 *
 * After the user grants access, Meta redirects to GET /meta/callback on the
 * backend, which exchanges the code for a token and redirects back to the
 * frontend with ?connected=1.
 */
export function connectMeta(): void {
  const backendUrl =
    env.apiBaseUrl ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "");

  const frontendUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  // Tell the backend where to redirect after a successful OAuth exchange.
  // This is encoded into the OAuth `state` parameter and validated server-side.
  const redirectTo = frontendUrl ? `${frontendUrl}/settings/meta` : undefined;

  const connectUrl = new URL(`${backendUrl}/meta/connect`);
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
