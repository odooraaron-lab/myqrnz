"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/forms";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { parsePrice } from "@/lib/format";
import { normaliseNzAccount } from "@/lib/money";
import { requestPayout } from "@/lib/payouts";

export async function saveBankAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { shop } = await requireSeller();
  const name = String(form.get("accountName") ?? "").trim().slice(0, 80);
  const number = normaliseNzAccount(String(form.get("accountNumber") ?? ""));
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.accountName = "Enter the name on the bank account.";
  if (!number) errors.accountNumber = "Enter a full NZ bank account number, like 12-3456-0123456-00.";
  if (Object.keys(errors).length) return { errors, values: { accountName: name, accountNumber: String(form.get("accountNumber") ?? "") } };
  await db.update(shops).set({ payoutAccountName: name, payoutAccountNumber: number, updatedAt: new Date() }).where(eq(shops.id, shop.id));
  revalidatePath("/dashboard/balance");
  return { ok: true, message: "Bank account saved." };
}

export async function requestPayoutAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { shop } = await requireSeller();
  const amount = parsePrice(String(form.get("amount") ?? ""));
  if (!amount) return { errors: { amount: "Enter an amount, like 120 or 120.50." } };
  const result = await requestPayout(shop, amount);
  if ("error" in result) return { message: result.error };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `Payout #${result.number} requested. We'll email you when it's sent.` };
}
