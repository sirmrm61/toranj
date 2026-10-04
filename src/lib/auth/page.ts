import { redirect } from "next/navigation";
import { getSession, isAdminSessionFresh } from "./session";

/** For server components: redirect to /login when not signed in. */
export async function requirePageUser(next: string) {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (s.user.blocked) redirect("/login?blocked=1");
  return s.user;
}

export async function requirePageAdmin(next = "/admin") {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (s.user.role !== "ADMIN") redirect("/");
  if (!isAdminSessionFresh(s)) redirect(`/login?next=${encodeURIComponent(next)}&reauth=1`);
  return s.user;
}
