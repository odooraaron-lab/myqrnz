"use client";

import { useEffect } from "react";

/** Removes ?qr after a scan has been counted, so shared links stay clean. */
export function StripQrParam() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("qr")) {
      url.searchParams.delete("qr");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }, []);
  return null;
}
