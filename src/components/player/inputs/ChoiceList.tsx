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
      {choices.map((c, i) => {
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
              "group flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150",
              "bg-surface hover:border-border-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
              isSel && !isWrong && !isRight && "border-blue bg-blue-soft/60",
              !isSel && !isWrong && !isRight && "border-border",
              isWrong && "border-danger/60 bg-danger-soft/70 opacity-80 cursor-not-allowed",
              isRight && "border-primary bg-primary-soft",
              disabled && !isRight && !isWrong && "opacity-80",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                multi ? "rounded-md" : "rounded-full",
                isRight ? "border-primary bg-primary text-white" : isWrong ? "border-danger bg-danger text-white" : isSel ? "border-blue bg-blue text-white" : "border-border-strong text-muted",
              )}
              aria-hidden
            >
              {isRight ? <Check size={14} strokeWidth={3} /> : isWrong ? <X size={14} strokeWidth={3} /> : isSel ? <Check size={14} strokeWidth={3} /> : String.fromCharCode(65 + i)}
            </span>
            <span className="min-w-0 flex-1 text-[15.5px] leading-snug">
              <RichText text={c.text} inline />
            </span>
          </button>
        );
      })}
    </div>
  );
}
