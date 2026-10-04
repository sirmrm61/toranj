import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { confirmPayment } from "@/lib/payments";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authority = url.searchParams.get("Authority") ?? url.searchParams.get("authority");
  const status = url.searchParams.get("Status") ?? url.searchParams.get("status");
  const target = new URL("/account/wallet", env.appUrl);
  if (!authority) {
    target.searchParams.set("payment", "failed");
    return NextResponse.redirect(target);
  }
  try {
    const r = await confirmPayment(authority, status);
    target.searchParams.set("payment", r.ok ? "success" : "failed");
    if (r.payment) target.searchParams.set("id", r.payment.id);
  } catch (e) {
    console.error("[payment] callback error", e);
    target.searchParams.set("payment", "error");
  }
  return NextResponse.redirect(target);
}
