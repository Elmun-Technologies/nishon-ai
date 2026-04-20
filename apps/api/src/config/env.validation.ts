type EnvRecord = Record<string, string | undefined>;

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
] as const;

const WARN_ENV_VARS = [
  "FRONTEND_URL",
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CALLBACK_URL",
  "HEYGEN_API_KEY",
] as const;

export function validateEnv(config: EnvRecord): EnvRecord {
  const provider = (config["AI_PROVIDER"] || "openai").toLowerCase();
  const providerKey =
    provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";

  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = config[key];
    return !value || value.trim().length === 0;
  });
  const providerApiKey = config[providerKey];
  if (!providerApiKey || providerApiKey.trim().length === 0) {
    missing.push(providerKey as any);
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in Render environment settings before starting the API.",
    );
  }

  // Validate ENCRYPTION_KEY length — must be exactly 32 chars for AES-256
  const encryptionKey = config["ENCRYPTION_KEY"];
  if (encryptionKey && encryptionKey.trim().length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 ASCII characters. " +
        "Generate one with: openssl rand -hex 16",
    );
  }

  // Warn about recommended but not strictly required vars
  const warned = WARN_ENV_VARS.filter((key) => {
    const value = config[key];
    return !value || value.trim().length === 0;
  });

  if (warned.length > 0) {
    console.warn(
      `[AdSpectr] Missing recommended environment variables: ${warned.join(", ")}. ` +
        "Some features may not work correctly.",
    );
  }

  return config;
}
