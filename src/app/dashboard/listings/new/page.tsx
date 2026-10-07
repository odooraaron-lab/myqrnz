import Link from "next/link";
import { PageHead } from "@/components/dashboard/PageHead";
import { requireSeller } from "@/lib/auth";
import { shopCategories } from "@/lib/shops";
import { ListingForm } from "../ListingForm";

export const metadata = { title: "Add a product" };

export default async function NewListingPage() {
  const { shop } = await requireSeller();
  return (
    <>
      <Link href="/dashboard/listings" className="text-sm font-medium text-ink-soft hover:text-ink">
        Products
      </Link>
      <PageHead title="Add a product" />
      <ListingForm shop={{ name: shop.name, location: shop.location }} categories={await shopCategories(shop.id)} />
    </>
  );
}
