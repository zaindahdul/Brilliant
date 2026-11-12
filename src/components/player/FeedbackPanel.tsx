"use client";

import { Check } from "lucide-react";
import { Math as TeX, RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";

export type Phase = "answering" | "wrong1" | "correct" | "revealed";

interface Props {
  phase: Exclude<Phase, "answering">;
  hint?: string;
  explanation: string;
  /** Shown on reveal. Leave out when the answer is already marked on screen (multiple choice). */
  answer?: { kind: "text" | "math"; value: string };
  /** In practice mode we don't show the targeted hint on the first miss. */
  practice?: boolean;
}

/** What the learner sees after pressing Check. The buttons live in the action bar. */
export function FeedbackPanel({ phase, hint, explanation, answer, practice }: Props) {
  const good = phase === "correct";
  return (
    <div
      ref={(el) => el?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
      className={cn("slide-up mt-6 scroll-mb-28 rounded-2xl p-5", good ? "bg-primary-soft" : "bg-surface-2")}
      role="status"
      aria-live="polite"
    >
      <p className={cn("flex items-center gap-1.5 text-sm font-semibold", good ? "text-primary-ink" : phase === "wrong1" ? "text-danger" : "text-text")}>
        {good && <Check size={16} strokeWidth={3} />}
        {good ? "Correct" : phase === "wrong1" ? "Not quite" : "Solution"}
      </p>

      <div className="mt-2 text-[15.5px] leading-relaxed">
        {phase === "wrong1" && (practice ? <p>Take another look. You have one more try.</p> : hint ? <RichText text={hint} /> : <p>Read the question again and give it one more try.</p>)}

        {phase === "revealed" && (
          <div className="grid gap-2">
            {answer && (
              <p className="font-medium">
                The answer is {answer.kind === "math" ? <TeX tex={answer.value} /> : <RichText text={answer.value.replace(/[.\s]+$/, "")} inline />}.
              </p>
            )}
            <RichText text={explanation} />
          </div>
        )}

        {phase === "correct" && <RichText text={explanation} />}
      </div>
    </div>
  );
}
