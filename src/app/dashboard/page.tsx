import { and, count, eq, gte, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { QrCode } from "@/components/QrCode";
import { shopHost, shopUrl, site } from "@/config/site";
import { db } from "@/db";
import { enquiries, listings, orders, shopVisits } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { formatPrice, nzToday } from "@/lib/format";
import { getBalance } from "@/lib/money";
import { paymentsLive } from "@/lib/stripe";
import { qrUnlocked, setupFeeRequired } from "@/lib/payments";
import { previewTarget, qrTarget } from "@/lib/qr";
import { shopDesign } from "@/lib/qr-design";
import { publishShopAction } from "./actions";

export const metadata = { title: "Overview" };

function lastNDays(n: number) {
  const today = new Date(`${nzToday()}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; published?: string }>;
}) {
  const { shop } = await requireSeller();
  const { welcome, published } = await searchParams;
  const days = lastNDays(14);

  const [listingCounts, [{ unread }], visits] = await Promise.all([
    db
      .select({ status: listings.status, n: count() })
      .from(listings)
      .where(eq(listings.shopId, shop.id))
      .groupBy(listings.status),
    db
      .select({ unread: count() })
      .from(enquiries)
      .where(and(eq(enquiries.shopId, shop.id), isNull(enquiries.readAt))),
    db
      .select({ day: sql<string>`to_char(${shopVisits.day}, 'YYYY-MM-DD')`, source: shopVisits.source, count: shopVisits.count })
      .from(shopVisits)
      .where(and(eq(shopVisits.shopId, shop.id), gte(shopVisits.day, days[0]))),
  ]);

  const selling = paymentsLive() && shop.status === "live";
  const [balance, [{ toSend }]] = selling
    ? await Promise.all([
        getBalance(shop.id),
        db.select({ toSend: count() }).from(orders).where(and(eq(orders.shopId, shop.id), eq(orders.status, "paid"))),
      ])
    : [null, [{ toSend: 0 }]];
  const active = listingCounts.find((l) => l.status === "active")?.n ?? 0;
  const totalListings = listingCounts.reduce((a, l) => a + l.n, 0);
  const byDay = days.map((day) => ({
    day,
    qr: visits.filter((v) => v.day === day && v.source === "qr").reduce((a, v) => a + v.count, 0),
    web: visits.filter((v) => v.day === day && v.source === "web").reduce((a, v) => a + v.count, 0),
  }));
  const week = byDay.slice(-7);
  const scans7 = week.reduce((a, d) => a + d.qr, 0);
  const visits7 = week.reduce((a, d) => a + d.qr + d.web, 0);
  const peak = Math.max(1, ...byDay.map((d) => d.qr + d.web));

  const live = shop.status === "live";
  const url = shopUrl(shop.subdomain);
  const checklist = [
    { done: !!shop.logoUrl, label: "Add your logo", href: "/dashboard/shop#branding" },
    { done: !!shop.description, label: "Write a few lines about your shop", href: "/dashboard/shop#basics" },
    { done: !!(shop.location || shop.marketInfo), label: "Say where customers can find you", href: "/dashboard/shop#contact" },
    { done: totalListings > 0, label: "Add your first product", href: "/dashboard/listings/new" },
    { done: live, label: "Publish your shop", href: "#publish" },
  ];
  const remaining = checklist.filter((c) => !c.done).length;

  return (
    <div className="space-y-8">
      {welcome && (
        <div role="status" className="border-[1.5px] border-ink bg-sticker px-6 py-5">
          <p className="font-semiwide text-xl">{shopHost(shop.subdomain)} is yours.</p>
          <p className="mt-1">Work through the list below. Your shop stays private until you publish it.</p>
        </div>
      )}
      {published && (
        <div role="status" className="border-[1.5px] border-go bg-go-wash px-6 py-5 text-go">
          <p className="font-semiwide text-xl">Your shop is live.</p>
          <p className="mt-1 text-ink">Print your QR code and put it on the stall.</p>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6 sm:p-7" id="publish">
          {live ? (
            <>
              <h1 className="font-semiwide text-2xl">Your shop is live</h1>
              <p className="mt-2 text-ink-soft">Anyone with the link or QR code can browse and send orders.</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a href={url} target="_blank" rel="noopener" className="btn btn-primary">
                  Open your shop
                </a>
                <CopyButton value={url} label="Copy link" />
              </div>
            </>
          ) : (
            <>
              <h1 className="font-semiwide text-2xl">Get {shop.name} ready</h1>
              <p className="mt-2 text-ink-soft">
                {remaining > 1
                  ? `${remaining - 1} thing${remaining - 1 === 1 ? "" : "s"} to do before you publish. You can publish any time.`
                  : "Everything's in place. Publish when you're ready."}
              </p>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="flex items-center gap-3 py-3 hover:text-cobalt">
                      <span
                        aria-hidden="true"
                        className={`grid h-5 w-5 shrink-0 place-items-center border-[1.5px] ${c.done ? "border-go bg-go text-white" : "border-line-strong"}`}
                      >
                        {c.done && (
                          <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                      </span>
                      <span className={c.done ? "text-ink-soft line-through" : "font-medium"}>{c.label}</span>
                      <span className="sr-only">{c.done ? "(done)" : "(to do)"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <form action={publishShopAction} className="mt-6 flex flex-wrap items-center gap-4">
                <button className="btn btn-primary">
                  {setupFeeRequired(shop) ? `Pay $${site.setupFee} and publish` : "Publish my shop"}
                </button>
                <Link href={`/s/${shop.subdomain}`} target="_blank" className="font-semibold underline underline-offset-2">
                  Preview it first
                </Link>
              </form>
            </>
          )}
        </div>

        <div className="panel flex items-center gap-5 self-start p-6">
          <QrCode
            value={qrUnlocked(shop) ? qrTarget(url) : previewTarget(shop.subdomain)}
            {...shopDesign(shop)}
            frame="none"
            margin={1}
            logoHref={shop.logoUrl}
            watermark={!qrUnlocked(shop)}
            className="w-28 shrink-0 sm:w-32"
          />
          <div>
            <h2 className="text-lg font-bold">Your QR code</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {qrUnlocked(shop) ? "Ready to download and print." : "Preview only. Design it now; it unlocks when you publish."}
            </p>
            <Link href="/dashboard/qr" className="btn btn-outline btn-sm mt-3">
              {qrUnlocked(shop) ? "Print signs and cards" : "Design your code"}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="stats">
        <h2 id="stats" className="sr-only">
          This week
        </h2>
        <dl className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {(selling
            ? [
                ["Orders to send", toSend, "/dashboard/orders"],
                ["Available to withdraw", formatPrice(balance!.availableCents), "/dashboard/balance"],
                ["QR scans, last 7 days", scans7, null],
                ["Visits, last 7 days", visits7, null],
              ]
            : [
                ["QR scans, last 7 days", scans7, null],
                ["Visits, last 7 days", visits7, null],
                ["Products for sale", active, "/dashboard/listings"],
                ["Unread enquiries", unread, "/dashboard/enquiries"],
              ]
          ).map(([label, value, href]) => (
            <div key={String(label)} className="relative bg-card p-5">
              <dt className="text-sm text-ink-soft">
                {href ? (
                  <Link href={String(href)} className="after:absolute after:inset-0 hover:text-ink">
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </dt>
              <dd className="font-wide mt-2 text-3xl">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel p-6" aria-labelledby="chart">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="chart" className="text-lg font-bold">
            Visitors, last 14 days
          </h2>
          <p className="flex gap-4 text-sm text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-cobalt" /> From QR scans
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-line-strong" /> Other visits
            </span>
          </p>
        </div>
        <div className="mt-6 flex h-40 items-end gap-1.5" role="img" aria-label={`${visits7} visits in the last 7 days, ${scans7} from QR scans`}>
          {byDay.map((d) => {
            const total = d.qr + d.web;
            return (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.qr} scans, ${d.web} other`}>
                <div className="bg-line-strong" style={{ height: `${(d.web / peak) * 100}%` }} />
                <div className="bg-cobalt" style={{ height: `${(d.qr / peak) * 100}%` }} />
                {total === 0 && <div className="h-px bg-line" />}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-soft">
          <span>{new Date(days[0]).toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}</span>
          <span>Today</span>
        </div>
        {visits7 === 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Visits appear here once your shop is live. Scans from your printed QR codes are counted separately.
          </p>
        )}
      </section>
    </div>
  );
}
