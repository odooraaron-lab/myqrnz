import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { rootUrl, shopUrl } from "@/config/site";
import { db } from "@/db";
import { payouts, shops, users, type Payout, type Shop } from "@/db/schema";
import { payoutEmail, payoutRequestedAdminEmail, sendEmail } from "./email";
import { addEntries, MIN_PAYOUT_CENTS } from "./money";
import { adminRecipients } from "./orders";
import { connectEnabled, stripe, stripeErrorMessage } from "./stripe";

/** Whether the seller has somewhere for the money to go. */
export function payoutMethodReady(shop: Pick<Shop, "stripeAccountId" | "stripePayoutsReady" | "payoutAccountNumber">) {
  return connectEnabled() ? !!shop.stripeAccountId && shop.stripePayoutsReady : !!shop.payoutAccountNumber;
}

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/**
 * Creates a payout request and takes the amount out of the available balance
 * in one database statement, so double-clicks and parallel requests can't
 * withdraw the same money twice.
 */
export async function requestPayout(shop: Shop, amountCents: number): Promise<{ ok: true; number: number } | { error: string }> {
  if (!payoutMethodReady(shop)) return { error: "Set up where your payouts go first." };
  const amount = Math.round(amountCents);
  if (!Number.isFinite(amount) || amount < MIN_PAYOUT_CENTS) {
    return { error: `The smallest payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}.` };
  }

  let row: { id: string; number: number } | undefined;
  try {
    const result = await db.execute<{ id: string; number: number }>(sql`
      with bal as (
        select coalesce(sum(amount_cents) filter (where available_at <= now()), 0) as available
        from ledger_entries where shop_id = ${shop.id}
      ),
      p as (
        insert into payouts (shop_id, amount_cents, status, account_name, account_number)
        select ${shop.id}, ${amount}, 'requested', ${shop.payoutAccountName}, ${shop.payoutAccountNumber}
        from bal where bal.available >= ${amount}
        returning id, number, amount_cents
      ),
      l as (
        insert into ledger_entries (shop_id, payout_id, type, amount_cents, available_at, description, ref)
        select ${shop.id}, p.id, 'payout', -p.amount_cents, now(), 'Withdrawal #' || p.number, 'payout:' || p.id from p
        returning id
      )
      select p.id, p.number from p
    `);
    row = (result as unknown as { rows: { id: string; number: number }[] }).rows[0];
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "You already have a payout waiting. You can request another once it's sent." };
    throw err;
  }
  if (!row) return { error: "That's more than your available balance." };

  const admins = adminRecipients();
  if (admins.length) {
    const mail = payoutRequestedAdminEmail({ number: row.number, shopName: shop.name, amountCents: amount, adminUrl: rootUrl("/admin/payouts") });
    await Promise.all(admins.map((to) => sendEmail({ to, ...mail })));
  }
  return { ok: true, number: Number(row.number) };
}

async function notifySeller(payout: Payout, kind: "paid" | "rejected") {
  const [shop] = await db.select().from(shops).where(eq(shops.id, payout.shopId)).limit(1);
  if (!shop) return;
  let to = shop.contactEmail;
  if (!to) {
    const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, shop.ownerId)).limit(1);
    to = owner?.email ?? null;
  }
  if (!to) return;
  const mail = payoutEmail({
    kind,
    number: payout.number,
    amountCents: payout.amountCents,
    note: payout.note,
    balanceUrl: rootUrl("/dashboard/balance"),
    viaStripe: payout.method === "stripe",
  });
  await sendEmail({ to, ...mail });
}

// ── Admin actions ──────────────────────────────────────────────────────────

