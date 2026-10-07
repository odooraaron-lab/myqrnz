import Link from "next/link";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/market-stalls", label: "Market stalls" },
  { href: "/small-business", label: "Small shops" },
  { href: "/guides", label: "Guides" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85 sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-3 py-2 text-[0.9375rem] font-medium text-ink-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-quiet btn-sm hidden sm:inline-flex">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Start your shop
          </Link>
          <details className="relative lg:hidden">
            <summary className="btn btn-quiet btn-sm list-none [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </summary>
            <div className="panel absolute right-0 mt-2 w-60 p-2 shadow-[0_8px_24px_rgb(25_28_58/0.12)]">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-sm px-3 py-2.5 font-medium hover:bg-paper">
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="block rounded-sm px-3 py-2.5 font-medium hover:bg-paper sm:hidden">
                Log in
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
