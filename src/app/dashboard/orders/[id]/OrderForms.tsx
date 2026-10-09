"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, type FormState } from "@/components/forms";
import { markShippedAction, refundAction } from "../actions";

const COURIERS = ["NZ Post", "CourierPost", "NZ Couriers", "Aramex", "Post Haste", "PBT", "Other"];

export function ShipForm({ id }: { id: string }) {
  const [state, action] = useActionState<FormState, FormData>(markShippedAction, {});
  return (
    <form action={action} className="panel space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold">Send it</h2>
        <p className="mt-1 text-[0.9375rem] text-ink-soft">Add tracking if you have it. The customer gets an email either way.</p>
      </div>
      <FormMessage state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="courier" className="field-label">
            Courier
          </label>
          <select id="courier" name="courier" className="input" defaultValue="NZ Post">
            {COURIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <Field label="Tracking number (optional)" name="trackingNumber" autoComplete="off" />
      </div>
      <Field label="Tracking link (optional)" name="trackingUrl" type="url" placeholder="https://" hint="Paste the courier's tracking page if you have it." />
      <SubmitButton pendingLabel="Saving…">Mark as sent</SubmitButton>
    </form>
  );
}

export function RefundForm({ id, remainingCents, canRestock }: { id: string; remainingCents: number; canRestock: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(refundAction, {});
  const [type, setType] = useState<"full" | "partial">("full");
  const [confirm, setConfirm] = useState(false);
  return (
    <details className="panel p-6">
      <summary className="cursor-pointer text-lg font-bold">Refund this order</summary>
      <form action={action} className="mt-5 space-y-4">
        <FormMessage state={state} />
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="full" checked={type === "full"} onChange={() => setType("full")} className="h-4 w-4 accent-cobalt" />
            Full refund (${(remainingCents / 100).toFixed(2)})
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="partial" checked={type === "partial"} onChange={() => setType("partial")} className="h-4 w-4 accent-cobalt" />
            Part refund
          </label>
        </div>
        {type === "partial" && <Field label="Amount (NZD)" name="amount" inputMode="decimal" error={state.errors?.amount} className="max-w-[12rem]" />}
        {canRestock && (
          <label className="flex items-center gap-2 text-[0.9375rem]">
            <input type="checkbox" name="restock" className="h-4 w-4 accent-cobalt" />
            Put the item back in stock
          </label>
        )}
        <p className="text-sm text-ink-soft">
          The money goes back to the customer&apos;s card and comes out of your balance. The myQR fee on the refunded amount is returned to you.
        </p>
        <label className="flex items-center gap-2 text-[0.9375rem] font-medium">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="h-4 w-4 accent-cobalt" />
          I want to refund this customer
        </label>
        <SubmitButton className="btn btn-danger" pendingLabel="Refunding…" disabled={!confirm}>
          Refund
        </SubmitButton>
      </form>
    </details>
  );
}
