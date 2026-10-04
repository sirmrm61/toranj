import type { User } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { getBalances, getFreeGranted } from "@/lib/credits/ledger";

export async function getAccountSummary(user: User) {
  const [balances, freeGranted] = await Promise.all([getBalances(user.id), getFreeGranted(user.id)]);
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    balances,
    freeGranted,
    referralCode: user.referralCode,
    referralLink: `${env.appUrl}/invite/${user.referralCode}`,
  };
}
