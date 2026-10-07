"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/components/forms";
import { sendEnquiryAction } from "@/app/s/[shop]/actions";

function Send({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="s-btn w-full sm:w-auto" disabled={pending}>
      {pending ? "Sending…" : label}
    </button>
  );
}

function Input({
  label,
  name,
  error,
  textarea,
  ...rest
}: { label: string; name: string; error?: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.9375rem] font-semibold">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} name={name} className="s-input min-h-28" aria-invalid={!!error} {...rest} />
      ) : (
        <input id={id} name={name} className="s-input" aria-invalid={!!error} {...rest} />
      )}
      {error && <p className="mt-1 text-sm text-[#b42318]">{error}</p>}
    </div>
  );
}

export function EnquiryForm({
  shop,
  listingId,
  defaultMessage = "",
  submitLabel = "Send message",
  deliveryChoice = false,
}: {
  shop: string;
  listingId?: string;
  defaultMessage?: string;
  submitLabel?: string;
  /** Ask whether they want it posted or will pick it up. */
  deliveryChoice?: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(sendEnquiryAction, {});
  const [started] = useState(() => Date.now());

  if (state.ok) {
    return (
      <p role="status" className="s-card p-5 font-semibold">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="shop" value={shop} />
      <input type="hidden" name="t" value={started} />
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.message && (
        <p role="alert" className="s-card p-3 text-sm font-semibold">
          {state.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Your name" name="name" autoComplete="name" defaultValue={state.values?.name} error={state.errors?.name} required />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          error={state.errors?.email}
          required
        />
      </div>
      {deliveryChoice && (
        <fieldset>
          <legend className="mb-1.5 text-[0.9375rem] font-semibold">How would you like it?</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="delivery" value="post" defaultChecked className="h-4 w-4" style={{ accentColor: "var(--s-accent)" }} />
              Post it to me
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="delivery" value="pickup" className="h-4 w-4" style={{ accentColor: "var(--s-accent)" }} />
              I&apos;ll pick it up
            </label>
          </div>
        </fieldset>
      )}
      <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" defaultValue={state.values?.phone} error={state.errors?.phone} />
      <Input
        label="Message"
        name="message"
        textarea
        rows={4}
        defaultValue={state.values?.message ?? defaultMessage}
        error={state.errors?.message}
        required
      />
      <Send label={submitLabel} />
    </form>
  );
}
