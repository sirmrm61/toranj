import { prisma } from "./db";
import { env } from "./env";

export const DEFAULT_TRYON_PROMPT =
  "تصویر اول عکس شخص است. تصویر دوم لباس عروس مشخص است. همان شخص را با همان چهره، فرم بدن، حالت و پس‌زمینه نشان بده، در حالی که لباس عروس تصویر دوم را پوشیده است. جزئیات پارچه، یقه و دنباله لباس را حفظ کن. چهره و رنگ پوست را تغییر نده.";

export type AppSettings = {
  freeQuota: number;
  referralReward: number;
  referralCap: number;
  /** Minimum amount (IRR) of the invitee's first payment that activates the referral reward. */
  referralMinPaymentIrr: number;
  /** Max accounts per IP per 24h that receive the free signup quota. */
  freeSignupsPerIpPerDay: number;
  tryonPrompt: string;
  /** Estimated processing cost of one generation in IRR, for the admin usage report. */
  costPerTryonIrr: number;
};

export const SETTING_KEYS: (keyof AppSettings)[] = [
  "freeQuota",
  "referralReward",
  "referralCap",
  "referralMinPaymentIrr",
  "freeSignupsPerIpPerDay",
  "tryonPrompt",
  "costPerTryonIrr",
];

export function defaultSettings(): AppSettings {
  return {
    freeQuota: env.defaults.freeQuota,
    referralReward: env.defaults.referralReward,
    referralCap: env.defaults.referralCap,
    referralMinPaymentIrr: 0,
    freeSignupsPerIpPerDay: 3,
    tryonPrompt: DEFAULT_TRYON_PROMPT,
    costPerTryonIrr: 0,
  };
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } });
  const s = defaultSettings() as Record<string, unknown>;
  for (const r of rows) s[r.key] = r.value;
  return s as AppSettings;
}

export async function updateSettings(patch: Partial<AppSettings>) {
  await prisma.$transaction(
    Object.entries(patch)
      .filter(([k, v]) => SETTING_KEYS.includes(k as keyof AppSettings) && v !== undefined)
      .map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } }),
      ),
  );
}
