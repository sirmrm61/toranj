function str(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing environment variable ${name}`);
  }
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get appUrl() {
    return str("APP_URL", "http://localhost:3000").replace(/\/$/, "");
  },
  get sessionSecret() {
    const s = str("SESSION_SECRET", process.env.NODE_ENV === "production" ? undefined : "dev-insecure-secret");
    if (process.env.NODE_ENV === "production" && s.length < 32) throw new Error("SESSION_SECRET must be at least 32 chars");
    return s;
  },
  get databaseUrl() {
    return str("DATABASE_URL");
  },
  get redisUrl() {
    return str("REDIS_URL", "redis://localhost:6379");
  },
  storage: {
    get endpoint() {
      return process.env.STORAGE_ENDPOINT || undefined;
    },
    get region() {
      return str("STORAGE_REGION", "us-east-1");
    },
    get bucket() {
      return str("STORAGE_BUCKET", "toranj-private");
    },
    get accessKey() {
      return str("STORAGE_ACCESS_KEY", "");
    },
    get secretKey() {
      return str("STORAGE_SECRET_KEY", "");
    },
    get forcePathStyle() {
      return str("STORAGE_FORCE_PATH_STYLE", "true") === "true";
    },
    get signedUrlTtl() {
      return int("STORAGE_SIGNED_URL_TTL", 300);
    },
  },
  ai: {
    get provider() {
      return str("AI_PROVIDER", "mock") as "gemini" | "mock";
    },
    get apiKey() {
      return str("GEMINI_API_KEY", "");
    },
    get tryonModel() {
      return str("GEMINI_TRYON_MODEL", "gemini-3.1-flash-image");
    },
    get assetModel() {
      return str("GEMINI_ASSET_MODEL", "gemini-3-pro-image");
    },
    get timeoutMs() {
      return int("GEMINI_TIMEOUT_MS", 90_000);
    },
  },
  sms: {
    get provider() {
      return str("SMS_PROVIDER", "mock") as "kavenegar" | "mock";
    },
    get apiKey() {
      return str("SMS_API_KEY", "");
    },
    get sender() {
      return str("SMS_SENDER", "");
    },
    get otpTemplate() {
      return str("SMS_OTP_TEMPLATE", "");
    },
    get shopPhones() {
      return str("SHOP_NOTIFY_PHONES", "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    },
  },
  payment: {
    get provider() {
      return str("PAYMENT_PROVIDER", "mock") as "zarinpal" | "mock";
    },
    get merchantId() {
      return str("PAYMENT_MERCHANT_ID", "");
    },
    get sandbox() {
      return str("PAYMENT_SANDBOX", "true") === "true";
    },
  },
  defaults: {
    get freeQuota() {
      return int("FREE_QUOTA", 3);
    },
    get referralReward() {
      return int("REFERRAL_REWARD", 3);
    },
    get referralCap() {
      return int("REFERRAL_CAP", 10);
    },
  },
  get adminPhones() {
    return str("ADMIN_PHONES", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  },
};
