import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/dashboard/PageHead";
import { QrCode } from "@/components/QrCode";
import { shopUrl } from "@/config/site";
import { requireSeller } from "@/lib/auth";
import { qrTarget } from "@/lib/qr";
import { getListingForShop, shopCategories } from "@/lib/shops";
import { deleteListingAction } from "../actions";
import { ListingForm } from "../ListingForm";

export const metadata = { title: "Edit product" };

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { shop } = await requireSeller();
  const { id } = await params;
  const { created } = await searchParams;
  const listing = await getListingForShop(shop.id, id);
  if (!listing) notFound();

  const publicUrl = `${shopUrl(shop.subdomain)}/p/${listing.slug}`;
  const viewHref = shop.status === "live" ? publicUrl : `/s/${shop.subdomain}/p/${listing.slug}`;

  return (
    <>
      <Link href="/dashboard/listings" className="text-sm font-medium text-ink-soft hover:text-ink">
        Products
      </Link>
      <PageHead
        title={listing.title}
        actions={
          <>
            <a href={viewHref} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
              View in shop
            </a>
            <Link href={`/dashboard/qr?item=${listing.id}`} className="btn btn-outline btn-sm">
              Print price tag
            </Link>
          </>
        }
      />
      {created && (
        <p role="status" className="mb-6 border-[1.5px] border-go bg-go-wash px-5 py-4 text-go">
          Product added.{" "}
          <Link href="/dashboard/listings/new" className="font-semibold underline">
            Add another
          </Link>
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_15rem]">
        <ListingForm
          listing={listing}
          shop={{ name: shop.name, location: shop.location }}
          categories={await shopCategories(shop.id)}
        />
        <aside className="space-y-6">
          <div className="panel p-5">
            <p className="font-bold">This product&apos;s QR code</p>
            <QrCode value={qrTarget(shopUrl(shop.subdomain), `/p/${listing.slug}`)} margin={1} fg="#191c3a" className="mt-3 w-full" />
            <p className="mt-3 text-sm text-ink-soft">Opens this product directly. Put it beside the item on your table.</p>
          </div>
          <form action={deleteListingAction} className="panel p-5">
            <input type="hidden" name="id" value={listing.id} />
            <p className="font-bold">Delete product</p>
            <p className="mt-1 text-sm text-ink-soft">Removes it and its photos. To keep a record, mark it sold instead.</p>
            <button className="btn btn-danger btn-sm mt-3">Delete product</button>
          </form>
        </aside>
      </div>
    </>
  );
}
