import Link from "next/link";
import { PageHead } from "@/components/dashboard/PageHead";
import type { LedgerType, PayoutStatus } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { getBalance, getPayouts, getStatement, HOLD_DAYS, maskAccount, MIN_PAYOUT_CENTS, openPayout } from "@/lib/money";
import { payoutMethodReady, refreshConnectStatus } from "@/lib/payouts";
import { site } from "@/config/site";
import { connectEnabled, paymentsLive } from "@/lib/stripe";
import { BankForm, PayoutForm } from "./BalanceForms";

export const metadata = { title: "Balance" };

const TYPE_LABEL: Record<LedgerType, string> = {
  sale: "Sale",
  fee: "Fee",
  refund: "Refund",
  fee_refund: "Fee returned",
  dispute: "Dispute",
  dispute_won: "Dispute won",
  payout: "Withdrawal",
  payout_reversal: "Returned",
  adjustment: "Adjustment",
};

const PAYOUT_LABEL: Record<PayoutStatus, string> = {
  requested: "Waiting for approval",
  processing: "Sending",
  paid: "Sent",
  rejected: "Returned to balance",
};

function signed(cents: number) {
  return `${cents < 0 ? "−" : "+"}${formatPrice(Math.abs(cents))}`;
}

export default async function BalancePage({ searchParams }: { searchParams: Promise<{ connected?: string; connect_error?: string }> }) {
  const { shop } = await requireSeller();
  const sp = await searchParams;
  if (sp.connected && connectEnabled()) shop.stripePayoutsReady = await refreshConnectStatus(shop);

  const [balance, statement, history, open] = await Promise.all([
    getBalance(shop.id),
    getStatement(shop.id),
    getPayouts(shop.id),
    openPayout(shop.id),
  ]);
  const ready = payoutMethodReady(shop);
  const now = new Date();
  const canWithdraw = ready && !open && balance.availableCents >= MIN_PAYOUT_CENTS;

  return (
    <>
      <PageHead
        title="Balance"
        intro={`Money from your sales, after the myQR fee. Each sale is held for ${HOLD_DAYS} days in case of refunds, then you can withdraw it to your bank.`}
        actions={
          <Link href="/dashboard/orders" className="btn btn-outline btn-sm">
            Orders
          </Link>
        }
      />

      {!paymentsLive() && (
        <p className="mb-6 border border-line bg-card px-5 py-4 text-ink-soft">
          Card checkout isn&apos;t switched on yet, so there are no sales here. Your balance fills up as customers pay through your shop.
        </p>
      )}

      <section aria-label="Your balance" className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-card p-6">
          <p className="text-sm text-ink-soft">Available to withdraw</p>
          <p className={`font-wide mt-2 text-4xl ${balance.availableCents < 0 ? "text-stop" : ""}`}>{formatPrice(balance.availableCents)}</p>
        </div>
        <div className="bg-card p-6">
          <p className="text-sm text-ink-soft">On hold</p>
          <p className="font-wide mt-2 text-4xl">{formatPrice(balance.pendingCents)}</p>
          {balance.nextReleaseAt && <p className="mt-2 text-sm text-ink-soft">Next release {formatDate(balance.nextReleaseAt)}</p>}
        </div>
        <div className="bg-card p-6">
          <p className="text-sm text-ink-soft">Paid to your bank</p>
          <p className="font-wide mt-2 text-4xl">{formatPrice(balance.paidOutCents)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            Sales {formatPrice(balance.lifetimeSalesCents)} · Fees {formatPrice(balance.lifetimeFeesCents)}
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6" aria-labelledby="withdraw">
          <h2 id="withdraw" className="text-lg font-bold">
            Withdraw
          </h2>
          {open ? (
            <div className="mt-4 border-[1.5px] border-ink bg-sticker/40 p-4">
              <p className="font-semibold">
                Payout #{open.number} for {formatPrice(open.amountCents)}: {PAYOUT_LABEL[open.status].toLowerCase()}
              </p>
              <p className="mt-1 text-sm">Requested {formatDate(open.requestedAt)}. We&apos;ll email you when it&apos;s sent, usually within 2 business days.</p>
              {open.lastError && <p className="mt-2 text-sm text-stop">Delayed: we&apos;re sorting out a problem sending it.</p>}
            </div>
          ) : !ready ? (
            <p className="mt-3 text-ink-soft">Add where your money should go (below), then you can request payouts here.</p>
          ) : canWithdraw ? (
            <div className="mt-4">
              <PayoutForm availableCents={balance.availableCents} minCents={MIN_PAYOUT_CENTS} />
            </div>
          ) : (
            <p className="mt-3 text-ink-soft">
              You can withdraw once you have {formatPrice(MIN_PAYOUT_CENTS)} available.
              {balance.pendingCents > 0 && balance.nextReleaseAt && ` More becomes available on ${formatDate(balance.nextReleaseAt)}.`}
            </p>
          )}
        </section>

        <section className="panel p-6" aria-labelledby="payto">
          <h2 id="payto" className="text-lg font-bold">
            Where your money goes
          </h2>
          {connectEnabled() ? (
            <div className="mt-3">
              {shop.stripePayoutsReady ? (
                <p className="font-semibold text-go">Your bank account is verified for payouts.</p>
              ) : shop.stripeAccountId ? (
                <p className="text-ink-soft">Your verification isn&apos;t finished yet. It takes about 5 minutes.</p>
              ) : (
                <p className="text-ink-soft">
                  Before your first payout, confirm who you are and add your bank account. It&apos;s a one-time, secure form run by
                  Stripe, our payments provider. You don&apos;t need a Stripe account.
                </p>
              )}
              {sp.connect_error && <p className="mt-2 text-sm text-stop">We couldn&apos;t open the verification form. Try again in a moment.</p>}
              <a href="/dashboard/balance/connect" className={`btn btn-sm mt-4 ${shop.stripePayoutsReady ? "btn-outline" : "btn-primary"}`}>
                {shop.stripePayoutsReady ? "Update bank details" : shop.stripeAccountId ? "Continue verification" : "Set up payouts"}
              </a>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {shop.payoutAccountNumber && (
                <p className="text-sm text-ink-soft">
                  Paying to <strong className="text-ink">{shop.payoutAccountName}</strong>, {maskAccount(shop.payoutAccountNumber)}
                </p>
              )}
              <BankForm name={shop.payoutAccountName} number={shop.payoutAccountNumber} />
            </div>
          )}
        </section>
      </div>

      <section className="mt-10" aria-labelledby="statement">
        <h2 id="statement" className="font-semiwide text-2xl">
          Statement
        </h2>
        {statement.length === 0 ? (
          <p className="mt-3 text-ink-soft">Sales, fees, refunds and withdrawals will be listed here.</p>
        ) : (
          <div className="panel mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[0.9375rem]">
              <thead className="border-b border-line bg-paper text-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {statement.map((e) => {
                  const held = e.availableAt > now;
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="mr-2 inline-block rounded-[3px] bg-paper px-1.5 py-0.5 text-xs font-semibold text-ink-soft">{TYPE_LABEL[e.type]}</span>
                        {e.orderId ? (
                          <Link href={`/dashboard/orders/${e.orderId}`} className="hover:underline">
                            {e.description}
                          </Link>
                        ) : (
                          e.description
                        )}
                        {held && <span className="ml-2 text-xs font-semibold text-cobalt">On hold until {formatDate(e.availableAt)}</span>}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${e.amountCents < 0 ? "text-stop" : ""}`}>{signed(e.amountCents)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-ink-soft">{formatPrice(e.running)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="mt-10" aria-labelledby="payouts">
          <h2 id="payouts" className="font-semiwide text-2xl">
            Payouts
          </h2>
          <ul className="panel mt-4 divide-y divide-line">
            {history.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">
                    #{p.number} · {formatPrice(p.amountCents)}
                  </p>
                  <p className="text-sm text-ink-soft">
                    Requested {formatDate(p.requestedAt)}
                    {p.processedAt && ` · ${p.status === "paid" ? "sent" : "closed"} ${formatDate(p.processedAt)}`}
                    {p.status === "rejected" && p.note && ` · ${p.note}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.status === "paid" ? "bg-go-wash text-go" : p.status === "rejected" ? "bg-stop-wash text-stop" : "bg-sticker text-ink"
                  }`}
                >
                  {PAYOUT_LABEL[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-soft">
        <h2 className="text-base font-bold text-ink">How it works</h2>
        <p className="mt-2">
          Customers pay by card through myQR. For each sale we add the full amount to your balance and take our fee
          ({site.platformFeePercent}%{site.platformFeeFixedCents ? ` + ${formatPrice(site.platformFeeFixedCents)}` : ""}, which covers
          card processing). The money is held for{" "}
          {HOLD_DAYS} days so refunds and card disputes can be covered, then it becomes available. Request a payout any time you
          have {formatPrice(MIN_PAYOUT_CENTS)} or more available.
        </p>
      </section>
    </>
  );
}
