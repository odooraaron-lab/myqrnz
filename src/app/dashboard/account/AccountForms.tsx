"use client";

import { useActionState } from "react";
import { Field, FormMessage, PasswordField, SubmitButton, type FormState } from "@/components/forms";
import { changeEmailAction, changePasswordAction, deleteAccountAction } from "../actions";

export function ChangeEmailForm({ current }: { current: string }) {
  const [state, action] = useActionState<FormState, FormData>(changeEmailAction, {});
  return (
    <form action={action} className="panel space-y-5 p-6 sm:p-7">
      <h2 className="text-lg font-bold">Login email</h2>
      <FormMessage state={state} />
      <Field label="Email" name="email" type="email" defaultValue={current} error={state.errors?.email} autoComplete="email" required />
      <PasswordField label="Current password" error={state.errors?.password} />
      <SubmitButton>Change email</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="panel space-y-5 p-6 sm:p-7">
      <h2 className="text-lg font-bold">Password</h2>
      <FormMessage state={state} />
      <PasswordField label="Current password" name="current" error={state.errors?.current} />
      <PasswordField label="New password" autoComplete="new-password" error={state.errors?.password} hint="At least 8 characters." />
      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ subdomain }: { subdomain: string }) {
  const [state, action] = useActionState<FormState, FormData>(deleteAccountAction, {});
  return (
    <details className="panel mt-6 border-stop/40 p-6 sm:p-7">
      <summary className="cursor-pointer text-lg font-bold text-stop">Delete account and shop</summary>
      <form action={action} className="mt-5 max-w-lg space-y-5">
        <FormMessage state={state} />
        <p className="text-[0.9375rem] text-ink-soft">
          This permanently deletes your shop, products, photos and enquiries. Printed QR codes will stop working and the
          address may be claimed by someone else. This can&apos;t be undone.
        </p>
        <Field label={`Type ${subdomain} to confirm`} name="confirm" error={state.errors?.confirm} autoComplete="off" required />
        <PasswordField label="Your password" error={state.errors?.password} />
        <SubmitButton className="btn btn-danger" pendingLabel="Deleting…">
          Delete everything
        </SubmitButton>
      </form>
    </details>
  );
}
