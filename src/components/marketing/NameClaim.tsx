"use client";

import Link from "next/link";
import { useDeferredValue, useId, useState } from "react";
import { useAvailability } from "@/components/useAvailability";
import { site } from "@/config/site";
import { previewTarget } from "@/lib/qr";
import { suggestSubdomain } from "@/lib/subdomain";
import { StallSign } from "./StallSign";

const host = site.rootDomain.split(":")[0];

/** Hero: type a shop name, see your address and a live QR on a stall sign. */
export function NameClaimHero({ defaultName = "Tōtara Honey" }: { defaultName?: string }) {
  const [name, setName] = useState(defaultName);
  const deferred = useDeferredValue(name);
  const slug = suggestSubdomain(deferred);
  const status = useAvailability(slug);
  const inputId = useId();
  const address = `${slug || "yourname"}.${host}`;

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div>
        <h1 className="font-wide text-[clamp(2.4rem,6.4vw,4.4rem)] text-ink">
          Your market stall, open online all week.
        </h1>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
          Claim your shop name, list what you sell, and print a QR code for your stall or counter. Customers scan it and buy
          from your own online store. One setup fee of ${site.setupFee}. No monthly fees.
        </p>

        <form action="/register" method="get" className="mt-9 max-w-xl">
          <label htmlFor={inputId} className="field-label">
            Your shop name
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id={inputId}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="organization"
              className="input h-[3.25rem] text-lg"
              aria-describedby={`${inputId}-status`}
            />
            <button type="submit" className="btn btn-primary h-[3.25rem] px-6 text-base" disabled={status.state === "taken" || status.state === "invalid"}>
              Claim this name
            </button>
          </div>
          <p id={`${inputId}-status`} className="mt-3 min-h-[1.5rem] text-[0.9375rem]" aria-live="polite">
            <span className="font-semibold text-ink">{address}</span>{" "}
            {status.state === "checking" && <span className="text-ink-soft">is being checked</span>}
            {status.state === "free" && <span className="font-semibold text-go">is available</span>}
            {(status.state === "taken" || status.state === "invalid") && <span className="text-stop">— {status.message}</span>}
          </p>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          Already selling with us?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>

      <StallSign name={deferred} address={address} qrValue={previewTarget(slug || undefined)} />
    </div>
  );
}
