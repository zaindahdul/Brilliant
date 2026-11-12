"use client";

import { Check, X } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";
import type { Choice } from "@/content/types";

interface Props {
  choices: Choice[];
  /** Selected ids (one for single, many for multi). */
  selected: string[];
  onChange: (ids: string[]) => void;
  multi?: boolean;
  disabled?: boolean;
  /** Ids to mark as wrong (after a miss) — stay visible but inert. */
  wrongIds?: string[];
  /** Ids to mark as correct (after reveal/correct). */
  correctIds?: string[];
}

export function ChoiceList({ choices, selected, onChange, multi = false, disabled = false, wrongIds = [], correctIds = [] }: Props) {
  const toggle = (id: string) => {
    if (disabled || wrongIds.includes(id)) return;
    if (multi) onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    else onChange([id]);
  };

  return (
    <div role={multi ? "group" : "radiogroup"} className="grid gap-2.5">
      {choices.map((c) => {
        const isSel = selected.includes(c.id);
        const isWrong = wrongIds.includes(c.id);
        const isRight = correctIds.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={isSel}
            disabled={disabled || isWrong}
            onClick={() => toggle(c.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
              isRight && "border-primary bg-primary-soft",
              isWrong && "cursor-not-allowed border-border bg-surface text-muted",
              !isRight && !isWrong && isSel && "border-blue bg-blue-soft",
              !isRight && !isWrong && !isSel && "border-border-strong bg-surface",
              !isRight && !isWrong && !isSel && !disabled && "hover:border-text/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2",
                multi ? "rounded-md" : "rounded-full",
                isRight ? "border-primary bg-primary text-white" : isWrong ? "border-danger bg-danger text-white" : isSel ? "border-blue bg-blue text-white" : "border-border-strong",
              )}
              aria-hidden
            >
              {isWrong ? <X size={12} strokeWidth={3.5} /> : isRight || isSel ? <Check size={12} strokeWidth={3.5} /> : null}
            </span>
            <span className={cn("min-w-0 flex-1 text-base leading-snug", isWrong && "line-through decoration-1")}>
              <RichText text={c.text} inline />
            </span>
          </button>
        );
      })}
    </div>
  );
}
