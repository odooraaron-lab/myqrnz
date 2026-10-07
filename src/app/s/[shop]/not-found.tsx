import { headers } from "next/headers";
import Link from "next/link";

// Shown inside a shop for products that are gone or never existed.
export default async function ShopNotFound() {
  const base = (await headers()).get("x-myqr-shop-base") ?? "";
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="s-heading text-3xl">This item isn&apos;t available</h1>
      <p className="s-muted mt-3">It may have sold or been taken down. Have a look at what&apos;s in the shop now.</p>
      <Link href={base || "/"} className="s-btn mt-8">
        See all products
      </Link>
    </div>
  );
}
