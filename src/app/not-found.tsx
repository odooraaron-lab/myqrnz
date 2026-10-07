import { headers } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { rootUrl, shopHost } from "@/config/site";
import { getShopBySubdomain } from "@/lib/shops";
import { subdomainProblem } from "@/lib/subdomain";

export default async function NotFound() {
  const h = await headers();
  const sub = h.get("x-myqr-shop");
  const onShopHost = sub !== null && h.get("x-myqr-shop-base") === "";

  // Someone visited an unclaimed shop address: offer it to them.
  if (onShopHost && sub && !subdomainProblem(sub) && !(await getShopBySubdomain(sub).catch(() => null))) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-start justify-center px-4 py-20">
        <Logo href={rootUrl("/")} />
        <h1 className="font-wide mt-10 text-[clamp(2rem,6vw,3rem)]">{shopHost(sub)} is available.</h1>
        <p className="mt-4 text-lg text-ink-soft">
          There&apos;s no shop here yet. If this is your business name, it could be your online store with a QR code for your
          stall or counter.
        </p>
        <a href={rootUrl(`/register?name=${encodeURIComponent(sub.replace(/-/g, " "))}`)} className="btn btn-primary mt-8">
          Claim {sub}
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center px-4 py-20">
      <Logo href={onShopHost ? rootUrl("/") : "/"} />
      <h1 className="font-wide mt-10 text-4xl">This page isn&apos;t here.</h1>
      <p className="mt-4 text-lg text-ink-soft">The link may be old, or the address may have a typo.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
