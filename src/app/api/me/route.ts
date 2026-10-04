import { getAccountSummary } from "@/lib/account";
import { requireUser } from "@/lib/auth/session";
import { handler, json } from "@/lib/http";

export const GET = handler(async () => {
  const user = await requireUser();
  return json(await getAccountSummary(user));
});
