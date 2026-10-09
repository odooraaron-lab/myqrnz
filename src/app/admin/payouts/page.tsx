import type { Metadata } from "next";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { site } from "@/config/site";
import { db } from "@/db";
import { ledgerEntries, orders, payouts, shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { maskAccount } from "@/lib/money";
import { connectEnabled, paymentsLive } from "@/lib/stripe";
import { markPaidAction, rejectAction, sendWithStripeAction } from "./actions";

export const metadata: Metadata = { title: "Money and payouts", robots: { index: false } };

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; paid?: string; rejected?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const [[sales], [ledger], [paidOut], [setup], queue, history, balances] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
        gross: sql<number>`coalesce(sum(${orders.totalCents}), 0)`.mapWith(Number),
        refunded: sql<number>`coalesce(sum(${orders.refundedCents}), 0)`.mapWith(Number),
        stripeFees: sql<number>`coalesce(sum(${orders.stripeFeeCents}), 0)`.mapWith(Number),
        unknownFees: sql<number>`count(*) filter (where ${orders.stripeFeeCents} is null)`.mapWith(Number),
      })
      .from(orders)
      .where(sql`${orders.paidAt} is not null`),
    db
      .select({
        fees: sql<number>`coalesce(-sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.type} in ('fee', 'fee_refund')), 0)`.mapWith(Number),
        owedAvailable: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.availableAt} <= now()), 0)`.mapWith(Number),
        owedHeld: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.availableAt} > now()), 0)`.mapWith(Number),
      })
      .from(ledgerEntries),
    db
      .select({ total: sql<number>`coalesce(sum(${payouts.amountCents}), 0)`.mapWith(Number) })
      .from(payouts)
      .where(eq(payouts.status, "paid")),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(shops).where(sql`${shops.setupPaidAt} is not null`),
    db
      .select({ payout: payouts, shop: shops })
      .from(payouts)
      .innerJoin(shops, eq(shops.id, payouts.shopId))
      .where(inArray(payouts.status, ["requested", "processing"]))
      .orderBy(payouts.requestedAt),
    db
      .select({ payout: payouts, shopName: shops.name })
      .from(payouts)
      .innerJoin(shops, eq(shops.id, payouts.shopId))
      .where(inArray(payouts.status, ["paid", "rejected"]))
      .orderBy(desc(payouts.processedAt))
      .limit(50),
    db
      .select({
        shopId: ledgerEntries.shopId,
        name: shops.name,
        subdomain: shops.subdomain,
        available: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.availableAt} <= now()), 0)`.mapWith(Number),
        held: sql<number>`coalesce(sum(${ledgerEntries.amountCents}) filter (where ${ledgerEntries.availableAt} > now()), 0)`.mapWith(Number),
      })
      .from(ledgerEntries)
      .innerJoin(shops, eq(shops.id, ledgerEntries.shopId))
      .groupBy(ledgerEntries.shopId, shops.name, shops.subdomain)
      .having(sql`sum(${ledgerEntries.amountCents}) <> 0`)
      .orderBy(desc(sql`sum(${ledgerEntries.amountCents})`))
      .limit(50),
  ]);

  const setupFees = setup.n * site.setupFee * 100;
  const margin = ledger.fees - sales.stripeFees;
  const stats: [string, string, string?][] = [
    ["Customer payments", formatPrice(sales.gross), `${sales.count} orders${sales.refunded ? `, ${formatPrice(sales.refunded)} refunded` : ""}`],
    ["myQR fees earned", formatPrice(ledger.fees), `${site.platformFeePercent}%${site.platformFeeFixedCents ? ` + ${formatPrice(site.platformFeeFixedCents)}` : ""} per sale`],
    ["Stripe processing fees", formatPrice(sales.stripeFees), sales.unknownFees ? `${sales.unknownFees} orders not yet known` : "Paid from your fees"],
    ["Margin on sales", formatPrice(margin), "Fees earned minus Stripe fees"],
    ["Setup fees", formatPrice(setupFees), `${setup.n} shops`],
    ["Owed to sellers", formatPrice(ledger.owedAvailable + ledger.owedHeld), `${formatPrice(ledger.owedAvailable)} withdrawable, ${formatPrice(ledger.owedHeld)} on hold`],
    ["Paid out to sellers", formatPrice(paidOut.total)],
    ["Waiting for you", formatPrice(queue.reduce((a, q) => a + q.payout.amountCents, 0)), `${queue.length} request${queue.length === 1 ? "" : "s"}`],
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-semiwide text-3xl">Money and payouts</h1>
      {!paymentsLive() && (
        <p className="mt-4 border border-line bg-card px-5 py-4 text-ink-soft">
          Card checkout is off. Set PAYMENTS_ENABLED=true and STRIPE_SECRET_KEY to start taking payments.
        </p>
      )}

      {sp.error && (
        <p role="alert" className="mt-6 border border-stop/30 bg-stop-wash px-4 py-3 text-stop">
          {sp.error}
        </p>
      )}
      {(sp.sent || sp.paid || sp.rejected) && (
        <p role="status" className="mt-6 border border-go/30 bg-go-wash px-4 py-3 text-go">
          {sp.sent ? "Sent through Stripe. The seller has been emailed." : sp.paid ? "Marked as paid. The seller has been emailed." : "Returned to the seller's balance."}
        </p>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {stats.map(([label, value, sub]) => (
          <div key={label} className="bg-card p-4">
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="font-wide mt-1 text-2xl">{value}</dd>
            {sub && <dd className="mt-1 text-xs text-ink-soft">{sub}</dd>}
          </div>
        ))}
      </dl>

      <section className="mt-12" aria-labelledby="queue">
        <h2 id="queue" className="font-semiwide text-2xl">
          Payout requests
        </h2>
        <p className="mt-1 text-ink-soft">
          {connectEnabled()
            ? "Send with Stripe moves the money to the seller's verified account; Stripe pays their bank, usually within 2 business days."
            : "Pay each seller by bank transfer, then mark it paid with your bank reference. Turn on STRIPE_CONNECT_ENABLED to send through Stripe instead."}
        </p>
        {queue.length === 0 ? (
          <p className="panel mt-4 px-5 py-8 text-center text-ink-soft">Nothing waiting.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {queue.map(({ payout: p, shop }) => (
              <li key={p.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold">
                      #{p.number} · {formatPrice(p.amountCents)}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {shop.name} ({shop.subdomain}) · requested {formatDateTime(p.requestedAt)}
                      {p.status === "processing" && " · sending"}
                    </p>
                    <p className="mt-2 text-sm">
                      {connectEnabled() ? (
                        shop.stripePayoutsReady ? (
                          <span className="font-semibold text-go">Stripe account verified</span>
                        ) : (
                          <span className="font-semibold text-stop">Seller hasn&apos;t finished Stripe verification</span>
                        )
                      ) : p.accountNumber ? (
                        <>
                          Pay to <strong>{p.accountName}</strong>, <span className="font-mono">{p.accountNumber}</span>
                        </>
                      ) : (
                        <span className="text-stop">No bank account on file</span>
                      )}
                    </p>
                    {p.lastError && <p className="mt-2 text-sm text-stop">Last attempt failed: {p.lastError}</p>}
                  </div>
                  {connectEnabled() && p.status === "requested" && (
                    <form action={sendWithStripeAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-primary btn-sm" disabled={!shop.stripePayoutsReady}>
                        Send {formatPrice(p.amountCents)} with Stripe
                      </button>
                    </form>
                  )}
                </div>
                <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-2">
                  <form action={markPaidAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label className="min-w-0 flex-1">
                      <span className="text-sm font-semibold">Paid by bank transfer? Reference</span>
                      <input name="reference" className="input mt-1" placeholder={`myQR payout ${p.number}`} />
                    </label>
                    <button className="btn btn-outline btn-sm">Mark paid</button>
                  </form>
                  {p.status === "requested" && (
                    <form action={rejectAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <label className="min-w-0 flex-1">
                        <span className="text-sm font-semibold">Return to balance, reason</span>
                        <input name="reason" className="input mt-1" placeholder="e.g. bank account details don't match" />
                      </label>
                      <button className="btn btn-danger btn-sm">Return</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="balances">
        <h2 id="balances" className="font-semiwide text-2xl">
          Seller balances
        </h2>
        {balances.length === 0 ? (
          <p className="mt-3 text-ink-soft">No balances yet.</p>
        ) : (
          <div className="panel mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-line bg-paper">
                <tr>
                  <th className="px-4 py-3 font-semibold">Shop</th>
                  <th className="px-4 py-3 text-right font-semibold">Withdrawable</th>
                  <th className="px-4 py-3 text-right font-semibold">On hold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {balances.map((b) => (
                  <tr key={b.shopId}>
                    <td className="px-4 py-3">
                      {b.name} <span className="text-ink-soft">({b.subdomain})</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${b.available < 0 ? "text-stop" : ""}`}>{formatPrice(b.available)}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(b.held)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="mt-12" aria-labelledby="history">
          <h2 id="history" className="font-semiwide text-2xl">
            Recent payouts
          </h2>
          <ul className="panel mt-4 divide-y divide-line text-sm">
            {history.map(({ payout: p, shopName }) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span>
                  <strong>#{p.number}</strong> · {shopName} · {formatPrice(p.amountCents)}
                </span>
                <span className="text-ink-soft">
                  {p.status === "paid"
                    ? `${p.method === "stripe" ? "Stripe" : "Bank transfer"}${p.reference ? ` (${p.method === "manual" ? p.reference : p.reference.slice(0, 18)})` : ""}${p.accountNumber && p.method === "manual" ? ` to ${maskAccount(p.accountNumber)}` : ""} · ${p.processedAt ? formatDate(p.processedAt) : ""}`
                    : `Returned${p.note ? `: ${p.note}` : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
