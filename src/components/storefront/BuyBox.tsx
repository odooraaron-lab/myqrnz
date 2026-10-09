"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/components/forms";
import { buyNowAction } from "@/app/s/[shop]/actions";

const nzd = (cents: number) =>
  new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

function Pay({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="s-btn w-full text-base" disabled={pending}>
      {pending ? "Opening secure checkout…" : `Buy now · ${nzd(total)}`}
    </button>
  );
}

export function BuyBox({
  shop,
  listingId,
  priceCents,
  shippingCents,
  pickup,
  maxQuantity,
  pickupNote,
}: {
  shop: string;
  listingId: string;
  priceCents: number;
  shippingCents: number | null;
  pickup: boolean;
  maxQuantity: number;
  pickupNote?: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(buyNowAction, {});
  const canPost = shippingCents !== null;
  const [delivery, setDelivery] = useState<"post" | "pickup">(canPost ? "post" : "pickup");
  const [qty, setQty] = useState(1);
  const total = priceCents * qty + (delivery === "post" ? (shippingCents ?? 0) : 0);

  return (
    <form action={action} className="s-card mt-6 space-y-4 p-4 sm:p-5">
      <input type="hidden" name="shop" value={shop} />
      <input type="hidden" name="listingId" value={listingId} />
      {canPost && pickup ? (
        <fieldset>
          <legend className="mb-2 text-[0.9375rem] font-semibold">Delivery</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["post", `Post to me · ${shippingCents ? nzd(shippingCents) : "Free"}`],
                ["pickup", "I'll pick it up · Free"],
              ] as const
            ).map(([v, label]) => (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-2 p-3 text-[0.9375rem]"
                style={{ border: `1.5px solid ${delivery === v ? "var(--s-accent)" : "var(--s-line)"}`, borderRadius: "var(--s-radius)" }}
              >
                <input type="radio" name="delivery" value={v} checked={delivery === v} onChange={() => setDelivery(v)} style={{ accentColor: "var(--s-accent)" }} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="delivery" value={canPost ? "post" : "pickup"} />
      )}
      {delivery === "pickup" && pickupNote && <p className="s-muted text-sm">{pickupNote}</p>}

      {maxQuantity > 1 && (
        <label className="flex items-center gap-3 text-[0.9375rem] font-semibold">
          Quantity
          <select name="quantity" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="s-input !w-24 !min-h-10">
            {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      {maxQuantity <= 1 && <input type="hidden" name="quantity" value="1" />}

      {state.message && (
        <p role="alert" className="text-sm font-semibold text-[#b42318]">
          {state.message}
        </p>
      )}
      <Pay total={total} />
      <p className="s-muted text-center text-xs">Secure card payment by Stripe. Apple Pay and Google Pay where available.</p>
    </form>
  );
}
