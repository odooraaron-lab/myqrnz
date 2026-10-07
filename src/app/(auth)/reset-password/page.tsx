import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <div className="panel space-y-4 p-6 sm:p-9">
          <h1 className="font-semiwide text-3xl">This link is incomplete</h1>
          <p className="text-ink-soft">Open the link from your email again, or ask for a new one.</p>
          <Link href="/forgot-password" className="btn btn-primary">
            Send a new link
          </Link>
        </div>
      )}
    </div>
  );
}
