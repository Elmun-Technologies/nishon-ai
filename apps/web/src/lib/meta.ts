import { env } from "@/lib/env";

type MetaAdAccount = {
  id: string;
  name: string;
  account_status: number;
  currency: string | null;
};

export function connectMeta(): void {
  const frontendUrl =
    typeof window !== "undefined" ? window.location.origin : "https://nishon-ai-web.vercel.app";
  const redirectTo = `${frontendUrl}/settings/meta`;
  const authUrl = `${env.apiBaseUrl}/api/v1/auth/meta?redirectTo=${encodeURIComponent(redirectTo)}`;

  window.location.href = authUrl;
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
