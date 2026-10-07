"use client";

import { useActionState, useDeferredValue, useState } from "react";
import { Field, FormMessage, SubmitButton, type FormState } from "@/components/forms";
import { useAvailability } from "@/components/useAvailability";
import { site } from "@/config/site";
import { suggestSubdomain } from "@/lib/subdomain";
import { createShopAction } from "../../actions";

export function CreateShopForm() {
  const [state, action] = useActionState<FormState, FormData>(createShopAction, {});
  const [name, setName] = useState(state.values?.shopName ?? "");
  const [sub, setSub] = useState(state.values?.subdomain ?? "");
  const [touched, setTouched] = useState(false);
  const availability = useAvailability(useDeferredValue(sub));
  return (
    <form action={action} className="panel space-y-6 p-6 sm:p-9">
      <div>
        <h1 className="font-semiwide text-3xl">Name your shop</h1>
        <p className="mt-2 text-ink-soft">Your account doesn&apos;t have a shop yet. Pick a name and address to carry on.</p>
      </div>
      <FormMessage state={state} />
      <Field
        label="Shop name"
        name="shopName"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!touched) setSub(suggestSubdomain(e.target.value));
        }}
        error={state.errors?.shopName}
        required
      />
      <Field
        label="Shop address"
        name="subdomain"
        value={sub}
        onChange={(e) => {
          setTouched(true);
          setSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
        }}
        suffix={`.${site.rootDomain.split(":")[0]}`}
        error={state.errors?.subdomain ?? (availability.state === "taken" || availability.state === "invalid" ? availability.message : undefined)}
        hint={availability.state === "free" ? <span className="font-semibold text-go">This address is available.</span> : undefined}
        required
      />
      <SubmitButton pendingLabel="Creating…">Create my shop</SubmitButton>
    </form>
  );
}
