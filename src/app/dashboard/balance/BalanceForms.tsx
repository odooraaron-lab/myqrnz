"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, type FormState } from "@/components/forms";
import { requestPayoutAction, saveBankAccountAction } from "./actions";

export function PayoutForm({ availableCents, minCents }: { availableCents: number; minCents: number }) {
  const [state, action] = useActionState<FormState, FormData>(requestPayoutAction, {});
  if (state.ok) {
    return (
      <p role="status" className="border-[1.5px] border-go bg-go-wash px-4 py-3 font-semibold text-go">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label="Amount (NZD)"
          name="amount"
          inputMode="decimal"
          defaultValue={(availableCents / 100).toFixed(2)}
          error={state.errors?.amount}
          hint={`Minimum $${(minCents / 100).toFixed(2)}.`}
          className="w-48"
        />
        <SubmitButton pendingLabel="Requesting…" className="btn btn-primary mb-[1.6rem]">
          Request payout
        </SubmitButton>
      </div>
    </form>
  );
}

export function BankForm({ name, number }: { name: string | null; number: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveBankAccountAction, {});
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name on the account" name="accountName" defaultValue={state.values?.accountName ?? name ?? ""} error={state.errors?.accountName} autoComplete="name" />
        <Field
          label="NZ bank account number"
          name="accountNumber"
          defaultValue={state.values?.accountNumber ?? number ?? ""}
          error={state.errors?.accountNumber}
          placeholder="12-3456-0123456-00"
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <SubmitButton className="btn btn-outline">{number ? "Update bank account" : "Save bank account"}</SubmitButton>
    </form>
  );
}
