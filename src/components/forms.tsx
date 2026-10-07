"use client";

import { useFormStatus } from "react-dom";
import { startTransition, useActionState, useId, useState } from "react";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
  values?: Record<string, string>;
};

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}

/**
 * Like useActionState, but submits without React's automatic form reset, so long
 * edit forms keep what the seller typed (and what was saved) on screen.
 */
export function useEditForm(action: (prev: FormState, form: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, {});
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, onSubmit, pending };
}

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  name: string;
  error?: string;
  hint?: React.ReactNode;
  suffix?: React.ReactNode;
};

export function Field({ label, name, error, hint, suffix, className, ...rest }: FieldProps) {
  const id = useId();
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className={suffix ? "flex items-stretch" : undefined}>
        <input
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`input ${suffix ? "rounded-r-none" : ""}`}
          {...rest}
        />
        {suffix && (
          <span className="flex items-center whitespace-nowrap rounded-r-[3px] border-[1.5px] border-l-0 border-line-strong bg-paper px-3 text-[0.9375rem] text-ink-soft">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span id={`${id}-err`} className="field-error">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

export function TextArea({
  label,
  name,
  error,
  hint,
  className,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  name: string;
  error?: string;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="input"
        {...rest}
      />
      {error && (
        <span id={`${id}-err`} className="field-error">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

export function PasswordField({ label = "Password", name = "password", error, hint, autoComplete = "current-password", defaultValue }: {
  label?: string;
  name?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <button type="button" onClick={() => setShow((s) => !s)} className="text-sm font-medium text-ink-soft hover:text-ink">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={autoComplete === "new-password" ? 8 : undefined}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="input"
      />
      {error && (
        <span id={`${id}-err`} className="field-error">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-[3px] border px-4 py-3 text-[0.9375rem] ${
        state.ok ? "border-go/30 bg-go-wash text-go" : "border-stop/30 bg-stop-wash text-stop"
      }`}
    >
      {state.message}
    </p>
  );
}
