"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/orders", label: "Orders", badgeKey: "orders" as const },
  { href: "/dashboard/balance", label: "Balance" },
  { href: "/dashboard/listings", label: "Products" },
  { href: "/dashboard/shop", label: "Shop design" },
  { href: "/dashboard/qr", label: "QR codes" },
  { href: "/dashboard/enquiries", label: "Enquiries", badgeKey: "enquiries" as const },
  { href: "/dashboard/account", label: "Account" },
];

export function DashboardNav({ unread, toSend, isAdmin }: { unread: number; toSend: number; isAdmin: boolean }) {
  const path = usePathname();
  const items = isAdmin ? [...ITEMS, { href: "/admin", label: "Platform admin" }] : ITEMS;
  return (
    <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => {
          const active = "exact" in item && item.exact ? path === item.href : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-[3px] px-3 py-2.5 text-[0.9375rem] font-medium ${
                  active ? "bg-ink text-white" : "text-ink-soft hover:bg-card hover:text-ink"
                }`}
              >
                {item.label}
                {"badgeKey" in item && (item.badgeKey === "orders" ? toSend : unread) > 0 && (
                  <span
                    className={`min-w-6 rounded-full px-1.5 text-center text-xs font-bold leading-5 ${
                      active ? "bg-sticker text-ink" : "bg-cobalt text-white"
                    }`}
                  >
                    {item.badgeKey === "orders" ? toSend : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
