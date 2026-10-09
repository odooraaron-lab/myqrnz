import type { Metadata } from "next";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { shopHost, shopUrl, site } from "@/config/site";
import { db } from "@/db";
import { enquiries, listings, shops, shopVisits, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate, nzToday } from "@/lib/format";
import { setShopStatusAction } from "./actions";

export const metadata: Metadata = { title: "Platform admin", robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoDay = new Date(new Date(`${nzToday()}T00:00:00Z`).getTime() - 6 * 864e5).toISOString().slice(0, 10);

  const [[totals], [weekEnquiries], [weekScans], rows] = await Promise.all([
    db
      .select({
        shops: count(),
        live: sql<number>`count(*) filter (where ${shops.status} = 'live')`.mapWith(Number),
        newThisWeek: sql<number>`count(*) filter (where ${shops.createdAt} >= ${weekAgo})`.mapWith(Number),
        paid: sql<number>`count(*) filter (where ${shops.setupPaidAt} is not null)`.mapWith(Number),
      })
      .from(shops),
    db.select({ n: count() }).from(enquiries).where(gte(enquiries.createdAt, weekAgo)),
    db
      .select({ n: sql<number>`coalesce(sum(${shopVisits.count}), 0)`.mapWith(Number) })
      .from(shopVisits)
      .where(sql`${shopVisits.day} >= ${weekAgoDay} and ${shopVisits.source} = 'qr'`),
    db
      .select({
        shop: shops,
        email: users.email,
        products: sql<number>`(select count(*) from ${listings} where ${listings.shopId} = ${shops.id})`.mapWith(Number),
      })
      .from(shops)
      .innerJoin(users, eq(users.id, shops.ownerId))
      .where(q ? sql`${shops.name} ilike ${`%${q}%`} or ${shops.subdomain} ilike ${`%${q}%`} or ${users.email} ilike ${`%${q}%`}` : undefined)
      .orderBy(desc(shops.createdAt))
      .limit(300),
  ]);

  const stats: [string, number | string][] = [
    ["Shops", totals.shops],
    ["Live", totals.live],
    ["New this week", totals.newThisWeek],
    ["Enquiries this week", weekEnquiries.n],
    ["QR scans this week", weekScans.n],
    ["Setup fees paid", `$${(totals.paid * site.setupFee).toLocaleString("en-NZ")}`],
  ];

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-semiwide text-3xl">Every shop on {site.rootDomain}</h1>

        <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-card p-4">
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="font-wide mt-1 text-2xl">{value}</dd>
            </div>
          ))}
        </dl>

        <form className="mt-10 flex max-w-md gap-2" role="search">
          <label htmlFor="q" className="sr-only">
            Search shops
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, address or email" className="input" />
          <button className="btn btn-outline">Search</button>
        </form>

        <div className="panel mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-paper">
              <tr>
                <th className="px-4 py-3 font-semibold">Shop</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ shop, email, products }) => (
                <tr key={shop.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{shop.name}</p>
                    <a href={shop.status === "live" ? shopUrl(shop.subdomain) : `/s/${shop.subdomain}`} target="_blank" rel="noopener" className="text-cobalt underline">
                      {shopHost(shop.subdomain)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${email}`} className="underline underline-offset-2">
                      {email}
                    </a>
                  </td>
                  <td className="px-4 py-3">{products}</td>
                  <td className="px-4 py-3 capitalize">{shop.status}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(shop.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={setShopStatusAction}>
                      <input type="hidden" name="id" value={shop.id} />
                      {shop.status === "suspended" ? (
                        <>
                          <input type="hidden" name="status" value={shop.publishedAt ? "live" : "draft"} />
                          <button className="btn btn-outline btn-sm">Restore</button>
                        </>
                      ) : (
                        <>
                          <input type="hidden" name="status" value="suspended" />
                          <button className="btn btn-danger btn-sm">Suspend</button>
                        </>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                    No shops match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
