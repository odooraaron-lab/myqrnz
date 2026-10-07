import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/marketing/Faqs";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { site } from "@/config/site";
import { FAQS } from "@/content/faq";

export const metadata: Metadata = {
  title: "Simple online store for small shops in NZ, no monthly fees",
  description:
    "A simple online store for small shops, cafés, salons and home businesses in New Zealand. Your own web address, products with photos and prices, and a QR code for your counter. One-off setup, no monthly fees.",
  alternates: { canonical: "/small-business" },
  keywords: ["small business website nz", "simple online store", "online shop for small business", "qr code for shop counter", "cheap online store nz"],
};

const USES = [
  {
    title: "Shops and boutiques",
    body: "Put your stock online for customers who can't get in during opening hours, or who want to buy a gift for someone out of town.",
  },
  {
    title: "Cafés and bakeries",
    body: "Sell beans, gift boxes, celebration cakes and vouchers. A QR code on the counter or menu takes orders while the coffee's brewing.",
  },
  {
    title: "Salons and studios",
    body: "Sell retail products and gift cards online. Stick a QR card on the mirror so clients can reorder at home.",
  },
  {
    title: "Home businesses",
    body: "Give your side hustle a real address. Send customers one link instead of a string of photos in Messenger.",
  },
];

export default function SmallBusinessPage() {
  return (
    <>
      <PageIntro
        title="A simple online store for a small shop"
        intro="Not every business needs a big website. If you want customers to see what you sell, check prices and order without a phone call, myQR gets you there in an afternoon — with a QR code for your counter, window and receipts."
        crumbs={[{ href: "/small-business", label: "Small shops" }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary">
            Start your shop
          </Link>
          <Link href="/pricing" className="btn btn-outline">
            See pricing
          </Link>
        </div>
      </PageIntro>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
          {USES.map((u) => (
            <div key={u.title} className="border-t-2 border-ink pt-5">
              <h2 className="text-xl font-bold">{u.title}</h2>
              <p className="mt-2 max-w-[52ch] leading-relaxed text-ink-soft">{u.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-semiwide text-2xl sm:text-3xl">Everything a small shop needs, nothing it doesn&apos;t</h2>
            <p className="mt-4 max-w-[54ch] leading-relaxed text-ink-soft">
              Big e-commerce platforms are built for warehouses. You get pages of settings, apps to install and a monthly
              bill. myQR keeps to what a small shop actually uses.
            </p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {[
              ["Your own address", "yourshop.myqr.co.nz, ready to print"],
              ["Your look", "Seven designs, your logo, your colour"],
              ["Your products", "Unlimited, with up to eight photos each"],
              ["Your delivery rules", "Shipping price per item, or pickup only"],
              ["Your customers' questions", "Straight to your inbox and email"],
              ["Found on Google", "Search titles, descriptions and sitemaps done for you"],
            ].map(([t, d]) => (
              <div key={t} className="grid gap-1 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                <dt className="font-bold">{t}</dt>
                <dd className="text-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-3xl px-4 sm:px-6">
        <h2 className="font-semiwide mb-6 text-2xl sm:text-3xl">Questions from shop owners</h2>
        <FaqList faqs={FAQS.filter((f) => /skills|get with|Google|domain|change/i.test(f.q))} />
      </section>

      <CtaBand
        title="Open your online shop this week"
        body={`$${site.setupFee} once. ${site.platformFeePercent}% per sale. No subscriptions.`}
      />
    </>
  );
}
