"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, type FormState } from "@/components/forms";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <title>Reset your password | myQR</title>
      <form action={action} className="panel space-y-6 p-6 sm:p-9">
        <div>
          <h1 className="font-semiwide text-3xl">Reset your password</h1>
          <p className="mt-2 text-ink-soft">Enter the email you signed up with and we&apos;ll send you a link.</p>
        </div>
        <FormMessage state={state} />
        {!state.ok && (
          <>
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values?.email}
              error={state.errors?.email}
              required
            />
            <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
          </>
        )}
        <p className="border-t border-line pt-5 text-[0.9375rem] text-ink-soft">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
