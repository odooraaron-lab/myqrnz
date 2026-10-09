import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo href="/admin" />
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Platform admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-soft sm:inline">{admin.email}</span>
            <Link href="/dashboard" className="font-semibold underline underline-offset-2">
              My shop
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AdminNav />
        </div>
      </header>
      {children}
    </div>
  );
}
