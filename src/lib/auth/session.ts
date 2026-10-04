import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http";
import { ADMIN_SESSION_MAX_AGE_H, SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";
import { randomToken, sha256 } from "./crypto";

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await prisma.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export type CurrentSession = { user: User; createdAt: Date };

export const getSession = cache(async (): Promise<CurrentSession | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || session.user.blocked) return null;
  return { user: session.user, createdAt: session.createdAt };
});

export async function getCurrentUser() {
  return (await getSession())?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "برای ادامه وارد حساب کاربری شوید.", "unauthorized");
  return user;
}

export function isAdminSessionFresh(s: CurrentSession) {
  return Date.now() - s.createdAt.getTime() < ADMIN_SESSION_MAX_AGE_H * 3600_000;
}

export async function requireAdmin(): Promise<User> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "برای ادامه وارد حساب کاربری شوید.", "unauthorized");
  if (s.user.role !== "ADMIN") throw new HttpError(403, "دسترسی غیرمجاز.", "forbidden");
  if (!isAdminSessionFresh(s)) throw new HttpError(401, "نشست مدیر منقضی شده؛ دوباره وارد شوید.", "admin_reauth");
  return s.user;
}
