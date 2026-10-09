"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { markPayoutPaid, rejectPayout, sendPayoutWithStripe } from "@/lib/payouts";

export async function sendWithStripeAction(form: FormData) {
  await requireAdmin();
  const result = await sendPayoutWithStripe(String(form.get("id") ?? ""));
  revalidatePath("/admin/payouts");
  if ("error" in result) redirect(`/admin/payouts?error=${encodeURIComponent(result.error)}`);
  redirect("/admin/payouts?sent=1");
}

export async function markPaidAction(form: FormData) {
  await requireAdmin();
  const ok = await markPayoutPaid(String(form.get("id") ?? ""), String(form.get("reference") ?? "").trim());
  revalidatePath("/admin/payouts");
  redirect(ok ? "/admin/payouts?paid=1" : "/admin/payouts?error=This%20payout%20has%20already%20been%20handled.");
}

export async function rejectAction(form: FormData) {
  await requireAdmin();
  const ok = await rejectPayout(String(form.get("id") ?? ""), String(form.get("reason") ?? "").trim());
  revalidatePath("/admin/payouts");
  redirect(ok ? "/admin/payouts?rejected=1" : "/admin/payouts?error=This%20payout%20can%27t%20be%20returned%20now.");
}
