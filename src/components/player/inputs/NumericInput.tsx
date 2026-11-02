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
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  state?: "idle" | "wrong" | "correct";
  autoFocus?: boolean;
}

export function NumericInput({ value, onChange, onSubmit, disabled, placeholder, prefix, suffix, state = "idle", autoFocus }: Props) {
  const id = useId();
  const parsed = value.trim() ? parseNumber(value) : null;
  // Plain integers and decimals need no "= …" preview; expressions (1/3, sqrt(2), 2^3) do.
  const showPreview = parsed !== null && !/^-?\d*\.?\d+$/.test(value.trim());

  return (
    <div className="flex flex-col items-center gap-2">
      <label htmlFor={id} className="sr-only">
        Your answer
      </label>
      <div className="flex items-center gap-3">
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
          placeholder={placeholder ?? "e.g. 3, -1/2, sqrt(2)"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          className={cn(
            "h-14 w-56 rounded-2xl border-2 bg-surface px-4 text-center font-mono text-xl outline-none transition-colors",
            "focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-80",
            state === "idle" && "border-border-strong focus:border-blue",
            state === "wrong" && "border-danger bg-danger-soft/60",
            state === "correct" && "border-primary bg-primary-soft",
          )}
        />
        {suffix && (
          <span className="text-lg">
            <RichText text={suffix} inline />
          </span>
        )}
      </div>
      <div className="h-6 text-sm text-muted">
        {value.trim() && parsed === null ? (
          <span className="text-danger">Not a number yet — try 3, -1/2 or sqrt(2)</span>
        ) : showPreview ? (
          <span>
            = <TeX tex={formatNumberForTex(parsed!)} /> {Math.abs(parsed! - Math.round(parsed! * 1000) / 1000) > 0 ? `≈ ${parsed!.toFixed(4)}` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}
