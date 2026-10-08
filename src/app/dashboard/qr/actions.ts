"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { sanitizeDesign } from "@/lib/qr-design";

/** Saves the studio design so print sheets, the dashboard and product pages use it. */
export async function saveQrDesignAction(input: unknown) {
  const { shop } = await requireSeller();
  const design = sanitizeDesign(input);
  await db.update(shops).set({ qrDesign: design, updatedAt: new Date() }).where(eq(shops.id, shop.id));
  return { ok: true as const };
}
