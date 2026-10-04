import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE, REF_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF: state-changing API calls must come from our own origin.
  if (pathname.startsWith("/api/") && MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origin || !host || originHost(origin) !== host) {
      return NextResponse.json({ error: "درخواست نامعتبر (CSRF)." }, { status: 403 });
    }
  }

  // Optimistic auth redirect; real checks happen in pages/route handlers.
  if ((pathname.startsWith("/account") || pathname.startsWith("/admin")) && !req.cookies.has(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  const secure = req.nextUrl.protocol === "https:";
  if (!req.cookies.has(DEVICE_COOKIE)) {
    res.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[A-Za-z0-9]{4,12}$/.test(ref)) {
    res.cookies.set(REF_COOKIE, ref.toUpperCase(), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|landing/|gowns-media/|fonts/).*)"],
};
