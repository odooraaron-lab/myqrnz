"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function setShopStatusAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!["draft", "live", "suspended"].includes(status)) return;
  await db
    .update(shops)
    .set({ status: status as "draft" | "live" | "suspended", updatedAt: new Date() })
    .where(eq(shops.id, id));
  revalidatePath("/admin");
}
