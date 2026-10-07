import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "Guides: selling online from a market stall or small shop in NZ",
  description:
    "Practical guides for New Zealand market stallholders and small shops: starting an online store, using QR codes, product photos, shipping prices, pricing and product descriptions.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <>
      <PageIntro
        title="Guides for selling online"
        intro="Short, practical reading for people who sell face to face and want to sell online too. No jargon, written for New Zealand."
        crumbs={[{ href: "/guides", label: "Guides" }]}
      />
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug} className="bg-paper">
              <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col p-7 hover:bg-card">
                <h2 className="text-xl font-bold leading-snug group-hover:text-cobalt">{g.title}</h2>
                <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{g.description}</p>
                <p className="mt-5 text-sm font-semibold">{g.readMinutes} min read</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand title="Put it into practice" body="Set up your own shop and QR code while it's fresh in your mind." />
    </>
  );
}
