import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { site } from "@/config/site";
import { db } from "@/db";
import { ledgerEntries, payouts, type LedgerType } from "@/db/schema";

/** Days a sale is held before it can be withdrawn (covers refunds and chargebacks). */
export const HOLD_DAYS = Math.max(0, Number(process.env.PAYOUT_HOLD_DAYS ?? 7));
/** Smallest payout a seller can request, in cents. */
export const MIN_PAYOUT_CENTS = Math.max(100, Math.round(Number(process.env.PAYOUT_MINIMUM ?? 20) * 100));

/** The platform's cut of a sale: a percentage plus an optional fixed amount. */
export function platformFee(totalCents: number) {
  const fee = Math.round((totalCents * site.platformFeePercent) / 100) + site.platformFeeFixedCents;
  return Math.max(0, Math.min(fee, totalCents));
}

export function releaseDate(from: Date) {
  return new Date(from.getTime() + HOLD_DAYS * 24 * 60 * 60 * 1000);
}

type Entry = {
  shopId: string;
  type: LedgerType;
  amountCents: number;
  description: string;
  ref: string;
  availableAt?: Date;
  orderId?: string | null;
  payoutId?: string | null;
};

/** Writes ledger entries. Each `ref` is recorded once, however many times this runs. */
export async function addEntries(entries: Entry[]) {
  if (!entries.length) return;
  await db
    .insert(ledgerEntries)
    .values(
      entries.map((e) => ({
        shopId: e.shopId,
        type: e.type,
        amountCents: e.amountCents,
        description: e.description,
        ref: e.ref,
        availableAt: e.availableAt ?? new Date(),
        orderId: e.orderId ?? null,
        payoutId: e.payoutId ?? null,
      })),
    )
    .onConflictDoNothing({ target: ledgerEntries.ref });
}

export type Balance = {
  /** Withdrawable now. Can be negative after a refund on already-released money. */
  availableCents: number;
  /** Still inside the hold period. */
  pendingCents: number;
  /** Next date held money becomes available. */
  nextReleaseAt: Date | null;
  lifetimeSalesCents: number;
  lifetimeFeesCents: number;
  paidOutCents: number;
  /** A payout request is waiting for the admin. */
  openPayoutCents: number;
};

export async function getBalance(shopId: string): Promise<Balance> {
  const [row] = await db
    .select({
      available: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.availableAt} <= now()), 0)`.mapWith(Number),
      pending: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.availableAt} > now()), 0)`.mapWith(Number),
      nextRelease: sql<string | null>`min(${ledgerEntries.availableAt}) filter (where ${ledgerEntries.availableAt} > now() and ${ledgerEntries.amountCents} > 0)`,
      sales: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.type} = 'sale'), 0)`.mapWith(Number),
      fees: sql<number>`coalesce(-sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.type} in ('fee', 'fee_refund')), 0)`.mapWith(Number),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.shopId, shopId));

  const [p] = await db
    .select({
      paid: sql<number>`coalesce(sum(${payouts.amountCents}) filter (where ${payouts.status} = 'paid'), 0)`.mapWith(Number),
      open: sql<number>`coalesce(sum(${payouts.amountCents}) filter (where ${payouts.status} in ('requested', 'processing')), 0)`.mapWith(Number),
    })
    .from(payouts)
    .where(eq(payouts.shopId, shopId));

  return {
    availableCents: row.available,
    pendingCents: row.pending,
    nextReleaseAt: row.nextRelease ? new Date(row.nextRelease) : null,
    lifetimeSalesCents: row.sales,
    lifetimeFeesCents: row.fees,
    paidOutCents: p.paid,
    openPayoutCents: p.open,
  };
}

/** Statement lines, newest first, each with the running balance after it. */
export async function getStatement(shopId: string, limit = 200) {
  const rows = await db
    .select({
      id: ledgerEntries.id,
      type: ledgerEntries.type,
      amountCents: ledgerEntries.amountCents,
      description: ledgerEntries.description,
      availableAt: ledgerEntries.availableAt,
      createdAt: ledgerEntries.createdAt,
      orderId: ledgerEntries.orderId,
      // Entries written together (a sale and its fee) list the credit first.
      running: sql<number>`sum(${ledgerEntries.amountCents}) over (order by ${ledgerEntries.createdAt}, ${ledgerEntries.amountCents} desc, ${ledgerEntries.id})`.mapWith(Number),
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.shopId, shopId))
    .orderBy(desc(ledgerEntries.createdAt), ledgerEntries.amountCents, desc(ledgerEntries.id))
    .limit(limit);
  return rows;
}

export async function getPayouts(shopId: string) {
  return db.select().from(payouts).where(eq(payouts.shopId, shopId)).orderBy(desc(payouts.requestedAt)).limit(50);
}

export async function openPayout(shopId: string) {
  const [row] = await db
    .select()
    .from(payouts)
    .where(and(eq(payouts.shopId, shopId), sql`${payouts.status} in ('requested', 'processing')`))
    .limit(1);
  return row ?? null;
}

/** NZ bank account: bank-branch-account-suffix (2-4-7-2/3 digits). Returns the tidy form, or null. */
export function normaliseNzAccount(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 15 || digits.length > 16) return null;
  const bank = digits.slice(0, 2);
  const branch = digits.slice(2, 6);
  const account = digits.slice(6, 13);
  const suffix = digits.slice(13);
  return `${bank}-${branch}-${account}-${suffix}`;
}

export function maskAccount(number: string | null | undefined) {
  if (!number) return "";
  return number.replace(/^(\d{2})-(\d{4})-(\d{3})\d{4}-(\d{2,3})$/, "$1-$2-$3••••-$4");
}
