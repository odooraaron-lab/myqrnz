"use client";

import Link from "next/link";
import { useActionState, useDeferredValue, useState } from "react";
import { Field, FormMessage, PasswordField, SubmitButton, type FormState } from "@/components/forms";
import { StallSign } from "@/components/marketing/StallSign";
import { useAvailability } from "@/components/useAvailability";
import { site } from "@/config/site";
import { previewTarget } from "@/lib/qr";
import { suggestSubdomain } from "@/lib/subdomain";
import { registerAction } from "../actions";

const host = site.rootDomain.split(":")[0];

export function RegisterForm({ initialName }: { initialName: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  const [shopName, setShopName] = useState(state.values?.shopName ?? initialName);
  const [subdomain, setSubdomain] = useState(state.values?.subdomain ?? suggestSubdomain(initialName));
  const [touched, setTouched] = useState(Boolean(state.values?.subdomain));
  const deferredName = useDeferredValue(shopName);
  const deferredSub = useDeferredValue(subdomain);
  const availability = useAvailability(deferredSub);

  const subError =
    state.errors?.subdomain ??
    (availability.state === "taken" || availability.state === "invalid" ? availability.message : undefined);

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_380px] lg:items-start">
      <form action={action} className="panel space-y-6 p-6 sm:p-9" noValidate>
        <div>
          <h1 className="font-semiwide text-3xl">Start your shop</h1>
          <p className="mt-2 text-ink-soft">Takes about two minutes. You can change everything except your address later.</p>
        </div>

        <FormMessage state={state} />

        <Field
          label="Shop name"
          name="shopName"
          value={shopName}
          onChange={(e) => {
            setShopName(e.target.value);
            if (!touched) setSubdomain(suggestSubdomain(e.target.value));
          }}
          error={state.errors?.shopName}
          hint="As it appears on your stall sign or shopfront."
          autoComplete="organization"
          maxLength={60}
          required
        />

        <div>
          <Field
            label="Shop address"
            name="subdomain"
            value={subdomain}
            onChange={(e) => {
              setTouched(true);
              setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            suffix={`.${host}`}
            error={subError}
            hint={
              availability.state === "free" ? (
                <span className="font-semibold text-go">This address is available.</span>
              ) : (
                "Lowercase letters, numbers and hyphens. This can't change once your shop is published."
              )
            }
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            required
          />
        </div>

        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={state.values?.email}
          error={state.errors?.email}
          hint="For signing in and receiving customer enquiries."
          autoComplete="email"
          required
        />

        <PasswordField label="Password" autoComplete="new-password" error={state.errors?.password} hint="At least 8 characters." />

        <div>
          <label className="flex items-start gap-3 text-[0.9375rem]">
            <input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-cobalt" required />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline underline-offset-2">
                terms of use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {state.errors?.terms && <span className="field-error">{state.errors.terms}</span>}
        </div>

        <SubmitButton className="btn btn-primary w-full text-base" pendingLabel="Creating your shop…">
          Create my shop
        </SubmitButton>

        <p className="text-center text-[0.9375rem] text-ink-soft">
          Already have a shop?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </form>

      <aside className="hidden lg:block">
        <StallSign
          name={deferredName}
          address={`${deferredSub || "yourname"}.${host}`}
          qrValue={previewTarget(deferredSub || undefined)}
          sticker={false}
        />
        <p className="mt-10 text-center text-sm text-ink-soft">
          Your QR code is ready to print as soon as you publish.
        </p>
      </aside>
    </div>
  );
}
