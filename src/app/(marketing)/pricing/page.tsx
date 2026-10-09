import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/marketing/Faqs";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { Receipt } from "@/components/marketing/Receipt";
import { site } from "@/config/site";
import { FAQS } from "@/content/faq";

export const metadata: Metadata = {
  title: `Pricing: $${site.setupFee} once, no monthly fees`,
  description: `myQR costs a one-off $${site.setupFee} to set up your online store and ${site.platformFeePercent}% per sale with card fees included. No monthly subscription, so quiet months cost nothing. See how it compares over a year.`,
  alternates: { canonical: "/pricing" },
};

const SUBSCRIPTION_MONTHLY = 30;
// Card fees a store builder passes on (Stripe NZ cards), worked out on a typical sale.
const CARD_PERCENT = 2.65;
const CARD_FIXED = 0.3;
const AVERAGE_SALE = 40;
const SALES_LEVELS = [1000, 3000, 6000];

const myqrYear = (sales: number) => site.setupFee + (sales * site.platformFeePercent) / 100;
const planYear = (sales: number) =>
  SUBSCRIPTION_MONTHLY * 12 + (sales * CARD_PERCENT) / 100 + (sales / AVERAGE_SALE) * CARD_FIXED;

/** Yearly online sales above which a monthly plan works out cheaper in year one (rounded down to $500). */
function breakEven() {
  const perDollar = site.platformFeePercent / 100 - CARD_PERCENT / 100 - CARD_FIXED / AVERAGE_SALE;
  if (perDollar <= 0) return null;
  return Math.floor((SUBSCRIPTION_MONTHLY * 12 - site.setupFee) / perDollar / 500) * 500;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-NZ")}`;
}

export default function PricingPage() {
  return (
    <>
      <PageIntro
        title="One setup fee. No monthly bill."
        intro={`You pay $${site.setupFee} once to claim your address and open your shop. After that we take ${site.platformFeePercent}% of each sale made through your shop once card checkout is on, and that includes the card fees. If you don't sell, you don't pay.`}
        crumbs={[{ href: "/pricing", label: "Pricing" }]}
      />

      <section className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <Receipt />
        <div className="min-w-0">
          <h2 className="font-semiwide text-2xl sm:text-3xl">What a year costs</h2>
          <p className="mt-3 max-w-[56ch] leading-relaxed text-ink-soft">
            Compared with a typical store builder at ${SUBSCRIPTION_MONTHLY} a month. Our {site.platformFeePercent}% includes card
            fees. On a monthly plan you pay those on top, about {CARD_PERCENT}% + {Math.round(CARD_FIXED * 100)}c a sale (worked out
            here on an average sale of ${AVERAGE_SALE}).
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <caption className="sr-only">First-year cost of myQR compared with a monthly subscription</caption>
              <thead>
                <tr className="border-b-2 border-ink text-sm">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Online sales in a year
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    myQR
                  </th>
                  <th scope="col" className="py-3 font-semibold">
                    ${SUBSCRIPTION_MONTHLY}/month plan + card fees
                  </th>
                </tr>
              </thead>
              <tbody>
                {SALES_LEVELS.map((sales) => {
                  const ours = myqrYear(sales);
                  const theirs = planYear(sales);
                  return (
                    <tr key={sales} className="border-b border-line">
                      <th scope="row" className="py-4 pr-4 font-medium">
                        {money(sales)}
                      </th>
                      <td className="py-4 pr-4 text-lg font-bold">{money(ours)}</td>
                      <td className="py-4 text-lg text-ink-soft">{money(theirs)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            In later years myQR is just the {site.platformFeePercent}% on sales. The setup fee is paid once.
            {breakEven() &&
              ` If you sell more than about ${money(breakEven()!)} a year online, a monthly plan can work out cheaper.`}
          </p>

          <h2 className="font-semiwide mt-14 text-2xl sm:text-3xl">Why no monthly fee</h2>
          <div className="mt-4 max-w-[60ch] space-y-4 leading-relaxed text-ink-soft">
            <p>
              Market trade comes in waves. Strawberry growers are flat out in December and quiet in June. Christmas craft
              fairs make half a potter&apos;s year. A monthly bill doesn&apos;t care — it arrives either way.
            </p>
            <p>
              Taking a small share of each sale means we only do well when you do. It also means you can claim your shop
              now and grow into it, without watching a subscription tick over.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/register" className="btn btn-primary">
              Start your shop for ${site.setupFee}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-3xl px-4 sm:px-6">
        <h2 className="font-semiwide mb-6 text-2xl sm:text-3xl">Pricing questions</h2>
        <FaqList faqs={FAQS.filter((f) => /cost|pay|quiet|GST/i.test(f.q))} />
      </section>

      <CtaBand title="Claim your name before someone else does" body="Your address is held as soon as you sign up." />
    </>
  );
}
