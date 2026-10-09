import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/dashboard/PageHead";
import { db } from "@/db";
import { ledgerEntries, orders } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { trackUrl } from "@/lib/orders";
import { markCompletedAction, markReadyAction } from "../actions";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";
import { RefundForm, ShipForm } from "./OrderForms";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireSeller();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.shopId, shop.id))).limit(1);
  if (!order) notFound();
  const entries = await db.select().from(ledgerEntries).where(eq(ledgerEntries.orderId, order.id)).orderBy(ledgerEntries.createdAt);
  const net = entries.reduce((a, e) => a + e.amountCents, 0);
  const releaseAt = entries.find((e) => e.type === "sale")?.availableAt;
  const addr = order.shippingAddress;
  const canRefund = !!order.stripePaymentIntentId && order.refundedCents < order.totalCents && order.status !== "pending";

  return (
    <>
      <Link href="/dashboard/orders" className="text-sm font-medium text-ink-soft hover:text-ink">
        Orders
      </Link>
      <PageHead
        title={`Order #${order.number}`}
        intro={
          <>
            <span className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
            {order.disputed && <span className="mr-2 inline-block rounded-full bg-stop px-2.5 py-0.5 text-xs font-semibold text-white">Card dispute open</span>}
            {order.paidAt ? `Paid ${formatDateTime(order.paidAt)}` : `Started ${formatDateTime(order.createdAt)}`}
          </>
        }
        actions={
          <a href={trackUrl(shop, order)} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
            Customer&apos;s view
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-lg font-bold">What they bought</h2>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between gap-4">
                <dt>
                  {order.listingId ? (
                    <Link href={`/dashboard/listings/${order.listingId}`} className="underline underline-offset-2">
                      {order.itemTitle}
                    </Link>
                  ) : (
                    order.itemTitle
                  )}
                  {order.quantity > 1 && ` × ${order.quantity}`}
                </dt>
                <dd>{formatPrice(order.unitPriceCents * order.quantity)}</dd>
              </div>
              {order.delivery === "post" && (
                <div className="flex justify-between gap-4">
                  <dt>Shipping</dt>
                  <dd>{order.shippingCents ? formatPrice(order.shippingCents) : "Free"}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-line pt-2 font-bold">
                <dt>Customer paid</dt>
                <dd>{formatPrice(order.totalCents)}</dd>
              </div>
            </dl>
          </section>

          {order.status === "paid" && order.delivery === "post" && <ShipForm id={order.id} />}
          {order.status === "shipped" && (
            <section className="panel p-6">
              <h2 className="text-lg font-bold">Sent {order.shippedAt ? formatDate(order.shippedAt) : ""}</h2>
              <p className="mt-1 text-ink-soft">
                {order.courier ?? "Courier not given"}
                {order.trackingNumber ? `: ${order.trackingNumber}` : ""}
              </p>
              <form action={markCompletedAction} className="mt-4">
                <input type="hidden" name="id" value={order.id} />
                <button className="btn btn-outline btn-sm">Mark as delivered</button>
              </form>
            </section>
          )}
          {order.status === "paid" && order.delivery === "pickup" && (
            <section className="panel p-6">
              <h2 className="text-lg font-bold">Pickup</h2>
              <p className="mt-1 text-ink-soft">Let the customer know when it&apos;s ready, then mark it collected when they pick it up.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={markReadyAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn btn-primary btn-sm">Ready to collect: email the customer</button>
                </form>
                <form action={markCompletedAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn btn-outline btn-sm">Mark as collected</button>
                </form>
              </div>
            </section>
          )}
          {order.status === "ready" && (
            <section className="panel p-6">
              <h2 className="text-lg font-bold">Waiting for pickup</h2>
              <form action={markCompletedAction} className="mt-4">
                <input type="hidden" name="id" value={order.id} />
                <button className="btn btn-primary btn-sm">Mark as collected</button>
              </form>
            </section>
          )}

          <section className="panel p-6">
            <h2 className="text-lg font-bold">Money for this order</h2>
            <table className="mt-4 w-full text-[0.9375rem]">
              <tbody className="divide-y divide-line">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4">{e.description}</td>
                    <td className={`py-2 text-right font-semibold ${e.amountCents < 0 ? "text-stop" : ""}`}>
                      {e.amountCents < 0 ? "−" : "+"}
                      {formatPrice(Math.abs(e.amountCents))}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2 pr-4">You earn</td>
                  <td className="py-2 text-right">{formatPrice(net)}</td>
                </tr>
              </tbody>
            </table>
            {releaseAt && (
              <p className="mt-3 text-sm text-ink-soft">
                {releaseAt > new Date() ? `On hold until ${formatDate(releaseAt)}, then available to withdraw.` : `Available to withdraw since ${formatDate(releaseAt)}.`}
              </p>
            )}
          </section>

          {canRefund && <RefundForm id={order.id} remainingCents={order.totalCents - order.refundedCents} canRestock={!!order.listingId} />}
        </div>

        <aside className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-lg font-bold">Customer</h2>
            <p className="mt-3 font-semibold">{order.buyerName ?? "—"}</p>
            {order.buyerEmail && (
              <a href={`mailto:${order.buyerEmail}?subject=${encodeURIComponent(`Your order #${order.number} from ${shop.name}`)}`} className="block text-sm text-cobalt underline underline-offset-2">
                {order.buyerEmail}
              </a>
            )}
            {order.buyerPhone && (
              <a href={`tel:${order.buyerPhone.replace(/\s/g, "")}`} className="block text-sm text-cobalt underline underline-offset-2">
                {order.buyerPhone}
              </a>
            )}
            {order.buyerNote && <p className="mt-3 border-l-[3px] border-sticker bg-paper p-3 text-sm">“{order.buyerNote}”</p>}
          </section>
          <section className="panel p-6">
            <h2 className="text-lg font-bold">{order.delivery === "post" ? "Send to" : "Pickup"}</h2>
            {order.delivery === "post" && addr ? (
              <address className="mt-3 not-italic leading-relaxed">
                {[addr.name, addr.line1, addr.line2, addr.city && `${addr.city} ${addr.postalCode ?? ""}`.trim(), addr.region].filter(Boolean).map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
            ) : (
              <p className="mt-3 text-ink-soft">{order.delivery === "pickup" ? "The customer will collect this." : "No address given."}</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
