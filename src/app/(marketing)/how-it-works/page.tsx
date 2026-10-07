import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { ClaimArt, DesignArt, ListArt, LiveArt, PrintArt } from "@/components/marketing/StepArt";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "How it works: set up an online shop and QR code in an afternoon",
  description:
    "See how to set up your myQR online store: claim your shop name, add products with photos and prices, choose a design, and print a QR code for your market stall or shop counter.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    title: "Claim your shop name",
    art: <ClaimArt />,
    time: "2 minutes",
    points: [
      "Type your shop name. We suggest a web address from it, like totara-honey.myqr.co.nz.",
      "Add your email and a password. That's your account.",
      "Your address is held for you straight away.",
    ],
  },
  {
    title: "Make it look like yours",
    art: <DesignArt />,
    time: "10 minutes",
    points: [
      "Upload your logo and a cover photo of your stall, shop or workshop.",
      "Pick one of seven shop designs — from clean and bright to night market — and set your own colour.",
      "Add a short description, where to find you on market days, and how pickup works.",
      "Your page titles and Google descriptions are written for you from these details. Edit them if you like.",
    ],
  },
  {
    title: "Add what you sell",
    art: <ListArt />,
    time: "2 minutes per product",
    points: [
      "Snap up to eight photos per product on your phone. We shrink them so they load fast.",
      "Set a price, and a shipping price for each item — or mark it pickup only.",
      "Track stock if you like, or leave it open for made-to-order work.",
      "Mark things as sold, hide them for the season, or keep a draft until it's ready.",
    ],
  },
  {
    title: "Print your QR code",
    art: <PrintArt />,
    time: "5 minutes",
    points: [
      "Choose a style and colour for your code, with your logo in the middle if you want it.",
      "Print an A4 stall sign, an A5 table tent, a sheet of counter cards or sticker-sized codes.",
      "Every product has its own code too — put it beside the item on your table.",
      "Download PNG or SVG files to add to flyers, bags and business cards.",
    ],
  },
  {
    title: "Publish and start selling",
    art: <LiveArt />,
    time: "1 minute",
    points: [
      `Pay the one-off $${site.setupFee} setup fee and your shop goes live.`,
      "Customers scan, browse and send orders. You get an email and a message in your inbox.",
      "Your dashboard shows how many people scanned your code and visited this week.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        title="From market table to online shop in an afternoon"
        intro="Everything happens in your browser, on your phone or computer. Nothing to install, no designer, no monthly bill. Here's each step."
        crumbs={[{ href: "/how-it-works", label: "How it works" }]}
      />

      <ol className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="panel grid gap-8 p-7 sm:p-10 md:grid-cols-[1fr_1.4fr] md:items-center">
            <div className="border border-line bg-paper p-6">{s.art}</div>
            <div>
              <p className="text-sm font-semibold text-cobalt">
                Step {i + 1} of {STEPS.length}, about {s.time}
              </p>
              <h2 className="font-semiwide mt-2 text-2xl sm:text-3xl">{s.title}</h2>
              <ul className="mt-5 space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 leading-relaxed">
                    <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-ink" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <h2 className="font-semiwide text-2xl sm:text-3xl">After you&apos;re live</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold">Answer enquiries</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Orders and questions arrive by email and in your dashboard inbox. Reply straight from your email.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Watch your scans</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">
              See QR scans and website visits by day, so you know which markets send people to your shop.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold">Keep it fresh</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Add new stock after each market. Your QR code never changes, so your printed signs stay right.
            </p>
          </div>
        </div>
        <p className="mt-10 text-ink-soft">
          New to selling online? Read{" "}
          <Link href="/guides/how-to-start-an-online-store-nz" className="font-semibold text-ink underline underline-offset-2">
            how to start an online store in New Zealand
          </Link>
          .
        </p>
      </section>

      <CtaBand title="Ready when you are" body="Claim your name now and finish setting up whenever suits you." />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to set up an online store with a QR code for your market stall",
          totalTime: "PT1H",
          estimatedCost: { "@type": "MonetaryAmount", currency: "NZD", value: site.setupFee },
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.points.join(" "),
          })),
        }}
      />
    </>
  );
}
