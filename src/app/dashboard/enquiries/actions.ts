"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { requireSeller } from "@/lib/auth";

export async function markEnquiryAction(form: FormData) {
  const { shop } = await requireSeller();
  const id = String(form.get("id") ?? "");
  const read = form.get("read") === "1";
  await db
    .update(enquiries)
    .set({ readAt: read ? new Date() : null })
    .where(and(eq(enquiries.id, id), eq(enquiries.shopId, shop.id)));
  revalidatePath("/dashboard", "layout");
}

export async function markAllReadAction() {
  const { shop } = await requireSeller();
  await db
    .update(enquiries)
    .set({ readAt: new Date() })
    .where(and(eq(enquiries.shopId, shop.id), isNull(enquiries.readAt)));
  revalidatePath("/dashboard", "layout");
}

export async function deleteEnquiryAction(form: FormData) {
  const { shop } = await requireSeller();
  const id = String(form.get("id") ?? "");
  await db.delete(enquiries).where(and(eq(enquiries.id, id), eq(enquiries.shopId, shop.id)));
  revalidatePath("/dashboard", "layout");
}
