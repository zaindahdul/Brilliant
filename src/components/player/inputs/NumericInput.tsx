"use client";

import { useId } from "react";
import { Math as TeX, RichText } from "@/components/ui/RichText";
import { parseNumber, formatNumberForTex } from "@/lib/check";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  state?: "idle" | "wrong" | "correct";
  autoFocus?: boolean;
}

/** An empty answer box: no sample text inside it. Help appears underneath only when the input can't be read. */
export function NumericInput({ value, onChange, onSubmit, disabled, prefix, suffix, state = "idle", autoFocus }: Props) {
  const id = useId();
  const parsed = value.trim() ? parseNumber(value) : null;
  const unreadable = value.trim() !== "" && parsed === null;
  // Plain integers and decimals need no "= …" preview; expressions (1/3, sqrt(2), 2^3) do.
  const showPreview = parsed !== null && !/^-?\d*\.?\d+$/.test(value.trim());

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="sr-only">
        Your answer
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {prefix && (
          <span className="text-lg">
            <RichText text={prefix} inline />
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          disabled={disabled}
          aria-invalid={unreadable || undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          className={cn(
            "h-12 w-44 rounded-xl border bg-surface px-3.5 font-mono text-lg outline-none transition-colors",
            "focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-90",
            state === "idle" && "border-border-strong focus:border-blue",
            state === "wrong" && "border-danger",
            state === "correct" && "border-primary",
          )}
        />
        {suffix && (
          <span className="text-lg">
            <RichText text={suffix} inline />
          </span>
        )}
        {showPreview && (
          <span className="text-sm text-muted">
            = <TeX tex={formatNumberForTex(parsed!)} />
            {Math.abs(parsed! - Math.round(parsed! * 1000) / 1000) > 0 ? ` ≈ ${parsed!.toFixed(4)}` : ""}
          </span>
        )}
      </div>
      {unreadable && <p className="text-sm text-muted">Type a number. Fractions (1/3), powers (2^3) and sqrt(2) work too.</p>}
    </div>
  );
}
