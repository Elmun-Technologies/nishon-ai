type EnvRecord = Record<string, string | undefined>;

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CALLBACK_URL",
  "FRONTEND_URL",
] as const;

export function validateEnv(config: EnvRecord): EnvRecord {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = config[key];
    return !value || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in Render environment settings before starting the API.",
    );
  }

  return config;
}
