"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Shops" },
  { href: "/admin/payouts", label: "Money and payouts" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mb-px flex gap-1">
      {ITEMS.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-[2.5px] px-3 py-3 text-[0.9375rem] font-semibold ${active ? "border-cobalt text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
