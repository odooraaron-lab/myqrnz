import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { loadStorefront } from "@/lib/storefront";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

type Props = { params: Promise<{ shop: string; token: string }>; searchParams: Promise<{ paid?: string }> };

export default async function OrderStatusPage({ params, searchParams }: Props) {
  const { shop: sub, token } = await params;
  const { paid } = await searchParams;
  const ctx = await loadStorefront(sub);
  if (!ctx) notFound();
  const { shop, base } = ctx;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.shopId, shop.id), eq(orders.publicToken, token)))
    .limit(1);
  if (!order) notFound();

  const confirming = order.status === "pending" && paid === "1";
  const pickup = order.delivery === "pickup";
  const steps = [
    { label: "Paid", done: !!order.paidAt, when: order.paidAt },
    pickup
      ? { label: "Ready to collect", done: ["ready", "completed"].includes(order.status), when: order.shippedAt }
      : { label: "Sent", done: ["shipped", "completed"].includes(order.status), when: order.shippedAt },
    { label: pickup ? "Collected" : "Delivered", done: order.status === "completed", when: order.completedAt },
  ];
  const addr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {confirming && <meta httpEquiv="refresh" content="3" />}
      <p className="s-muted text-sm font-semibold">Order #{order.number}</p>
      <h1 className="s-heading mt-1 text-[clamp(1.8rem,5vw,2.6rem)]">
        {confirming
          ? "Confirming your payment…"
          : order.status === "refunded"
            ? "This order was refunded"
            : order.status === "cancelled"
              ? "This order wasn't completed"
              : order.status === "completed"
                ? pickup
                  ? "Collected. Enjoy!"
                  : "Delivered. Enjoy!"
                : order.status === "shipped"
                  ? "Your order is on its way"
                  : order.status === "ready"
                    ? "Ready to collect"
                    : "Thanks, your order is in"}
      </h1>
      {paid === "1" && !confirming && order.paidAt && (
        <p className="mt-3">A receipt is on its way to {order.buyerEmail ?? "your email"}.</p>
      )}

      {order.paidAt && order.status !== "refunded" && order.status !== "cancelled" && (
        <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-col gap-2">
              <span
                className="h-1.5 w-full"
                style={{ background: s.done ? "var(--s-accent)" : "var(--s-line)", borderRadius: 99 }}
                aria-hidden="true"
              />
              <span className={`text-sm font-semibold ${s.done ? "" : "s-muted"}`}>
                {s.label}
                <span className="sr-only">{s.done ? " (done)" : " (to come)"}</span>
              </span>
              {s.done && s.when && <span className="s-muted text-xs">{i === 0 ? formatDateTime(s.when) : formatDate(s.when)}</span>}
            </li>
          ))}
        </ol>
      )}

      {order.status === "shipped" && (order.courier || order.trackingNumber) && (
        <div className="s-card mt-6 p-4">
          <p className="font-semibold">Tracking</p>
          <p className="mt-1 text-sm">
            {order.courier}
            {order.courier && order.trackingNumber ? ": " : ""}
            {order.trackingNumber}
          </p>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener" className="s-link mt-2 inline-block text-sm">
              Track the parcel
            </a>
          )}
        </div>
      )}
      {pickup && order.status !== "completed" && shop.pickupInfo && (
        <div className="s-card mt-6 p-4">
          <p className="font-semibold">Pickup</p>
          <p className="mt-1 whitespace-pre-line text-sm">{shop.pickupInfo}</p>
        </div>
      )}

      <div className="s-card mt-6 p-4 sm:p-5">
        <dl className="space-y-2 text-[0.9375rem]">
          <div className="flex justify-between gap-4">
            <dt>
              {order.itemTitle}
              {order.quantity > 1 && ` × ${order.quantity}`}
            </dt>
            <dd>{formatPrice(order.unitPriceCents * order.quantity)}</dd>
          </div>
          {!pickup && (
            <div className="flex justify-between gap-4">
              <dt>Shipping</dt>
              <dd>{order.shippingCents ? formatPrice(order.shippingCents) : "Free"}</dd>
            </div>
          )}
          <div className="s-line flex justify-between gap-4 border-t pt-2 font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
          {order.refundedCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt>Refunded</dt>
              <dd>−{formatPrice(order.refundedCents)}</dd>
            </div>
          )}
        </dl>
        {addr && (
          <p className="s-muted mt-4 text-sm">
            Sending to {[addr.name, addr.line1, addr.line2, addr.city, addr.postalCode].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      <p className="s-muted mt-6 text-sm">
        Questions about your order?{" "}
        <Link href={`${base || "/"}#contact`} className="s-link">
          Contact {shop.name}
        </Link>
        . Payment was processed by myQR on behalf of {shop.name}.
      </p>
    </div>
  );
}
