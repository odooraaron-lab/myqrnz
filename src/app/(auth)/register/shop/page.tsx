import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserShop, requireUser } from "@/lib/auth";
import { CreateShopForm } from "./CreateShopForm";

export const metadata: Metadata = { title: "Name your shop", robots: { index: false } };

export default async function CreateShopPage() {
  const user = await requireUser();
  if (await getUserShop(user.id)) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:py-20">
      <CreateShopForm />
    </div>
  );
}
