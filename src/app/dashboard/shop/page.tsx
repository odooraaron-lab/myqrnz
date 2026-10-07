import { PageHead } from "@/components/dashboard/PageHead";
import { requireSeller } from "@/lib/auth";
import { ShopForm } from "./ShopForm";

export const metadata = { title: "Shop design" };

export default async function ShopDesignPage() {
  const { shop } = await requireSeller();
  return (
    <>
      <PageHead
        title="Shop design"
        intro="Your name, logo, look and contact details. Changes show on your shop as soon as you save."
        actions={
          <a href={`/s/${shop.subdomain}`} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
            Preview shop
          </a>
        }
      />
      <ShopForm shop={shop} />
    </>
  );
}
