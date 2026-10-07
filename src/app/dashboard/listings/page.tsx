import Link from "next/link";
import { PageHead } from "@/components/dashboard/PageHead";
import { shopUrl } from "@/config/site";
import { requireSeller } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getAllListingsForShop } from "@/lib/shops";
import { setListingStatusAction } from "./actions";
import { ReorderButtons } from "./ReorderButtons";

export const metadata = { title: "Products" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "For sale" },
  { key: "sold", label: "Sold" },
  { key: "hidden", label: "Hidden" },
  { key: "draft", label: "Drafts" },
] as const;

const BADGE: Record<string, string> = {
  active: "bg-go-wash text-go",
  sold: "bg-ink text-white",
  hidden: "bg-paper text-ink-soft border border-line",
  draft: "bg-sticker/60 text-ink",
};
const LABEL: Record<string, string> = { active: "For sale", sold: "Sold", hidden: "Hidden", draft: "Draft" };

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ status?: string; deleted?: string }> }) {
  const { shop } = await requireSeller();
  const { status = "all", deleted } = await searchParams;
  const all = await getAllListingsForShop(shop.id);
  const shown = status === "all" ? all : all.filter((l) => l.status === status);
  const base = shop.status === "live" ? shopUrl(shop.subdomain) : `/s/${shop.subdomain}`;

  return (
    <>
      <PageHead
        title="Products"
        intro="Everything in your shop. The order here is the order customers see."
        actions={
          <Link href="/dashboard/listings/new" className="btn btn-primary">
            Add a product
          </Link>
        }
      />

      {deleted && (
        <p role="status" className="mb-6 border border-line bg-card px-5 py-3">
          Product deleted.
        </p>
      )}

      {all.length === 0 ? (
        <div className="panel grid place-items-center px-6 py-16 text-center">
          <h2 className="font-semiwide text-2xl">Add your first product</h2>
          <p className="mt-2 max-w-md text-ink-soft">
            Start with the thing people ask about most at your stall. A photo, a name and a price is enough to begin.
          </p>
          <Link href="/dashboard/listings/new" className="btn btn-primary mt-6">
            Add a product
          </Link>
        </div>
      ) : (
        <>
          <nav aria-label="Filter products" className="mb-4 flex flex-wrap gap-1">
            {FILTERS.map((f) => {
              const n = f.key === "all" ? all.length : all.filter((l) => l.status === f.key).length;
              const active = status === f.key;
              return (
                <Link
                  key={f.key}
                  href={f.key === "all" ? "/dashboard/listings" : `/dashboard/listings?status=${f.key}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-[3px] px-3 py-1.5 text-sm font-medium ${active ? "bg-ink text-white" : "text-ink-soft hover:bg-card"}`}
                >
                  {f.label} <span className="opacity-70">{n}</span>
                </Link>
              );
            })}
          </nav>

          <ul className="panel divide-y divide-line">
            {shown.map((l) => {
              const index = all.findIndex((x) => x.id === l.id);
              return (
                <li key={l.id} className="flex items-center gap-4 p-3 sm:p-4">
                  <Link href={`/dashboard/listings/${l.id}`} className="shrink-0">
                    {l.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.images[0].url} alt="" className="h-16 w-16 border border-line object-cover sm:h-20 sm:w-20" />
                    ) : (
                      <span className="grid h-16 w-16 place-items-center border border-dashed border-line-strong text-xs text-ink-soft sm:h-20 sm:w-20">
                        No photo
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/listings/${l.id}`} className="block truncate font-semibold hover:text-cobalt">
                      {l.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {formatPrice(l.priceCents)}
                      {l.shippingCents === null
                        ? ", pickup only"
                        : l.shippingCents === 0
                          ? ", free shipping"
                          : `, ${formatPrice(l.shippingCents)} shipping`}
                      {l.quantity !== null && l.quantity !== 1 && `, ${l.quantity} in stock`}
                    </p>
                    <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[l.status]}`}>
                      {LABEL[l.status]}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {status === "all" && <ReorderButtons ids={all.map((x) => x.id)} index={index} />}
                    {l.status === "active" && (
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="sold" />
                        <button className="btn btn-quiet btn-sm hidden sm:inline-flex">Mark sold</button>
                      </form>
                    )}
                    {(l.status === "sold" || l.status === "hidden" || l.status === "draft") && (
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="active" />
                        <button className="btn btn-quiet btn-sm hidden sm:inline-flex">Put on sale</button>
                      </form>
                    )}
                    {(l.status === "active" || l.status === "sold") && (
                      <a href={`${base}/p/${l.slug}`} target="_blank" rel="noopener" className="btn btn-quiet btn-sm hidden md:inline-flex">
                        View
                      </a>
                    )}
                    <Link href={`/dashboard/listings/${l.id}`} className="btn btn-outline btn-sm">
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
            {shown.length === 0 && <li className="p-6 text-ink-soft">Nothing here.</li>}
          </ul>
        </>
      )}
    </>
  );
}
