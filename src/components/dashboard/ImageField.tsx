"use client";

import { useId, useRef, useState } from "react";
import { uploadImage } from "@/lib/resize-client";

/** Uploads straight away and keeps the resulting URL in a hidden input. */
export function ImageField({
  label,
  name,
  kind,
  value,
  onChange,
  hint,
  shape = "square",
}: {
  label: string;
  name: string;
  kind: "logo" | "cover";
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
  shape?: "square" | "wide";
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const { url } = await uploadImage(file, kind);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="field-label" id={`${id}-label`}>
        {label}
      </p>
      <div className={`flex gap-4 ${shape === "wide" ? "flex-col" : "items-center"}`}>
        <div
          className={`relative grid shrink-0 place-items-center overflow-hidden border-[1.5px] border-dashed border-line-strong bg-paper ${
            shape === "wide" ? "aspect-[3/1] w-full" : "h-24 w-24"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className={`h-full w-full ${shape === "wide" ? "object-cover" : "object-contain p-1"}`} />
          ) : (
            <span className="px-2 text-center text-xs text-ink-soft">{busy ? "Uploading…" : "No image yet"}</span>
          )}
          {busy && value && <span className="absolute inset-0 grid place-items-center bg-card/80 text-sm font-semibold">Uploading…</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="hidden" name={name} value={value ?? ""} />
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-labelledby={`${id}-label`}
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <label htmlFor={id} className={`btn btn-outline btn-sm ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {value ? "Replace" : "Upload"}
          </label>
          {value && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => onChange(null)} disabled={busy}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
