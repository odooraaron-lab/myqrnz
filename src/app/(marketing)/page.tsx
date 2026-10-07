import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/marketing/Faqs";
import { NameClaimHero } from "@/components/marketing/NameClaim";
import { Receipt } from "@/components/marketing/Receipt";
import { ClaimArt, ListArt, PrintArt } from "@/components/marketing/StepArt";
import { site } from "@/config/site";
import { FAQS } from "@/content/faq";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: { absolute: "myQR — Online store and QR code for market stalls and small shops in NZ" },
  description: site.description,
  alternates: { canonical: "/" },
  keywords: [
    "online store nz",
    "market stall online shop",
    "qr code for market stall",
    "set up online shop",
    "small business website nz",
    "online store no monthly fees",
    "sell online new zealand",
  ],
};

const STEPS = [
  {
    title: "Claim your name",
    body: "Pick the name customers know you by. It becomes your shop address, like totara-honey.myqr.co.nz.",
    art: <ClaimArt />,
  },
  {
    title: "Add what you sell",
    body: "Take photos on your phone, add a price, a shipping price or pickup, and publish. Choose a design and add your logo.",
    art: <ListArt />,
  },
  {
    title: "Print your QR code",
    body: "Print a ready-made stall sign, counter cards or price tags. Customers scan and land in your shop.",
    art: <PrintArt />,
  },
];

const MOMENTS = [
  {
    title: "“I'll think about it”",
    body: "The browser who walks away still has your whole shop on their phone, and can buy tonight.",
  },
  {
    title: "“I've only got a card”",
    body: "No EFTPOS machine, no problem. They scan, send an order, and pay you the way you choose.",
  },
  {
    title: "You've sold out",
    body: "Take orders for the next batch instead of turning people away, with pickup at next week's market.",
  },
  {
    title: "“Do you have a website?”",
    body: "Point at the sign. No spelling out addresses, no handing over a card that ends up in the wash.",
  },
];

const AUDIENCES = [
  {
    href: "/market-stalls",
    title: "Market stall holders",
    body: "Farmers markets, craft fairs, night markets and car boot sales. Keep selling between market days.",
  },
  {
    href: "/small-business",
    title: "Small shops and cafés",
    body: "A counter card that turns walk-ins into online customers, without paying a monthly website bill.",
  },
  {
    href: "/guides/sell-online-from-your-market-stall",
    title: "Makers and home businesses",
    body: "Potters, bakers, printmakers and growers. Show the full range you can't fit on one table.",
  },
  {
    href: "/guides/qr-code-for-market-stall",
    title: "Pop-ups and events",
    body: "One-day stands and festival stalls. A QR code means the sale doesn't end when you pack up.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl overflow-x-clip px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:pb-28">
        <NameClaimHero />
      </section>

      <section aria-labelledby="how" className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="how" className="font-semiwide max-w-xl text-[clamp(1.75rem,3.6vw,2.6rem)]">
              Set up on Sunday afternoon. On the stall by Saturday.
            </h2>
            <Link href="/how-it-works" className="font-semibold text-cobalt underline underline-offset-4">
              See every step
            </Link>
          </div>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col">
                <div className="border border-line bg-paper px-6 py-5">{s.art}</div>
                <p className="font-wide mt-6 text-sm text-cobalt">Step {i + 1}</p>
                <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="moments" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="moments" className="font-semiwide text-[clamp(1.75rem,3.6vw,2.6rem)]">
              Four sales your stall misses every market day
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
              A QR code on your stall catches the people who would have walked away. It costs nothing to print and works
              while you&apos;re busy serving someone else.
            </p>
          </div>
          <dl className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {MOMENTS.map((m) => (
              <div key={m.title} className="border-t-2 border-ink pt-4">
                <dt className="text-lg font-bold">{m.title}</dt>
                <dd className="mt-2 leading-relaxed text-ink-soft">{m.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="price" className="border-y border-line bg-cobalt-wash/60">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 id="price" className="font-semiwide text-[clamp(1.75rem,3.6vw,2.6rem)]">
              Pay once to open. Pay a little when you sell.
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
              Most website builders charge every month whether you sell or not. Market trade is seasonal, so we don&apos;t.
              A one-off ${site.setupFee} sets up your shop, and we take {site.platformFeePercent}% of each sale once card
              checkout is on. That&apos;s it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">
                Start your shop
              </Link>
              <Link href="/pricing" className="btn btn-outline">
                Compare the costs
              </Link>
            </div>
          </div>
          <Receipt />
        </div>
      </section>

      <section aria-labelledby="who" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 id="who" className="font-semiwide max-w-2xl text-[clamp(1.75rem,3.6vw,2.6rem)]">
          Built for people who sell face to face
        </h2>
        <ul className="mt-12 grid border-l border-t border-line sm:grid-cols-2">
          {AUDIENCES.map((a) => (
            <li key={a.title} className="border-b border-r border-line">
              <Link href={a.href} className="group block h-full p-7 hover:bg-card">
                <h3 className="text-xl font-bold group-hover:text-cobalt">{a.title}</h3>
                <p className="mt-2 max-w-[44ch] leading-relaxed text-ink-soft">{a.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="faq" className="font-semiwide text-[clamp(1.75rem,3.6vw,2.6rem)]">
              Questions stallholders ask us
            </h2>
            <Link href="/faq" className="mt-5 inline-block font-semibold text-cobalt underline underline-offset-4">
              All questions
            </Link>
          </div>
          <FaqList faqs={FAQS.slice(0, 6)} />
        </div>
      </section>

      <section aria-labelledby="guides" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 id="guides" className="font-semiwide text-[clamp(1.5rem,3vw,2.1rem)]">
          Guides for selling online in New Zealand
        </h2>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {GUIDES.slice(0, 4).map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-lg font-semibold group-hover:text-cobalt">{g.title}</span>
                <span className="shrink-0 text-sm text-ink-soft">{g.readMinutes} min read</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center">
          <h2 className="font-wide max-w-2xl text-[clamp(1.9rem,4vw,3rem)]">Your name is probably still free.</h2>
          <Link href="/register" className="btn bg-sticker text-ink hover:bg-white">
            Claim it now
          </Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "myQR online store and QR code",
          serviceType: "Online store builder",
          provider: { "@type": "Organization", name: site.name, url: site.url },
          areaServed: { "@type": "Country", name: "New Zealand" },
          description: site.description,
          offers: {
            "@type": "Offer",
            price: site.setupFee,
            priceCurrency: "NZD",
            description: `One-off setup fee. ${site.platformFeePercent}% per sale. No monthly fees.`,
          },
        }}
      />
    </>
  );
}