/** Moves the money to the seller's Stripe Connect account; Stripe pays it to their bank. */
export async function sendPayoutWithStripe(payoutId: string): Promise<{ ok: true } | { error: string }> {
  const [claimed] = await db
    .update(payouts)
    .set({ status: "processing", lastError: null })
    .where(and(eq(payouts.id, payoutId), eq(payouts.status, "requested")))
    .returning();
  if (!claimed) return { error: "This payout has already been handled." };

  const [shop] = await db.select().from(shops).where(eq(shops.id, claimed.shopId)).limit(1);
  const fail = async (message: string) => {
    await db.update(payouts).set({ status: "requested", lastError: message }).where(eq(payouts.id, payoutId));
    return { error: message };
  };
  if (!shop?.stripeAccountId || !shop.stripePayoutsReady) return fail("This seller hasn't finished verifying with Stripe yet.");

  try {
    const transfer = await stripe().transfers.create(
      {
        amount: claimed.amountCents,
        currency: "nzd",
        destination: shop.stripeAccountId,
        description: `myQR payout #${claimed.number} for ${shop.name}`,
        transfer_group: `payout_${claimed.number}`,
        metadata: { payoutId: claimed.id, shopId: shop.id },
      },
      { idempotencyKey: `payout_${claimed.id}` },
    );
    const [paid] = await db
      .update(payouts)
      .set({ status: "paid", method: "stripe", stripeTransferId: transfer.id, reference: transfer.id, processedAt: new Date(), lastError: null })
      .where(eq(payouts.id, payoutId))
      .returning();
    await notifySeller(paid, "paid");
    return { ok: true };
  } catch (err) {
    return fail(stripeErrorMessage(err));
  }
}

/** You paid the seller yourself (internet banking). Record the reference. */
export async function markPayoutPaid(payoutId: string, reference: string) {
  const [paid] = await db
    .update(payouts)
    .set({ status: "paid", method: "manual", reference: reference.slice(0, 120) || null, processedAt: new Date(), lastError: null })
    .where(and(eq(payouts.id, payoutId), inArray(payouts.status, ["requested", "processing"])))
    .returning();
  if (paid) await notifySeller(paid, "paid");
  return !!paid;
}

/** Declines the request and puts the money back in the seller's available balance. */
export async function rejectPayout(payoutId: string, reason: string) {
  const [rejected] = await db
    .update(payouts)
    .set({ status: "rejected", note: reason.slice(0, 300) || null, processedAt: new Date() })
    .where(and(eq(payouts.id, payoutId), eq(payouts.status, "requested")))
    .returning();
  if (!rejected) return false;
  await addEntries([
    {
      shopId: rejected.shopId,
      payoutId: rejected.id,
      type: "payout_reversal",
      amountCents: rejected.amountCents,
      description: `Withdrawal #${rejected.number} returned to balance`,
      ref: `payout_reversal:${rejected.id}`,
    },
  ]);
  await notifySeller(rejected, "rejected");
  return true;
}

// ── Stripe Connect onboarding ──────────────────────────────────────────────

/**
 * Seller payouts through Connect. The account has no Stripe dashboard and
 * Stripe's losses and fees sit with the platform, so the seller never signs up
 * for Stripe: they fill in one verification form (identity and bank account).
 */
export async function connectOnboardingUrl(shop: Shop, email: string) {
  let accountId = shop.stripeAccountId;
  if (!accountId) {
    const account = await stripe().accounts.create(
      {
        country: "NZ",
        email,
        controller: {
          fees: { payer: "application" },
          losses: { payments: "application" },
          requirement_collection: "stripe",
          stripe_dashboard: { type: "none" },
        },
        capabilities: { transfers: { requested: true } },
        business_profile: {
          name: shop.name,
          url: shopUrl(shop.subdomain),
          product_description: shop.tagline ?? `Goods sold through ${shop.name} on myQR`,
        },
        metadata: { shopId: shop.id },
      },
      { idempotencyKey: `connect_${shop.id}` },
    );
    accountId = account.id;
    await db.update(shops).set({ stripeAccountId: accountId }).where(eq(shops.id, shop.id));
  }
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: rootUrl("/dashboard/balance/connect"),
    return_url: rootUrl("/dashboard/balance?connected=1"),
    collection_options: { fields: "eventually_due" },
  });
  return link.url;
}

export async function refreshConnectStatus(shop: Shop) {
  if (!shop.stripeAccountId) return false;
  try {
    const account = await stripe().accounts.retrieve(shop.stripeAccountId);
    const ready = account.payouts_enabled === true && account.capabilities?.transfers === "active";
    if (ready !== shop.stripePayoutsReady) await db.update(shops).set({ stripePayoutsReady: ready }).where(eq(shops.id, shop.id));
    return ready;
  } catch (err) {
    console.warn("[connect] could not refresh", stripeErrorMessage(err));
    return shop.stripePayoutsReady;
  }
}
