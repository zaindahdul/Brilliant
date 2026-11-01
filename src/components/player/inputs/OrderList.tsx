"use client";

import { RotateCcw, X } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";

interface Item {
  id: string;
  text: string;
}

interface Props {
  /** Items in display (shuffled) order. */
  items: Item[];
  /** Ids placed so far, in order. */
  sequence: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  state?: "idle" | "wrong" | "correct";
}

/** Tap items in order to build a sequence; tap a placed item to remove it. */
export function OrderList({ items, sequence, onChange, disabled, state = "idle" }: Props) {
  const remaining = items.filter((it) => !sequence.includes(it.id));
  return (
    <div className="grid gap-4">
      <ol
        className={cn(
          "min-h-16 rounded-2xl border-2 border-dashed p-2",
          state === "correct" ? "border-primary bg-primary-soft/60" : state === "wrong" ? "border-danger bg-danger-soft/40" : "border-border-strong bg-surface-2/60",
        )}
        aria-label="Your order"
      >
        {sequence.length === 0 && <li className="px-3 py-3 text-sm text-muted">Tap the items below in the right order.</li>}
        {sequence.map((id, i) => {
          const it = items.find((x) => x.id === id)!;
          return (
            <li key={id} className="flex items-center gap-3 rounded-xl px-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-text text-xs font-bold text-bg">{i + 1}</span>
              <span className="flex-1 text-[15px]">
                <RichText text={it.text} inline />
              </span>
              {!disabled && (
                <button type="button" aria-label="Remove" className="rounded-full p-1 text-muted hover:bg-surface-3" onClick={() => onChange(sequence.filter((x) => x !== id))}>
                  <X size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        {remaining.map((it) => (
          <button
            key={it.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange([...sequence, it.id])}
            className="rounded-2xl border-2 border-border bg-surface px-4 py-2.5 text-left text-[15px] transition-colors hover:border-border-strong disabled:opacity-60"
          >
            <RichText text={it.text} inline />
          </button>
        ))}
        {sequence.length > 0 && !disabled && (
          <button type="button" onClick={() => onChange([])} className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm text-muted hover:bg-surface-2">
            <RotateCcw size={14} /> Start over
          </button>
        )}
      </div>
    </div>
  );
}
