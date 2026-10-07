import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to manage your myQR shop.",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <LoginForm next={next} />
    </div>
  );
}
