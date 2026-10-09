import type { Metadata } from "next";
import { and, count, eq, isNull } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { shopHost, shopUrl } from "@/config/site";
import { db } from "@/db";
import { enquiries, orders } from "@/db/schema";
import { isAdmin, requireSeller } from "@/lib/auth";
import { logoutAction } from "../(auth)/actions";
import { DashboardNav } from "./DashboardNav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | myQR dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, shop } = await requireSeller();
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(enquiries)
    .where(and(eq(enquiries.shopId, shop.id), isNull(enquiries.readAt)));
  const [{ toSend }] = await db
    .select({ toSend: count() })
    .from(orders)
    .where(and(eq(orders.shopId, shop.id), eq(orders.status, "paid")));
  const live = shop.status === "live";
  const viewHref = live ? shopUrl(shop.subdomain) : `/s/${shop.subdomain}`;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="border-b border-line bg-paper lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 pt-4 lg:px-5 lg:pt-6">
          <Logo href="/dashboard" />
          <form action={logoutAction} className="lg:hidden">
            <button className="btn btn-quiet btn-sm">Log out</button>
          </form>
        </div>
        <div className="px-4 pb-3 pt-4 lg:px-5">
          <p className="truncate font-bold" title={shop.name}>
            {shop.name}
          </p>
          <a href={viewHref} target="_blank" rel="noopener" className="mt-0.5 block truncate text-sm text-cobalt underline underline-offset-2">
            {shopHost(shop.subdomain)}
          </a>
          <p className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                live ? "bg-go-wash text-go" : shop.status === "suspended" ? "bg-stop-wash text-stop" : "bg-sticker/60 text-ink"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-go" : shop.status === "suspended" ? "bg-stop" : "bg-ink"}`} />
              {live ? "Live" : shop.status === "suspended" ? "Suspended" : "Not published"}
            </span>
          </p>
        </div>
        <div className="px-4 pb-3 lg:flex-1 lg:px-3 lg:pt-2">
          <DashboardNav unread={unread} toSend={toSend} isAdmin={isAdmin(user)} />
        </div>
        <div className="hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-sm text-ink-soft" title={user.email}>
            {user.email}
          </p>
          <form action={logoutAction}>
            <button className="mt-1 text-sm font-semibold text-ink underline underline-offset-2">Log out</button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
