import { NextResponse } from "next/server";
import { REF_COOKIE } from "@/lib/auth/constants";
import { env } from "@/lib/env";

/** Referral link: /invite/ABC123 → remembers the code and sends the visitor to sign up. */
export async function GET(_req: Request, ctx: RouteContext<"/invite/[code]">) {
  const { code } = await ctx.params;
  const res = NextResponse.redirect(new URL("/login?next=/account/tryon", env.appUrl));
  if (/^[A-Za-z0-9]{4,12}$/.test(code)) {
    res.cookies.set(REF_COOKIE, code.toUpperCase(), {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
