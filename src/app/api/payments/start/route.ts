import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { handler, json, parseJson } from "@/lib/http";
import { startPayment } from "@/lib/payments";

const schema = z.object({ packageId: z.string().min(1) });

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const { packageId } = await parseJson(req, schema);
  return json(await startPayment(user, packageId));
});
