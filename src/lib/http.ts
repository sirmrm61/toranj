import { NextResponse } from "next/server";
import type { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status);
  console.error(err);
  return json({ error: "خطای داخلی سرور؛ لطفاً دوباره تلاش کنید." }, 500);
}

export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "بدنه درخواست نامعتبر است.");
  }
  const r = schema.safeParse(body);
  if (!r.success) throw new HttpError(422, r.error.issues[0]?.message ?? "ورودی نامعتبر است.", "validation");
  return r.data;
}

/** Wraps a route handler so thrown HttpErrors become JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
