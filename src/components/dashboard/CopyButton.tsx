"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copy", className = "btn btn-outline" }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy this link:", value);
        }
      }}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
