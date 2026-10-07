"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminEmails, rootUrl, shopUrl } from "@/config/site";
import { db } from "@/db";
import { passwordResets, shops, users } from "@/db/schema";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  getCurrentUser,
  getUserShop,
  hashPassword,
  randomToken,
  sha256,
  verifyPassword,
} from "@/lib/auth";
import { passwordResetEmail, sendEmail, welcomeEmail } from "@/lib/email";
import { isSubdomainTaken } from "@/lib/shops";
import { subdomainProblem, suggestSubdomain } from "@/lib/subdomain";
import type { FormState } from "@/components/forms";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .email("Check your email address — it doesn't look complete.");

const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(200, "That password is too long.");

const shopName = z.string().trim().min(2, "Enter your shop name.").max(60, "Keep your shop name under 60 characters.");

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0]);
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

async function createShopFor(userId: string, name: string, subdomain: string, contactEmail: string) {
  await db.insert(shops).values({ ownerId: userId, name, subdomain, contactEmail });
  const mail = welcomeEmail({ shopName: name, shopUrl: shopUrl(subdomain), dashboardUrl: rootUrl("/dashboard") });
  sendEmail({ to: contactEmail, ...mail }).catch(() => {});
}

// ── Register ────────────────────────────────────────────────────────────────

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = {
    shopName: String(form.get("shopName") ?? ""),
    subdomain: suggestSubdomain(String(form.get("subdomain") ?? "")),
    email: String(form.get("email") ?? ""),
  };

  const parsed = z
    .object({
      shopName,
      email,
      password: newPassword,
      terms: z.literal("on", { message: "Tick the box to agree to the terms." }),
    })
    .safeParse({
      shopName: values.shopName,
      email: values.email,
      password: String(form.get("password") ?? ""),
      terms: form.get("terms") ?? undefined,
    });

  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);
  const problem = subdomainProblem(values.subdomain);
  if (problem) errors.subdomain = problem;
  if (Object.keys(errors).length || !parsed.success) return { errors, values };

  const data = parsed.data;

  if (await isSubdomainTaken(values.subdomain)) {
    return { errors: { subdomain: "Someone already has that address. Try adding your town or a word like shop." }, values };
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length) {
    return { errors: { email: "There's already an account with this email. Log in instead." }, values };
  }

  let userId: string;
  try {
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: adminEmails().includes(data.email) ? "admin" : "seller",
      })
      .returning({ id: users.id });
    userId = user.id;
  } catch (err) {
    if (isUniqueViolation(err)) return { errors: { email: "There's already an account with this email. Log in instead." }, values };
    throw err;
  }

  try {
    await createShopFor(userId, data.shopName, values.subdomain, data.email);
  } catch (err) {
    await db.delete(users).where(eq(users.id, userId));
    if (isUniqueViolation(err)) {
      return { errors: { subdomain: "Someone just claimed that address. Try another." }, values };
    }
    throw err;
  }

  await createSession(userId);
  redirect("/dashboard?welcome=1");
}

/** For a signed-in account that has no shop yet. */
export async function createShopAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (await getUserShop(user.id)) redirect("/dashboard");

  const values = {
    shopName: String(form.get("shopName") ?? ""),
    subdomain: suggestSubdomain(String(form.get("subdomain") ?? "")),
  };
  const parsed = shopName.safeParse(values.shopName);
  const errors: Record<string, string> = {};
  if (!parsed.success) errors.shopName = parsed.error.issues[0].message;
  const problem = subdomainProblem(values.subdomain);
  if (problem) errors.subdomain = problem;
  else if (await isSubdomainTaken(values.subdomain)) errors.subdomain = "Someone already has that address. Try another.";
  if (Object.keys(errors).length) return { errors, values };

  try {
    await createShopFor(user.id, values.shopName.trim(), values.subdomain, user.email);
  } catch (err) {
    if (isUniqueViolation(err)) return { errors: { subdomain: "Someone just claimed that address. Try another." }, values };
    throw err;
  }
  redirect("/dashboard?welcome=1");
}

// ── Log in / out ────────────────────────────────────────────────────────────

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { email: String(form.get("email") ?? "").trim().toLowerCase() };
  const password = String(form.get("password") ?? "");
  if (!values.email || !password) {
    return { message: "Enter your email and password.", values };
  }
  const [user] = await db.select().from(users).where(eq(users.email, values.email)).limit(1);
  // Same message for unknown email and wrong password, so accounts can't be discovered.
  // Hashing for unknown emails keeps response times similar either way.
  const ok = user ? await verifyPassword(password, user.passwordHash) : (await hashPassword(password), false);
  if (!user || !ok) {
    return { message: "That email and password don't match. Check them, or reset your password.", values };
  }
  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// ── Password reset ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { errors: { email: parsed.error.issues[0].message }, values: { email: String(form.get("email") ?? "") } };

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data)).limit(1);
  if (user) {
    const token = randomToken();
    await db.insert(passwordResets).values({
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const mail = passwordResetEmail({ resetUrl: rootUrl(`/reset-password?token=${token}`) });
    await sendEmail({ to: parsed.data, ...mail });
  }
  return {
    ok: true,
    message: "If there's an account for that email, we've sent a link to reset your password. Check your inbox (and spam folder).",
  };
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const parsed = newPassword.safeParse(form.get("password"));
  if (!parsed.success) return { errors: { password: parsed.error.issues[0].message } };

  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, sha256(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  if (!reset) {
    return { message: "This reset link has expired or was already used. Ask for a new one." };
  }

  await db.update(users).set({ passwordHash: await hashPassword(parsed.data) }).where(eq(users.id, reset.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.tokenHash, reset.tokenHash));
  await destroyAllSessions(reset.userId);
  await createSession(reset.userId);
  redirect("/dashboard");
}
