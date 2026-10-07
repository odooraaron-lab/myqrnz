import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminEmails, site } from "@/config/site";
import { db } from "@/db";
import { sessions, shops, users, type Shop, type User } from "@/db/schema";

const COOKIE = "myqr_session";
const SESSION_DAYS = 30;

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 11);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function isAdmin(user: Pick<User, "role" | "email"> | null | undefined) {
  if (!user) return false;
  return user.role === "admin" || adminEmails().includes(user.email.toLowerCase());
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt, userAgent });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: site.protocol === "https",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  jar.delete(COOKIE);
}

/** Signs the user out everywhere (used after a password change). */
export async function destroyAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const getUserShop = cache(async (userId: string): Promise<Shop | null> => {
  const rows = await db.select().from(shops).where(eq(shops.ownerId, userId)).limit(1);
  return rows[0] ?? null;
});

/** For dashboard pages: the signed-in seller and their shop. */
export async function requireSeller(): Promise<{ user: User; shop: Shop }> {
  const user = await requireUser();
  const shop = await getUserShop(user.id);
  if (!shop) redirect("/register/shop");
  return { user, shop };
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}
