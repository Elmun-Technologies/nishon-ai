const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

if (!apiBaseUrl && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Nishon AI] Missing NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL). Falling back to relative API paths.",
  );
}

export const env = {
  apiBaseUrl,
} as const;
