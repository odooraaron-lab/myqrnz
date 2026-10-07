import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Start your shop",
  description: "Claim your shop address on myQR and set up your online store and QR code. One setup fee, no monthly fees.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { name } = await searchParams;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <RegisterForm initialName={(name ?? "").slice(0, 60)} />
    </div>
  );
}
