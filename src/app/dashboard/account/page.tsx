import { PageHead } from "@/components/dashboard/PageHead";
import { shopHost } from "@/config/site";
import { requireSeller } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { signOutEverywhereAction, unpublishShopAction } from "../actions";
import { ChangeEmailForm, ChangePasswordForm, DeleteAccountForm } from "./AccountForms";

export const metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ offline?: string }> }) {
  const { user, shop } = await requireSeller();
  const { offline } = await searchParams;
  return (
    <>
      <PageHead title="Account" intro={`Signed in as ${user.email}. Account created ${formatDate(user.createdAt)}.`} />
      {offline && (
        <p role="status" className="mb-6 border border-line bg-card px-5 py-4">
          Your shop is offline. Visitors see a &ldquo;coming soon&rdquo; page until you publish again from the overview.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChangeEmailForm current={user.email} />
        <ChangePasswordForm />
        <section className="panel p-6 sm:p-7">
          <h2 className="text-lg font-bold">Signed-in devices</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">Lost a phone or used a shared computer? Sign out everywhere, including here.</p>
          <form action={signOutEverywhereAction} className="mt-5">
            <button className="btn btn-outline">Sign out everywhere</button>
          </form>
        </section>
        <section className="panel p-6 sm:p-7">
          <h2 className="text-lg font-bold">Your shop address</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">
            <strong className="text-ink">{shopHost(shop.subdomain)}</strong>
            {shop.publishedAt ? `, published ${formatDate(shop.publishedAt)}.` : ", not published yet."} The address
            can&apos;t change because your printed QR codes point to it.
          </p>
          {shop.status === "live" && (
            <form action={unpublishShopAction} className="mt-5">
              <button className="btn btn-outline">Take my shop offline</button>
            </form>
          )}
        </section>
      </div>
      <DeleteAccountForm subdomain={shop.subdomain} />
    </>
  );
}
