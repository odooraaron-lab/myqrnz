"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, PasswordField, SubmitButton, type FormState } from "@/components/forms";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="panel space-y-6 p-6 sm:p-9">
      <div>
        <h1 className="font-semiwide text-3xl">Log in to your shop</h1>
        <p className="mt-2 text-ink-soft">Manage your products, print QR codes and read enquiries.</p>
      </div>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
      <PasswordField />
      <div className="flex items-center justify-between gap-4">
        <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
        <Link href="/forgot-password" className="text-[0.9375rem] font-medium text-ink-soft underline underline-offset-2 hover:text-ink">
          Forgot your password?
        </Link>
      </div>
      <p className="border-t border-line pt-5 text-[0.9375rem] text-ink-soft">
        New here?{" "}
        <Link href="/register" className="font-semibold text-ink underline underline-offset-2">
          Start your shop
        </Link>
      </p>
    </form>
  );
}
