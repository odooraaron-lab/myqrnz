"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, PasswordField, SubmitButton, type FormState } from "@/components/forms";
import { resetPasswordAction } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="panel space-y-6 p-6 sm:p-9">
      <div>
        <h1 className="font-semiwide text-3xl">Choose a new password</h1>
        <p className="mt-2 text-ink-soft">You&apos;ll be signed out on other devices and logged in here.</p>
      </div>
      <FormMessage state={state} />
      {state.message ? (
        <Link href="/forgot-password" className="btn btn-primary">
          Send a new link
        </Link>
      ) : (
        <>
          <input type="hidden" name="token" value={token} />
          <PasswordField label="New password" autoComplete="new-password" error={state.errors?.password} hint="At least 8 characters." />
          <SubmitButton pendingLabel="Saving…">Save new password</SubmitButton>
        </>
      )}
    </form>
  );
}
