import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/" className="text-sm font-medium text-ink-soft hover:text-ink">
            Back to the home page
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
