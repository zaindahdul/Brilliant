"use client";

import { X } from "lucide-react";
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
      <p className="text-sm text-muted">Tap the steps in order.</p>
      {sequence.length > 0 && (
        <ol className={cn("grid gap-2 rounded-xl border p-2", state === "correct" ? "border-primary" : state === "wrong" ? "border-danger" : "border-border")} aria-label="Your order">
          {sequence.map((id, i) => {
            const it = items.find((x) => x.id === id)!;
            return (
              <li key={id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-muted">{i + 1}</span>
                <span className="flex-1 text-base leading-snug">
                  <RichText text={it.text} inline />
                </span>
                {!disabled && (
                  <button type="button" aria-label="Remove" className="rounded-full p-1 text-muted hover:text-text" onClick={() => onChange(sequence.filter((x) => x !== id))}>
                    <X size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {remaining.length > 0 && (
        <div className="grid gap-2">
          {remaining.map((it) => (
            <button
              key={it.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange([...sequence, it.id])}
              className="rounded-xl border border-border-strong bg-surface px-4 py-3 text-left text-base leading-snug transition-colors hover:border-text/40 disabled:opacity-60"
            >
              <RichText text={it.text} inline />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
