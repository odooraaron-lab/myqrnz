"use client";

import { useEffect, useState } from "react";

export type Availability = { state: "idle" | "checking" | "free" | "taken" | "invalid"; message?: string };

/** Debounced check that a shop address is valid and unclaimed. */
export function useAvailability(slug: string, skip = false): Availability {
  const [status, setStatus] = useState<Availability>({ state: "idle" });
  useEffect(() => {
    if (!slug || skip) {
      setStatus({ state: "idle" });
      return;
    }
    setStatus({ state: "checking" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/subdomain-check?name=${encodeURIComponent(slug)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { available: boolean | null; problem: string | null };
        if (data.available === null) setStatus({ state: "idle" });
        else if (data.available) setStatus({ state: "free" });
        else setStatus({ state: data.problem?.startsWith("Someone") ? "taken" : "invalid", message: data.problem ?? undefined });
      } catch {
        /* aborted or offline */
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [slug, skip]);
  return status;
}
