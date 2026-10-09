import { and, desc, eq, inArray, ne } from "drizzle-orm";
import Link from "next/link";
import { PageHead } from "@/components/dashboard/PageHead";
import { db } from "@/db";
import { orders, type OrderStatus } from "@/db/schema";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";
import { requireSeller } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { paymentsLive } from "@/lib/stripe";

export const metadata = { title: "Orders" };

const FILTERS = [
  { key: "todo", label: "To do", statuses: ["paid"] as OrderStatus[] },
  { key: "open", label: "In progress", statuses: ["shipped", "ready"] as OrderStatus[] },
  { key: "done", label: "Completed", statuses: ["completed"] as OrderStatus[] },
  { key: "all", label: "All", statuses: null },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { shop } = await requireSeller();
  const { f = "todo" } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];

  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.shopId, shop.id),
        filter.statuses ? inArray(orders.status, filter.statuses) : ne(orders.status, "pending"),
        ne(orders.status, "cancelled"),
      ),
    )
    .orderBy(desc(orders.paidAt), desc(orders.createdAt))
    .limit(200);
  const todo = (await db.select({ id: orders.id }).from(orders).where(and(eq(orders.shopId, shop.id), eq(orders.status, "paid")))).length;

  return (
    <>
      <PageHead
        title="Orders"
        intro={
          paymentsLive()
            ? "Paid orders from your shop. Send or hand over each one, then mark it done so the customer knows."
            : "Card checkout isn't switched on yet. Until it is, customers send order requests to Enquiries."
        }
        actions={
          <Link href="/dashboard/balance" className="btn btn-outline btn-sm">
            Balance and payouts
          </Link>
        }
      />

      <nav aria-label="Filter orders" className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/dashboard/orders?f=${x.key}`}
            aria-current={x.key === filter.key ? "page" : undefined}
            className={`rounded-[3px] px-3 py-1.5 text-sm font-medium ${x.key === filter.key ? "bg-ink text-white" : "text-ink-soft hover:bg-card"}`}
          >
            {x.label}
            {x.key === "todo" && todo > 0 && <span className="ml-1.5 rounded-full bg-sticker px-1.5 text-xs font-bold text-ink">{todo}</span>}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <h2 className="font-semiwide text-2xl">{filter.key === "todo" ? "You're all caught up" : "No orders here yet"}</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            {filter.key === "todo"
              ? "New paid orders appear here and in your email."
              : "When customers buy from your shop, their orders show up here."}
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/dashboard/orders/${o.id}`} className="grid gap-2 p-4 hover:bg-paper sm:grid-cols-[6rem_1fr_auto_auto] sm:items-center sm:gap-5">
                <span className="font-bold">#{o.number}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {o.itemTitle}
                    {o.quantity > 1 && ` × ${o.quantity}`}
                  </span>
                  <span className="block text-sm text-ink-soft">
                    {o.buyerName ?? o.buyerEmail ?? "Customer"} · {o.delivery === "post" ? "Post" : "Pickup"} ·{" "}
                    {o.paidAt ? formatDateTime(o.paidAt) : formatDateTime(o.createdAt)}
                  </span>
                </span>
                <span className="font-semibold sm:text-right">{formatPrice(o.totalCents)}</span>
                <span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[o.status]}`}>
                    {o.disputed ? "Disputed" : STATUS_LABEL[o.status]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
