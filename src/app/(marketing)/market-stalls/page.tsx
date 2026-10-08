import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/marketing/Faqs";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { StallSign } from "@/components/marketing/StallSign";
import { site } from "@/config/site";
import { FAQS } from "@/content/faq";
import { previewTarget } from "@/lib/qr";

export const metadata: Metadata = {
  title: "Online store and QR code for market stall holders in NZ",
  description:
    "Turn your market stall into an online shop. Farmers markets, craft markets, night markets and car boot sales: list your products, print a QR code for your stall, and keep selling between market days.",
  alternates: { canonical: "/market-stalls" },
  keywords: ["market stall online shop", "farmers market online store nz", "craft market stall", "qr code market stall", "sell at markets nz"],
};

const MARKETS = [
  {
    title: "Farmers markets and growers",
    body: "Take pre-orders for next week's pickup, sell preserves and dry goods for delivery, and let regulars know what's in season.",
  },
  {
    title: "Craft and artisan markets",
    body: "Show your whole range, not just what fits in the car. Take commissions and custom orders from people who saw your work in person.",
  },
  {
    title: "Night markets and food stalls",
    body: "Sell sauces, spice mixes, merch and gift vouchers online. Post your menu and where you'll be next.",
  },
  {
    title: "Car boot and vintage sellers",
    body: "One-off finds sell fast. List them as they come in and mark them sold, so buyers know to check back often.",
  },
];

export default function MarketStallsPage() {
  const example = "harbourside-ceramics";
  return (
    <>
      <PageIntro
        title="An online shop that works as hard as your market stall"
        intro="You already have the products, the regulars and the patter. myQR gives your stall a home online and a QR code that sends shoppers straight there — so the sale doesn't end when you pack up the gazebo."
        crumbs={[{ href: "/market-stalls", label: "Market stalls" }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary">
            Start your shop
          </Link>
          <Link href="/guides/qr-code-for-market-stall" className="btn btn-outline">
            QR code tips for stalls
          </Link>
        </div>
      </PageIntro>

      <section className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <h2 className="font-semiwide text-2xl sm:text-3xl">What changes on market day</h2>
          <ul className="mt-6 space-y-5">
            {[
              ["Browsers become buyers.", "Someone who isn't ready to buy scans your sign and orders that evening."],
              ["Sold out isn't the end.", "Take orders for the next batch, with pickup at your next market."],
              ["Your table gets bigger.", "Bring your best sellers; the full range is one scan away."],
              ["You know what's working.", "See scans per day and compare markets side by side."],
            ].map(([t, b]) => (
              <li key={t} className="border-l-[3px] border-cobalt pl-5">
                <p className="text-lg font-bold">{t}</p>
                <p className="mt-1 leading-relaxed text-ink-soft">{b}</p>
              </li>
            ))}
          </ul>
        </div>
        <StallSign
          name="Harbourside Ceramics"
          address={`${example}.${site.rootDomain.split(":")[0]}`}
          qrValue={previewTarget(example)}
          watermark={false}
          sticker={false}
        />
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <h2 className="font-semiwide max-w-2xl text-2xl sm:text-3xl">For every kind of market</h2>
        <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2">
          {MARKETS.map((m) => (
            <div key={m.title} className="border-t-2 border-ink pt-5">
              <h3 className="text-xl font-bold">{m.title}</h3>
              <p className="mt-2 max-w-[52ch] leading-relaxed text-ink-soft">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="panel grid gap-10 p-8 sm:p-10 md:grid-cols-2">
          <div>
            <h2 className="font-semiwide text-2xl sm:text-3xl">Printed and ready for the stall</h2>
            <p className="mt-4 max-w-[52ch] leading-relaxed text-ink-soft">
              Your dashboard prints signs already sized for the job, with your shop name, your QR code and a line telling
              people what scanning does. Print at home or at the library, slip it in a plastic sleeve, and you&apos;re set.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 self-center text-sm">
            {[
              ["A4 stall sign", "Front of the table, read from a few metres"],
              ["A5 table tent", "Folds to stand by your cash box"],
              ["Counter cards", "Eight to a sheet, hand them out"],
              ["Product tags", "A code for each item, with its price"],
            ].map(([t, d]) => (
              <li key={t} className="border border-line bg-paper p-4">
                <p className="font-bold">{t}</p>
                <p className="mt-1 text-ink-soft">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-3xl px-4 sm:px-6">
        <h2 className="font-semiwide mb-6 text-2xl sm:text-3xl">Stallholder questions</h2>
        <FaqList faqs={FAQS.filter((f) => /cost|pay|print|food|quiet/i.test(f.q))} />
      </section>

      <CtaBand
        title="Get set up before your next market"
        body={`One-off $${site.setupFee}. No monthly fees. Your QR code is ready the moment you publish.`}
      />
    </>
  );
}
